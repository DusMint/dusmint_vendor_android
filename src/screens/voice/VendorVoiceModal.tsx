import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Vibration,
  ScrollView,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioWaveformVisualizer } from './widgets/AudioWaveformVisualizer';
import {
  parseVendorVoiceCommand,
  ParsedVendorCommand,
} from '../../services/vendorVoiceCommandParser';
import {
  isSpeechRecognitionSupported,
  requestSpeechPermissions,
  startSpeechRecognition,
  stopSpeechRecognition,
  useSafeSpeechEvent,
} from '../../services/safeSpeechService';
import { useVendorStockStore } from '../../state/useVendorStockStore';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const VendorVoiceModal: React.FC<Props> = ({ visible, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastExecutedCommand, setLastExecutedCommand] = useState<ParsedVendorCommand | null>(null);
  const [undoState, setUndoState] = useState<(() => void) | null>(null);
  const [undoTimerSeconds, setUndoTimerSeconds] = useState(5);
  const [customPrompt, setCustomPrompt] = useState('');
  const isSpeechSupported = isSpeechRecognitionSupported();
  const promptInputRef = useRef<TextInput>(null);

  const selectedLanguage = useVendorAuthStore((s) => s.selectedLanguage || 'hi');
  const isStoreOpen = useVendorAuthStore((s) => s.isStoreOpen);
  const setStoreOpen = useVendorAuthStore((s) => s.setStoreOpen);
  const setPendingOrdersCount = useVendorAuthStore((s) => s.setPendingOrdersCount);
  const pendingOrdersCount = useVendorAuthStore((s) => s.pendingOrdersCount ?? 2);

  // Pulse animation for mic outer halo
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const undoProgressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible, isListening, pulseAnim]);

  // Execute the parsed command on active Zustand stores
  const executeCommand = useCallback(
    (parsed: ParsedVendorCommand) => {
      try {
        Vibration.vibrate(35);
      } catch {}

      setLastExecutedCommand(parsed);
      setUndoTimerSeconds(5);
      undoProgressAnim.setValue(1);

      if (timerRef.current) clearInterval(timerRef.current);

      let reverseAction: (() => void) | null = null;

      switch (parsed.action) {
        case 'ADD_STOCK': {
          if (parsed.matchedStockId) {
            const stockStore = useVendorStockStore.getState();
            const res = stockStore.updateStockDelta(
              parsed.matchedStockId,
              parsed.deltaKg,
              parsed.deltaGrams
            );
            if (res) {
              reverseAction = () => {
                stockStore.updateStockDelta(
                  parsed.matchedStockId!,
                  -parsed.deltaKg,
                  -parsed.deltaGrams
                );
              };
            }
          }
          break;
        }

        case 'SET_OUT_OF_STOCK': {
          if (parsed.matchedStockId) {
            const stockStore = useVendorStockStore.getState();
            stockStore.toggleStockStatus(parsed.matchedStockId, false);
            reverseAction = () => {
              stockStore.toggleStockStatus(parsed.matchedStockId!, true);
            };
          }
          break;
        }

        case 'SET_IN_STOCK': {
          if (parsed.matchedStockId) {
            const stockStore = useVendorStockStore.getState();
            stockStore.toggleStockStatus(parsed.matchedStockId, true);
            reverseAction = () => {
              stockStore.toggleStockStatus(parsed.matchedStockId!, false);
            };
          }
          break;
        }

        case 'UPDATE_PRICE': {
          if (parsed.matchedStockId && parsed.newPriceRupees) {
            const stockStore = useVendorStockStore.getState();
            const res = stockStore.updateItemPrice(parsed.matchedStockId, parsed.newPriceRupees);
            if (res) {
              const oldPrice = res.prevPrice;
              reverseAction = () => {
                stockStore.updateItemPrice(parsed.matchedStockId!, oldPrice);
              };
            }
          }
          break;
        }

        case 'STORE_TOGGLE': {
          if (parsed.targetStoreOpen !== undefined) {
            const prev = isStoreOpen;
            setStoreOpen(parsed.targetStoreOpen);
            reverseAction = () => {
              setStoreOpen(prev);
            };
          }
          break;
        }

        case 'ORDER_ACCEPT': {
          const prevCount = pendingOrdersCount;
          setPendingOrdersCount(Math.max(0, prevCount - 1));
          reverseAction = () => {
            setPendingOrdersCount(prevCount);
          };
          break;
        }

        default:
          break;
      }

      setUndoState(() => reverseAction);

      // Start 5-second countdown animation
      Animated.timing(undoProgressAnim, {
        toValue: 0,
        duration: 5000,
        useNativeDriver: false,
      }).start();

      let remaining = 5;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setUndoTimerSeconds(remaining);
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setUndoState(null);
        }
      }, 1000);
    },
    [isStoreOpen, pendingOrdersCount, setStoreOpen, setPendingOrdersCount, undoProgressAnim]
  );

  // Undo execution handler
  const handleUndo = () => {
    if (undoState) {
      try {
        Vibration.vibrate(20);
      } catch {}
      undoState();
      setUndoState(null);
      if (timerRef.current) clearInterval(timerRef.current);
      setLastExecutedCommand((prev) =>
        prev
          ? {
              ...prev,
              userFeedbackHi: 'कमांड पूर्ववत (Undo) कर दी गई है।',
              userFeedbackEn: 'Action reverted / undone successfully.',
            }
          : null
      );
    }
  };

  // Safe Speech Event Listeners
  useSafeSpeechEvent('start', () => {
    setIsListening(true);
    setTranscript('');
  });

  useSafeSpeechEvent('end', () => {
    setIsListening(false);
  });

  useSafeSpeechEvent('result', (event) => {
    const rawResult = event?.results?.[0]?.transcript || '';
    setTranscript(rawResult);

    if (event?.isFinal && rawResult.trim().length > 0) {
      stopSpeechRecognition();
      const parsed = parseVendorVoiceCommand(rawResult);
      executeCommand(parsed);
    }
  });

  useSafeSpeechEvent('error', (event) => {
    console.warn('SafeSpeech Error:', event?.error, event?.message);
    setIsListening(false);
  });

  const handleSendCustomPrompt = () => {
    const q = customPrompt.trim();
    if (!q) return;
    setTranscript(q);
    setIsListening(false);
    stopSpeechRecognition();
    const parsed = parseVendorVoiceCommand(q);
    executeCommand(parsed);
    setCustomPrompt('');
  };

  // Toggle voice recognition
  const toggleListening = async () => {
    try {
      Vibration.vibrate(40);
    } catch {}

    if (isListening) {
      stopSpeechRecognition();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setTranscript('');

    if (isSpeechRecognitionSupported()) {
      try {
        const granted = await requestSpeechPermissions();
        if (!granted) {
          setIsListening(false);
          return;
        }

        const langCode = selectedLanguage === 'mr' ? 'mr-IN' : selectedLanguage === 'gu' ? 'gu-IN' : 'hi-IN';
        startSpeechRecognition({
          lang: langCode,
          interimResults: true,
          extraLanguages: ['en-IN', 'hi-IN'],
        });
      } catch {
        // Fallback to visual active listening
      }
    } else {
      // In Expo Go dev client: activate live listening animation immediately
      promptInputRef.current?.focus();
    }
  };

  // Trigger test chip
  const handleTestCommand = (phrase: string) => {
    setTranscript(phrase);
    setIsListening(false);
    stopSpeechRecognition();
    const parsed = parseVendorVoiceCommand(phrase);
    executeCommand(parsed);
  };

  // Auto-listen when modal opens
  useEffect(() => {
    if (visible) {
      setTranscript('');
      setLastExecutedCommand(null);
      setUndoState(null);
      toggleListening();
    } else {
      stopSpeechRecognition();
      setIsListening(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      stopSpeechRecognition();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={styles.voiceSheet}>
          {/* Top Sheet Drag Handle */}
          <View style={styles.sheetHandle} />

          {/* Header Row: Title + Regional Language Badge + Close */}
          <View style={styles.voiceHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Ionicons name="mic" size={20} color="#047A36" style={{ marginRight: 6 }} />
                <Text style={styles.voiceTitle}>Google Mic Assistant</Text>
              </View>
              <Text style={styles.voiceSubtitle}>
                Boliye: Stock, Rate, Order, Payout & Dukan Band/Chalu
              </Text>
            </View>

            {/* Language Badge */}
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>
                {selectedLanguage === 'mr' ? 'मराठी + English' : selectedLanguage === 'gu' ? 'ગુજરાતી + Eng' : 'हिंदी + Hinglish'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Center Visualizer & Active Listening State */}
          <View style={styles.visualizerSection}>
            <View style={styles.micCircleWrapper}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: isListening
                      ? pulseAnim.interpolate({
                          inputRange: [1, 1.25],
                          outputRange: [0.65, 0],
                        })
                      : 0,
                  },
                ]}
              />
              <TouchableOpacity
                style={[styles.micBigButton, isListening && styles.micBigButtonActive]}
                onPress={toggleListening}
                activeOpacity={0.85}
              >
                <Ionicons name="mic" size={36} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* 7-Bar Audio Waveform Visualizer */}
            <View style={{ height: 42, justifyContent: 'center', marginTop: 10 }}>
              <AudioWaveformVisualizer isListening={isListening} barColor="#047A36" />
            </View>

            {/* Status Pill */}
            <View style={[styles.statusBadge, isListening ? styles.statusBadgeActive : styles.statusBadgeIdle]}>
              <View style={[styles.statusDot, isListening && styles.statusDotActive]} />
              <Text style={styles.statusText}>
                {isListening ? 'Google Mic सुन रहा है... (Speak now)' : 'Tap Mic to Speak'}
              </Text>
            </View>
          </View>

          {/* Live Recognized Speech Transcript Box */}
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>RECOGNIZED VOICE</Text>
            <Text style={styles.transcriptText} numberOfLines={2}>
              {transcript.trim().length > 0 ? `"${transcript}"` : 'Listening for spoken produce or action...'}
            </Text>
          </View>

          {/* Custom Command Prompt Input Bar */}
          <View style={styles.promptInputContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color="#047A36" style={{ marginRight: 8 }} />
            <TextInput
              ref={promptInputRef}
              style={styles.promptInput}
              placeholder="Type or voice-type (e.g. 10 kg Aalu add karo)..."
              placeholderTextColor="#94A3B8"
              value={customPrompt}
              onChangeText={setCustomPrompt}
              onSubmitEditing={handleSendCustomPrompt}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendPromptBtn,
                customPrompt.trim().length === 0 && styles.sendPromptBtnDisabled,
              ]}
              onPress={handleSendCustomPrompt}
              disabled={customPrompt.trim().length === 0}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Dev / Hardware Notice if running in Expo Go without native module compiled */}
          {!isSpeechSupported && (
            <View style={styles.devNoticeBanner}>
              <Ionicons name="information-circle" size={15} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.devNoticeText}>
                Live Mic hardware requires compiled APK (`npx expo run:android`). Use prompt input above or tap chips below to test instantly!
              </Text>
            </View>
          )}

          {/* Real-time Execution & 5-Second Undo Toast Card */}
          {lastExecutedCommand && (
            <View style={styles.executionCard}>
              <View style={styles.execHeaderRow}>
                <View style={styles.execIconCircle}>
                  <Ionicons name="checkmark-circle" size={20} color="#047A36" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.execTitle}>Action Confirmed</Text>
                  <Text style={styles.execDesc}>{lastExecutedCommand.userFeedbackHi}</Text>
                  <Text style={styles.execDescEn}>{lastExecutedCommand.userFeedbackEn}</Text>
                </View>

                {undoState && (
                  <TouchableOpacity style={styles.undoBtn} onPress={handleUndo} activeOpacity={0.8}>
                    <Ionicons name="arrow-undo" size={15} color="#DC2626" style={{ marginRight: 4 }} />
                    <Text style={styles.undoBtnText}>Undo ({undoTimerSeconds}s)</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Progress Countdown Bar */}
              {undoState && (
                <View style={styles.progressBarBg}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: undoProgressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          )}

          {/* Quick Vernacular Sample Prompt Chips */}
          <Text style={styles.sampleSectionTitle}>TAP OR SPEAK IN REGIONAL DIALECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleScroll}>
            {[
              '20 kilo Tamatar add karo',
              'Aadha kilo Paneer add karo',
              'Pyaaz khatam ho gaya',
              'Aalu ka rate 30 rupay',
              'Dukan band kar do',
              'Dukan khol do',
              'Aaj kitna kamaya',
              'Naya order accept karo',
            ].map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.sampleChip}
                onPress={() => handleTestCommand(chip)}
                activeOpacity={0.75}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={13} color="#047A36" style={{ marginRight: 4 }} />
                <Text style={styles.sampleChipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeVoiceBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeVoiceBtnText}>Close Assistant</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  voiceSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  voiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  voiceSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  langBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  langBadgeText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 11,
    fontWeight: '800',
    color: '#047A36',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  micCircleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 84,
    height: 84,
  },
  pulseRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#A7F3D0',
  },
  micBigButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#047A36',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  micBigButtonActive: {
    backgroundColor: '#059669',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeIdle: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#94A3B8',
    marginRight: 7,
  },
  statusDotActive: {
    backgroundColor: '#047A36',
  },
  statusText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  transcriptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  transcriptLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  transcriptText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 21,
  },
  promptInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 8,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  promptInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sendPromptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#047A36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPromptBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  devNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  devNoticeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  executionCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  execHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  execIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  execTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 13,
    fontWeight: '800',
    color: '#047A36',
  },
  execDesc: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  execDescEn: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
    marginTop: 1,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  undoBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 11.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: '#DCFCE7',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#16A34A',
  },
  sampleSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sampleScroll: {
    gap: 8,
    paddingBottom: 6,
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  sampleChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  closeVoiceBtn: {
    backgroundColor: '#047A36',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  closeVoiceBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
