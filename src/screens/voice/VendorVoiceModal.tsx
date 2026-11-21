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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioWaveformVisualizer } from './widgets/AudioWaveformVisualizer';
import { GoogleVoiceWaveform } from './widgets/GoogleVoiceWaveform';
import { GoogleMicIcon } from './widgets/GoogleMicIcon';
import { isGoogleSpeechAvailable, startGoogleSpeech, addGoogleSpeechListener } from '../../utils/GoogleSpeech';
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
import { speakConfirmationAloud, stopSpeaking } from '../../services/textToSpeechService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface PendingConfirmation {
  title: string;
  promptHi: string;
  promptEn: string;
  options?: Array<{ label: string; onSelect: () => void }>;
  onConfirm?: () => void;
  onCancel: () => void;
}

export const VendorVoiceModal: React.FC<Props> = ({ visible, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastExecutedCommand, setLastExecutedCommand] = useState<ParsedVendorCommand | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
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

  // Listen to live partial speech recognition results streamed in real-time
  useEffect(() => {
    const sub = addGoogleSpeechListener('onSpeechPartial', (data) => {
      if (data?.partial) {
        setTranscript(data.partial);
      }
    });
    return () => {
      sub.remove();
    };
  }, []);

  // Execute the state change on active stores (used directly for low-impact, or after confirmation for high-impact)
  const applyCommandExecution = useCallback(
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

  // Command handler separating high-impact confirmation from low-impact undo-only
  const executeCommand = useCallback(
    (parsed: ParsedVendorCommand) => {
      // 1. High-Impact Actions Require Explicit Confirmation (Haan / Nahi)
      if (parsed.isHighImpact) {
        if (parsed.action === 'STORE_TOGGLE' && parsed.targetStoreOpen === false) {
          setPendingConfirmation({
            title: 'दुकान बंद करें?',
            promptHi: 'क्या आप दुकान बंद करना चाहते हैं? नए ऑनलाइन ऑर्डर आना बंद हो जाएंगे।',
            promptEn: 'Are you sure you want to close the shop? Incoming orders will stop.',
            onConfirm: () => {
              setPendingConfirmation(null);
              applyCommandExecution(parsed);
              speakConfirmationAloud('दुकान बंद कर दी गई है।');
            },
            onCancel: () => {
              setPendingConfirmation(null);
              speakConfirmationAloud('रद्द किया गया।');
            },
          });
          speakConfirmationAloud('क्या आप दुकान बंद करना चाहते हैं?');
          return;
        }

        if (parsed.action === 'SET_OUT_OF_STOCK') {
          const itemName = parsed.matchedItemNameEn || 'इस आइटम';
          setPendingConfirmation({
            title: `${itemName} आउट ऑफ स्टॉक?`,
            promptHi: `क्या आप ${itemName} को Out of Stock करना चाहते हैं? ग्राहक इसे ऑर्डर नहीं कर पाएंगे।`,
            promptEn: `Do you want to mark ${itemName} as Out of Stock?`,
            onConfirm: () => {
              setPendingConfirmation(null);
              applyCommandExecution(parsed);
              speakConfirmationAloud(`${itemName} आउट ऑफ स्टॉक कर दिया गया है।`);
            },
            onCancel: () => {
              setPendingConfirmation(null);
              speakConfirmationAloud('रद्द किया गया।');
            },
          });
          speakConfirmationAloud(`क्या आप ${itemName} को आउट ऑफ स्टॉक करना चाहते हैं?`);
          return;
        }

        if (parsed.action === 'ORDER_ACCEPT') {
          const PENDING_ORDERS = [
            { code: '#DM-8821', customer: 'Rohit Sharma', total: 465 },
            { code: '#DM-8825', customer: 'Pooja Verma', total: 280 },
          ];

          if (parsed.orderCodeRequested) {
            const found = PENDING_ORDERS.find((o) => o.code === parsed.orderCodeRequested) || PENDING_ORDERS[0];
            setPendingConfirmation({
              title: `ऑर्डर ${found.code} स्वीकार करें?`,
              promptHi: `ग्राहक: ${found.customer} • कुल राशि: ₹${found.total}`,
              promptEn: `Customer: ${found.customer} • Total: ₹${found.total}`,
              onConfirm: () => {
                setPendingConfirmation(null);
                applyCommandExecution(parsed);
                speakConfirmationAloud(`ऑर्डर ${found.code} स्वीकार कर लिया गया है।`);
              },
              onCancel: () => {
                setPendingConfirmation(null);
                speakConfirmationAloud('रद्द किया गया।');
              },
            });
            speakConfirmationAloud(`ऑर्डर ${found.code}, स्वीकार करें?`);
            return;
          }

          // Multiple orders pending: ask which one
          setPendingConfirmation({
            title: 'कौन सा ऑर्डर स्वीकार करें?',
            promptHi: '2 पेंडिंग ऑर्डर हैं। कृपया चुनें:',
            promptEn: '2 pending orders available. Please choose:',
            options: PENDING_ORDERS.map((ord) => ({
              label: `${ord.code} (${ord.customer} • ₹${ord.total})`,
              onSelect: () => {
                setPendingConfirmation(null);
                applyCommandExecution(parsed);
                speakConfirmationAloud(`ऑर्डर ${ord.code} स्वीकार कर लिया गया है।`);
              },
            })),
            onCancel: () => {
              setPendingConfirmation(null);
              speakConfirmationAloud('रद्द किया गया।');
            },
          });
          speakConfirmationAloud('दो पेंडिंग ऑर्डर हैं। कौन सा स्वीकार करें?');
          return;
        }
      }

      // 2. Low-Impact Actions (Add Stock, Price Update, etc.): Auto-execute with 5s Undo buffer
      applyCommandExecution(parsed);
      speakConfirmationAloud(parsed.userFeedbackHi);
    },
    [applyCommandExecution]
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

  // Toggle voice recognition via Google Speech
  const toggleListening = async () => {
    try {
      Vibration.vibrate(35);
    } catch {}

    if (isListening) {
      stopSpeechRecognition();
      setIsListening(false);
      return;
    }

    setTranscript('');
    setIsListening(true);

    const langCode = selectedLanguage === 'mr' ? 'mr-IN' : selectedLanguage === 'gu' ? 'gu-IN' : 'hi-IN';

    // 1. Try Native Android Google Speech Activity first (The real Google Assistant Voice dialog)
    try {
      const googleAvailable = await isGoogleSpeechAvailable();
      if (googleAvailable) {
        const result = await startGoogleSpeech(
          'DusMint: बोलिए... (e.g. 20 kg aloo add karo)',
          langCode
        );
        setIsListening(false);
        if (result?.transcript && result.transcript.trim().length > 0) {
          const spoken = result.transcript.trim();
          setTranscript(spoken);
          try {
            const parsed = parseVendorVoiceCommand(spoken);
            executeCommand(parsed);
          } catch (cmdErr) {
            console.warn('Voice command parse/execution error:', cmdErr);
          }
          return;
        }
        return;
      }
    } catch (err) {
      console.warn('Native GoogleSpeech error or cancelled:', err);
      setIsListening(false);
    }

    // 2. Try ExpoSpeechRecognition if present in custom build
    if (isSpeechRecognitionSupported()) {
      try {
        const granted = await requestSpeechPermissions();
        if (granted) {
          startSpeechRecognition({
            lang: langCode,
            interimResults: true,
            extraLanguages: ['en-IN', 'hi-IN'],
          });
          return;
        }
      } catch (e) {
        console.warn('Speech recognition error:', e);
      }
    }

    // 3. Fallback: activate Gboard Google Voice typing focus
    promptInputRef.current?.focus();
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.45)" />
      <View style={styles.modalBackdrop}>
        {/* Semi-transparent Dimmed Backdrop: acts as a true drawer sheet where the stock page behind is visible */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        {/* Crisp White Bottom Drawer Sheet */}
        <View style={styles.voiceSheet}>
          {/* Top Sheet Drag Handle */}
          <View style={styles.sheetHandle} />

          {/* Minimal Clean Header: Title + Close Icon */}
          <View style={styles.voiceHeaderRow}>
            <View style={styles.titleRow}>
              <View style={styles.googleDotsMiniRow}>
                <View style={[styles.googleDotMini, { backgroundColor: '#4285F4' }]} />
                <View style={[styles.googleDotMini, { backgroundColor: '#EA4335' }]} />
                <View style={[styles.googleDotMini, { backgroundColor: '#FBBC05' }]} />
                <View style={[styles.googleDotMini, { backgroundColor: '#34A853' }]} />
              </View>
              <Text style={styles.voiceTitle}>Google Mic</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Centerpiece: Clean Google Mic with 4-Color Waveform */}
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
                style={[styles.googleMicBigButton, isListening && styles.googleMicBigButtonActive]}
                onPress={toggleListening}
                activeOpacity={0.85}
              >
                <GoogleMicIcon size={44} />
              </TouchableOpacity>
            </View>

            {/* Authentic Google 4-Color Animated Bouncing Dots */}
            <GoogleVoiceWaveform isListening={isListening} size="large" />

            {/* Direct Status Text */}
            <Text style={styles.statusDirectText}>
              {isListening ? 'बोलिए... (Listening)' : 'बोलने के लिए माइक दबाएं'}
            </Text>
          </View>

          {/* Direct Spoken & Action Feedback */}
          {lastExecutedCommand && !pendingConfirmation ? (
            <View style={styles.executionCardDirect}>
              <View style={styles.execHeaderRow}>
                <View style={styles.execIconCircle}>
                  <Ionicons name="checkmark-circle" size={20} color="#047A36" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.execTitleDirect}>{lastExecutedCommand.userFeedbackHi}</Text>
                  {transcript.trim().length > 0 && (
                    <Text style={styles.execSpokenQuote}>"{transcript}"</Text>
                  )}
                </View>

                {undoState && (
                  <TouchableOpacity style={styles.undoBtn} onPress={handleUndo} activeOpacity={0.8}>
                    <Ionicons name="arrow-undo" size={14} color="#DC2626" style={{ marginRight: 4 }} />
                    <Text style={styles.undoBtnText}>Undo ({undoTimerSeconds}s)</Text>
                  </TouchableOpacity>
                )}
              </View>

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
          ) : pendingConfirmation ? (
            <View style={styles.confirmPromptCardDirect}>
              <View style={styles.confirmHeaderRow}>
                <Ionicons name="help-circle" size={22} color="#D97706" style={{ marginRight: 8 }} />
                <Text style={styles.confirmPromptTitle}>{pendingConfirmation.title}</Text>
              </View>
              <Text style={styles.confirmPromptMsgHi}>{pendingConfirmation.promptHi}</Text>

              {pendingConfirmation.options ? (
                <View style={styles.optionsList}>
                  {pendingConfirmation.options.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.optionBtn}
                      onPress={opt.onSelect}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="receipt-outline" size={16} color="#047A36" style={{ marginRight: 6 }} />
                      <Text style={styles.optionBtnText}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.cancelBtnWide}
                    onPress={pendingConfirmation.onCancel}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>✕ रद्द करें (Cancel)</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.confirmActionRow}>
                  <TouchableOpacity
                    style={styles.cancelConfirmBtn}
                    onPress={pendingConfirmation.onCancel}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelConfirmBtnText}>✕ नहीं (No)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptConfirmBtn}
                    onPress={pendingConfirmation.onConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.acceptConfirmBtnText}>✓ हाँ (Yes)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            transcript.trim().length > 0 && (
              <View style={styles.transcriptBoxDirect}>
                <Text style={styles.transcriptTextDirect}>"{transcript}"</Text>
              </View>
            )
          )}

          {/* Quick Direct Voice Chips */}
          <View style={styles.chipsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleScrollDirect}>
              {[
                { label: '+ 20 kg आलू', text: '20 kilo Aloo add karo' },
                { label: '✕ दुकान बंद', text: 'Dukan band karo' },
                { label: '✓ ऑर्डर लें', text: 'Naya order accept karo' },
                { label: '! टमाटर समाप्त', text: 'Desi Tamatar out of stock' },
                { label: '+ 10 kg प्याज', text: '10 kilo Pyaaz add karo' },
                { label: '₹ आज की कमाई', text: 'Aaj kitna kamaya' },
              ].map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.sampleChipDirect}
                  onPress={() => handleTestCommand(chip.text)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.sampleChipTextDirect}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Semi-transparent dimmed backdrop so the stock inventory page behind is visible as a drawer
    justifyContent: 'flex-end',
  },
  voiceSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 10,
  },
  voiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    marginVertical: 4,
  },
  micCircleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 86,
    height: 86,
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(66, 133, 244, 0.22)',
  },
  googleDotsMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 6,
  },
  googleDotMini: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  googleDotMicro: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  googleMicBigButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  googleMicBigButtonActive: {
    borderColor: '#EA4335',
    shadowColor: '#EA4335',
  },
  statusDirectText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginTop: -2,
    marginBottom: 8,
  },
  executionCardDirect: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  execHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  execIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  execTitleDirect: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  execSpokenQuote: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    fontStyle: 'italic',
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  confirmPromptCardDirect: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  confirmPromptTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  confirmPromptMsgHi: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  confirmActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  cancelConfirmBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  acceptConfirmBtn: {
    flex: 1.3,
    backgroundColor: '#047A36',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptConfirmBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  optionsList: {
    gap: 6,
    marginTop: 2,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  cancelBtnWide: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  transcriptBoxDirect: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    alignItems: 'center',
  },
  transcriptTextDirect: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  chipsSection: {
    marginTop: 2,
    paddingBottom: 2,
  },
  sampleScrollDirect: {
    gap: 8,
    paddingVertical: 2,
  },
  sampleChipDirect: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  sampleChipTextDirect: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
});
