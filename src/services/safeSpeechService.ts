import { useEffect } from 'react';
import { requireOptionalNativeModule } from 'expo';

// Safely load the native module without throwing if not yet compiled in the APK
export const NativeSpeechModule = requireOptionalNativeModule('ExpoSpeechRecognition') as any;

/**
 * High-priority Contextual Phrase Hints for Indian Groceries / Mandis
 * Biases Google Mic's acoustic model towards correct regional produce & units
 */
export const VENDOR_PHRASE_BIASING: string[] = [
  // Produce (Hindi, Hinglish, Marathi, Gujarati)
  'Tamatar', 'Tameta', 'Desi Tomato', 'Tomato', 'Aalu', 'Aloo', 'Batata', 'Potato',
  'Pyaaz', 'Pyaz', 'Kanda', 'Dungli', 'Onion', 'Doodh', 'Milk', 'Taaza', 'Paneer',
  'Malai Paneer', 'Dahi', 'Curd', 'Butter', 'Makkhan', 'Maska', 'Ghee', 'Desi Ghee',
  'Seb', 'Apple', 'Kela', 'Banana', 'Santra', 'Orange', 'Anda', 'Eggs', 'White Eggs',
  'Chicken', 'Curry Cut', 'Mutton', 'Fish', 'Rohu', 'Palak', 'Spinach', 'Mirchi',
  'Hari Mirch', 'Adrak', 'Ginger', 'Lahsun', 'Garlic', 'Dhaniya', 'Kothmir',

  // Vernacular Quantities & Mandi Units
  'Paav Kilo', 'Pauwa', 'Aadha Kilo', 'Pawn Kilo', 'Sawa Kilo', 'Derh Kilo', 'Dhaai Kilo',
  'Kilo', 'Kg', 'Gram', 'Grams', 'Darjan', 'Dozen', 'Packet', 'Pkt', 'Piece', 'Pcs',

  // Store & Action Verbs
  'Add karo', 'Daal do', 'Badha do', 'Nakho', 'Taka',
  'Out of stock', 'In stock', 'Khatam ho gaya', 'Khatam', 'Sampala', 'Khalas',
  'Dukan band', 'Dukan khol do', 'Store open', 'Store close',
  'Rate', 'Bhav', 'Price', 'Rupay', 'Kamai', 'Payout', 'Order accept', 'Pack'
];

/**
 * Returns true if the native speech recognition module is compiled and available in the running binary.
 */
export const isSpeechRecognitionSupported = (): boolean => {
  return NativeSpeechModule != null && typeof NativeSpeechModule.start === 'function';
};

/**
 * Request audio recording & speech recognition permissions safely
 */
export async function requestSpeechPermissions(): Promise<boolean> {
  if (!NativeSpeechModule || typeof NativeSpeechModule.requestPermissionsAsync !== 'function') {
    return false;
  }
  try {
    const res = await NativeSpeechModule.requestPermissionsAsync();
    return !!res?.granted;
  } catch (e) {
    console.warn('SafeSpeech: Permission request failed:', e);
    return false;
  }
}

/**
 * Start listening via Google / Android speech engine with Multilingual & Phrase Biasing options
 */
export function startSpeechRecognition(options?: {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
  extraLanguages?: string[];
  contextualStrings?: string[];
}) {
  if (!NativeSpeechModule || typeof NativeSpeechModule.start !== 'function') {
    return false;
  }
  try {
    NativeSpeechModule.start({
      lang: options?.lang || 'hi-IN',
      interimResults: options?.interimResults ?? true,
      continuous: options?.continuous ?? false,
      extraLanguages: options?.extraLanguages || ['en-IN', 'hi-IN'],
      contextualStrings: options?.contextualStrings || VENDOR_PHRASE_BIASING,
      androidAudioSource: 'voice_recognition', // Uses dual-mic noise suppression on Android
    });
    return true;
  } catch (e) {
    console.warn('SafeSpeech: Start failed:', e);
    return false;
  }
}

/**
 * Stop listening gracefully
 */
export function stopSpeechRecognition() {
  if (!NativeSpeechModule || typeof NativeSpeechModule.stop !== 'function') {
    return;
  }
  try {
    NativeSpeechModule.stop();
  } catch (e) {
    console.warn('SafeSpeech: Stop failed:', e);
  }
}

/**
 * Abort active recognition
 */
export function abortSpeechRecognition() {
  if (!NativeSpeechModule || typeof NativeSpeechModule.abort !== 'function') {
    return;
  }
  try {
    NativeSpeechModule.abort();
  } catch (e) {
    console.warn('SafeSpeech: Abort failed:', e);
  }
}

/**
 * Safe hook to subscribe to speech events without crashing if module is missing
 */
export function useSafeSpeechEvent(
  eventName: 'start' | 'end' | 'result' | 'error',
  callback: (event: any) => void
) {
  useEffect(() => {
    if (!NativeSpeechModule || typeof NativeSpeechModule.addListener !== 'function') {
      return;
    }

    try {
      const subscription = NativeSpeechModule.addListener(eventName, callback);
      return () => {
        try {
          if (subscription && typeof subscription.remove === 'function') {
            subscription.remove();
          }
        } catch {
          // Ignore unmount cleanup errors
        }
      };
    } catch (e) {
      console.warn(`SafeSpeech: Failed to subscribe to ${eventName}:`, e);
    }
  }, [eventName, callback]);
}
