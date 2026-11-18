import { NativeModules, DeviceEventEmitter, Platform } from 'react-native';

const { GoogleSmsConsent } = NativeModules;

export interface SmsReceivedPayload {
  message: string;
  otp: string;
}

export const startGoogleSmsConsent = (
  onOtpReceived: (otp: string, fullMessage: string) => void
): (() => void) => {
  if (Platform.OS !== 'android' || !GoogleSmsConsent) {
    return () => {};
  }

  try {
    GoogleSmsConsent.startSmsConsent().catch(() => {});
  } catch {}

  const subReceived = DeviceEventEmitter.addListener(
    'onSmsReceived',
    (data: SmsReceivedPayload) => {
      if (data && data.otp) {
        onOtpReceived(data.otp, data.message || '');
      }
    }
  );

  return () => {
    subReceived.remove();
    try {
      GoogleSmsConsent.stopSmsConsent().catch(() => {});
    } catch {}
  };
};
