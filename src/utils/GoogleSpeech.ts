import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { GoogleSpeech } = NativeModules;

export interface GoogleSpeechResult {
  transcript: string;
  candidates?: string[];
  status?: string;
  errorCode?: number;
  error?: string;
}

const speechEmitter =
  Platform.OS === 'android' && GoogleSpeech && typeof (GoogleSpeech as any).addListener === 'function'
    ? new NativeEventEmitter(GoogleSpeech)
    : null;

/**
 * Returns true if the native Google Speech Recognition service is available on this device
 */
export const isGoogleSpeechAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !GoogleSpeech || typeof GoogleSpeech.isAvailable !== 'function') {
    return false;
  }
  try {
    return await GoogleSpeech.isAvailable();
  } catch {
    return false;
  }
};

/**
 * Starts in-app Google Speech Recognition silently in the background
 * without opening any external dark/black activity dialogs.
 * The audio is recognized directly and delivered to the promise / event listener.
 */
export const startGoogleSpeech = async (
  prompt: string = 'Try speaking: "20 kilo aloo add karo"...',
  languageCode: string = 'hi-IN'
): Promise<GoogleSpeechResult> => {
  if (Platform.OS !== 'android' || !GoogleSpeech || typeof GoogleSpeech.startGoogleSpeech !== 'function') {
    throw new Error('GoogleSpeech native module is not available on this platform/build');
  }

  return await GoogleSpeech.startGoogleSpeech(prompt, languageCode);
};

export const stopGoogleSpeech = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !GoogleSpeech || typeof GoogleSpeech.stopGoogleSpeech !== 'function') {
    return false;
  }
  try {
    return await GoogleSpeech.stopGoogleSpeech();
  } catch {
    return false;
  }
};

export const cancelGoogleSpeech = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !GoogleSpeech || typeof GoogleSpeech.cancelGoogleSpeech !== 'function') {
    return false;
  }
  try {
    return await GoogleSpeech.cancelGoogleSpeech();
  } catch {
    return false;
  }
};

/**
 * Add listener for speech events
 */
export const addGoogleSpeechListener = (
  eventName: 'onSpeechReady' | 'onSpeechBegin' | 'onSpeechPartial' | 'onSpeechEnd' | 'onSpeechResult' | 'onSpeechCancelled' | 'onSpeechError',
  listener: (data: any) => void
) => {
  if (!speechEmitter) return { remove: () => {} };
  return speechEmitter.addListener(eventName, listener);
};
