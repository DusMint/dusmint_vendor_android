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
  StatusBar,
  PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  isGoogleSpeechAvailable,
  startGoogleSpeech,
  stopGoogleSpeech,
} from '../../utils/GoogleSpeech';
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
import { speakConfirmationAloud } from '../../services/textToSpeechService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface PendingConfirmation {
  title: string;
  prompt: string;
  options?: Array<{ label: string; onSelect: () => void }>;
  onConfirm?: () => void;
  onCancel: () => void;
}

const QUICK_COMMANDS = [
  { label: '+ 20 kg Potato', text: '20 kilo Aloo add karo' },
  { label: '✕ Close Shop', text: 'Dukan band karo' },
  { label: '✓ Accept Order', text: 'Naya order accept karo' },
  { label: '! Tomato Out of Stock', text: 'Desi Tamatar out of stock' },
  { label: '+ 10 kg Onion', text: '10 kilo Pyaaz add karo' },
  { label: "₹ Today's Earnings", text: 'Aaj kitna kamaya' },
];

export const VendorVoiceModal: React.FC<Props> = ({ visible, onClose }) => {
  const [hasResult, setHasResult] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastExecutedCommand, setLastExecutedCommand] = useState<ParsedVendorCommand | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [undoState, setUndoState] = useState<(() => void) | null>(null);
  const [undoTimerSeconds, setUndoTimerSeconds] = useState(5);

  const selectedLanguage = useVendorAuthStore((s) => s.selectedLanguage || 'hi');
  const isStoreOpen = useVendorAuthStore((s) => s.isStoreOpen);
  const setStoreOpen = useVendorAuthStore((s) => s.setStoreOpen);
  const setPendingOrdersCount = useVendorAuthStore((s) => s.setPendingOrdersCount);
  const pendingOrdersCount = useVendorAuthStore((s) => s.pendingOrdersCount ?? 2);

  const undoProgressAnim = useRef(new Animated.Value(1)).current;
  const sheetSlideAnim = useRef(new Animated.Value(340)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth slide-up animation for the bottom sheet only (prevents ugly black backdrop sliding)
  useEffect(() => {
    if (visible && hasResult) {
      sheetSlideAnim.setValue(340);
      Animated.spring(sheetSlideAnim, {
        toValue: 0,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, hasResult, sheetSlideAnim]);

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
      // 1. High-Impact Actions Require Explicit Confirmation
      if (parsed.isHighImpact) {
        if (parsed.action === 'STORE_TOGGLE' && parsed.targetStoreOpen === false) {
          setPendingConfirmation({
            title: 'Close Shop?',
            prompt: 'Are you sure you want to close the shop? New online orders will stop.',
            onConfirm: () => {
              setPendingConfirmation(null);
              applyCommandExecution(parsed);
              speakConfirmationAloud('Shop has been closed.');
            },
            onCancel: () => {
              setPendingConfirmation(null);
              speakConfirmationAloud('Action cancelled.');
            },
          });
          speakConfirmationAloud('Do you want to close the shop?');
          return;
        }

        if (parsed.action === 'SET_OUT_OF_STOCK') {
          const itemName = parsed.matchedItemNameEn || 'this item';
          setPendingConfirmation({
            title: `Mark ${itemName} Out of Stock?`,
            prompt: `Are you sure you want to mark ${itemName} as Out of Stock? Customers will not be able to order it.`,
            onConfirm: () => {
              setPendingConfirmation(null);
              applyCommandExecution(parsed);
              speakConfirmationAloud(`${itemName} is marked out of stock.`);
            },
            onCancel: () => {
              setPendingConfirmation(null);
              speakConfirmationAloud('Action cancelled.');
            },
          });
          speakConfirmationAloud(`Do you want to mark ${itemName} out of stock?`);
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
              title: `Accept Order ${found.code}?`,
              prompt: `Customer: ${found.customer} • Total: ₹${found.total}`,
              onConfirm: () => {
                setPendingConfirmation(null);
                applyCommandExecution(parsed);
                speakConfirmationAloud(`Order ${found.code} accepted.`);
              },
              onCancel: () => {
                setPendingConfirmation(null);
                speakConfirmationAloud('Action cancelled.');
              },
            });
            speakConfirmationAloud(`Accept order ${found.code}?`);
            return;
          }

          // Multiple orders pending: ask which one
          setPendingConfirmation({
            title: 'Which order would you like to accept?',
            prompt: 'You have 2 pending orders. Please select one:',
            options: PENDING_ORDERS.map((ord) => ({
              label: `${ord.code} (${ord.customer} • ₹${ord.total})`,
              onSelect: () => {
                setPendingConfirmation(null);
                applyCommandExecution(parsed);
                speakConfirmationAloud(`Order ${ord.code} accepted.`);
              },
            })),
            onCancel: () => {
              setPendingConfirmation(null);
              speakConfirmationAloud('Action cancelled.');
            },
          });
          speakConfirmationAloud('Which order would you like to accept?');
          return;
        }
      }

      // 2. Low-Impact Actions (Add Stock, Price Update, etc.): Auto-execute with 5s Undo buffer
      applyCommandExecution(parsed);
      speakConfirmationAloud(parsed.userFeedbackEn || parsed.userFeedbackHi);
    },
    [applyCommandExecution]
  );

  // Handle successful interpreted spoken phrase -> opens the bottom sheet
  const handleSpokenSuccess = useCallback(
    (spokenText: string) => {
      setTranscript(spokenText);
      stopSpeechRecognition();
      try {
        stopGoogleSpeech();
      } catch {}
      const parsed = parseVendorVoiceCommand(spokenText);
      executeCommand(parsed);
      setHasResult(true);
    },
    [executeCommand]
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
              userFeedbackEn: 'Action reverted / undone successfully.',
              userFeedbackHi: 'Action undone.',
            }
          : null
      );
    }
  };

  // Safe Speech Event Listeners
  useSafeSpeechEvent('result', (event) => {
    const rawResult = event?.results?.[0]?.transcript || '';
    if (event?.isFinal && rawResult.trim().length > 0) {
      handleSpokenSuccess(rawResult.trim());
    }
  });

  useSafeSpeechEvent('error', (event) => {
    console.warn('SafeSpeech Error:', event?.error, event?.message);
    if (!hasResult) {
      onClose();
    }
  });

  // Start listening directly via Google Speech
  const startListeningProcess = useCallback(async () => {
    try {
      Vibration.vibrate(30);
    } catch {}

    // Ensure RECORD_AUDIO permission is requested and granted
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'Dusmint Partner needs microphone access to listen to voice commands.',
              buttonPositive: 'Allow',
              buttonNegative: 'Cancel',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            if (!hasResult) {
              onClose();
            }
            return;
          }
        }
      } catch (permErr) {
        console.warn('Microphone permission request error:', permErr);
      }
    }

    const langCode =
      selectedLanguage === 'en'
        ? 'en-IN'
        : selectedLanguage === 'mr'
        ? 'mr-IN'
        : selectedLanguage === 'gu'
        ? 'gu-IN'
        : 'hi-IN';
    const speechPrompt = 'Try speaking: "20 kilo aloo add karo"...';

    // 1. Try Native Android Google Speech Module (activates official Google Voice Dialogue Box)
    try {
      const googleAvailable = await isGoogleSpeechAvailable();
      if (googleAvailable) {
        const result = await startGoogleSpeech(speechPrompt, langCode);
        if (result?.transcript && result.transcript.trim().length > 0) {
          handleSpokenSuccess(result.transcript.trim());
          return;
        } else {
          // Cancelled or no speech detected
          if (!hasResult) {
            onClose();
          }
          return;
        }
      }
    } catch (err) {
      console.warn('GoogleSpeech invocation error:', err);
      if (!hasResult) {
        onClose();
      }
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

    if (!hasResult) {
      onClose();
    }
  }, [handleSpokenSuccess, hasResult, onClose, selectedLanguage]);

  // When speak button is clicked in bottom navigation:
  // Launch Google Mic service directly without showing any white background box
  useEffect(() => {
    if (visible) {
      setTranscript('');
      setLastExecutedCommand(null);
      setPendingConfirmation(null);
      setUndoState(null);
      setHasResult(false);
      startListeningProcess();
    } else {
      stopSpeechRecognition();
      try {
        stopGoogleSpeech();
      } catch {}
      setHasResult(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      stopSpeechRecognition();
      try {
        stopGoogleSpeech();
      } catch {}
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  // Handle Quick Command Chip
  const handleChipCommand = (phrase: string) => {
    handleSpokenSuccess(phrase);
  };

  // Speak Again: launches Google Mic and updates result sheet
  const handleSpeakAgain = () => {
    startListeningProcess();
  };

  // ONLY render the modal once there is a result to display in the bottom sheet.
  // This completely eliminates any white background dialog box while Google Mic is active.
  if (!visible || !hasResult) {
    return null;
  }

  return (
    <Modal visible={visible && hasResult} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.45)" />
      <View style={styles.drawerBackdrop}>
        {/* Dimmed backdrop: clicking outside closes the bottom sheet */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        {/* ============================================================ */}
        {/* ALL-ENGLISH CLEAN RESULT BOTTOM SHEET                         */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            styles.resultDrawerSheet,
            {
              transform: [{ translateY: sheetSlideAnim }],
            },
          ]}
        >
          {/* Top Sheet Drag Handle */}
          <View style={styles.sheetHandle} />

          {/* Clean English Header (No Google logo, no mic icon) */}
          <View style={styles.resultHeaderRow}>
            <View>
              <Text style={styles.resultTitle}>Command Summary</Text>
              <Text style={styles.resultSubTitle}>Voice Assistant</Text>
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

          {/* 1. What was asked */}
          <View style={styles.askedSection}>
            <Text style={styles.sectionHeaderLabel}>WHAT YOU ASKED</Text>
            <View style={styles.askedQuoteCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#047A36" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.askedQuoteText}>"{transcript}"</Text>
            </View>
          </View>

          {/* 2. What's been done (Action Feedback / Confirmation) */}
          <View style={styles.doneSection}>
            <Text style={styles.sectionHeaderLabel}>ACTION TAKEN</Text>

            {lastExecutedCommand && !pendingConfirmation ? (
              <View style={styles.actionDoneCard}>
                <View style={styles.doneHeaderRow}>
                  <Ionicons name="checkmark-circle" size={22} color="#047A36" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doneActionTitle}>
                      {lastExecutedCommand.userFeedbackEn || lastExecutedCommand.userFeedbackHi}
                    </Text>
                    {lastExecutedCommand.matchedItemNameEn && (
                      <Text style={styles.doneActionEn}>
                        Item: {lastExecutedCommand.matchedItemNameEn}
                      </Text>
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
              <View style={styles.confirmCard}>
                <View style={styles.confirmHeaderRow}>
                  <Ionicons name="help-circle" size={22} color="#D97706" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmTitle}>{pendingConfirmation.title}</Text>
                </View>
                <Text style={styles.confirmPrompt}>{pendingConfirmation.prompt}</Text>

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
                      <Text style={styles.cancelBtnText}>✕ Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.confirmActionRow}>
                    <TouchableOpacity
                      style={styles.cancelConfirmBtn}
                      onPress={pendingConfirmation.onCancel}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelConfirmBtnText}>✕ No</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptConfirmBtn}
                      onPress={pendingConfirmation.onConfirm}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.acceptConfirmBtnText}>✓ Yes</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}
          </View>

          {/* 3. Quick Commands */}
          <View style={styles.chipsSectionResult}>
            <Text style={styles.chipsSectionLabel}>QUICK COMMANDS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {QUICK_COMMANDS.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chipItem}
                  onPress={() => handleChipCommand(chip.text)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.chipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 4. Action Buttons */}
          <View style={styles.bottomActionRow}>
            <TouchableOpacity
              style={styles.speakAgainBtn}
              onPress={handleSpeakAgain}
              activeOpacity={0.85}
            >
              <Ionicons name="mic" size={18} color="#047A36" style={{ marginRight: 6 }} />
              <Text style={styles.speakAgainBtnText}>Speak Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneDismissBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneDismissBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Dimmed transparent backdrop so orders behind remain visible
    justifyContent: 'flex-end',
  },
  resultDrawerSheet: {
    backgroundColor: '#FFFFFF', // Pure crisp white
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
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  resultTitle: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 18,
    color: '#0F172A',
  },
  resultSubTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askedSection: {
    marginBottom: 12,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  askedQuoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  askedQuoteText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: '#0F172A',
    fontStyle: 'italic',
  },
  doneSection: {
    marginBottom: 14,
  },
  actionDoneCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 12,
  },
  doneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doneActionTitle: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14.5,
    color: '#0F172A',
  },
  doneActionEn: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
    marginTop: 2,
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
    marginLeft: 8,
  },
  undoBtnText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11.5,
    color: '#DC2626',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: '#DCFCE7',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#16A34A',
  },
  confirmCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  confirmTitle: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#92400E',
  },
  confirmPrompt: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#0F172A',
    marginBottom: 10,
    lineHeight: 20,
  },
  confirmActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelConfirmBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmBtnText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#DC2626',
  },
  acceptConfirmBtn: {
    flex: 1.3,
    backgroundColor: '#047A36',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptConfirmBtnText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#FFFFFF',
  },
  optionsList: {
    gap: 6,
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
    fontFamily: 'PlusJakartaSans-Medium',
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
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
  chipsSectionResult: {
    marginBottom: 14,
  },
  chipsSectionLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chipItem: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  chipText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#334155',
  },
  bottomActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  speakAgainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingVertical: 11,
  },
  speakAgainBtnText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#047A36',
  },
  doneDismissBtn: {
    flex: 1,
    backgroundColor: '#047A36',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneDismissBtnText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
