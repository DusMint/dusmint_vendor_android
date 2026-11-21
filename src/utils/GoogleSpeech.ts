import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { GoogleSpeech } = NativeModules;

export interface GoogleSpeechResult {
  transcript: string;
  candidates?: string[];
  status?: string;
  error?: string;
}

const speechEmitter = Platform.OS === 'android' && GoogleSpeech ? new NativeEventEmitter(GoogleSpeech) : null;

/**
 * Returns true if the native Google Speech Recognition Intent is supported and available on this device
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
 * Launches the official Google Voice Search / Assistant Dialog.
 * Google listens to the microphone with full Hindi / English acoustic models
 * and returns the transcribed text.
 */
export const startGoogleSpeech = async (
  prompt: string = 'DusMint: बोलिए...',
  languageCode: string = 'hi-IN'
): Promise<GoogleSpeechResult> => {
  if (Platform.OS !== 'android' || !GoogleSpeech || typeof GoogleSpeech.startGoogleSpeech !== 'function') {
    throw new Error('GoogleSpeech native module is not available on this platform/build');
  }

  return await GoogleSpeech.startGoogleSpeech(prompt, languageCode);
};

/**
 * Add listener for speech results
 */
export const addGoogleSpeechListener = (
  eventName: 'onSpeechResult' | 'onSpeechCancelled' | 'onSpeechError',
  listener: (data: any) => void
) => {
  if (!speechEmitter) return { remove: () => {} };
  return speechEmitter.addListener(eventName, listener);
};
