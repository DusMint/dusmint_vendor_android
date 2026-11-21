/**
 * Safe Hindi Text-to-Speech (TTS) Confirmation Service
 * Uses expo-speech if compiled and a Hindi voice is available on device.
 * Falls back gracefully without crashing if TTS or Hindi voice is absent.
 */
let SpeechModule: any = null;
try {
  SpeechModule = require('expo-speech');
} catch {
  SpeechModule = null;
}

export async function speakConfirmationAloud(text: string, language: string = 'hi-IN'): Promise<boolean> {
  if (!SpeechModule || typeof SpeechModule.speak !== 'function') {
    return false;
  }

  try {
    // Check if TTS is currently speaking and stop if so
    if (typeof SpeechModule.isSpeakingAsync === 'function') {
      const speaking = await SpeechModule.isSpeakingAsync();
      if (speaking && typeof SpeechModule.stop === 'function') {
        SpeechModule.stop();
      }
    }

    SpeechModule.speak(text, {
      language,
      pitch: 1.0,
      rate: 0.95,
      onError: (e: any) => {
        console.warn('TTS playback error (voice may be missing on device):', e);
      },
    });
    return true;
  } catch (err) {
    console.warn('TTS speak failed:', err);
    return false;
  }
}

export function stopSpeaking() {
  try {
    if (SpeechModule && typeof SpeechModule.stop === 'function') {
      SpeechModule.stop();
    }
  } catch {}
}
