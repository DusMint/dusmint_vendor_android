import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';

const LANGUAGES = [
  { id: 'en', name: 'English', localName: 'English' },
  { id: 'hi', name: 'Hindi', localName: 'हिंदी' },
  { id: 'bn', name: 'Bengali', localName: 'বাংলা' },
  { id: 'mr', name: 'Marathi', localName: 'मराठी' },
  { id: 'te', name: 'Telugu', localName: 'తెలుగు' },
  { id: 'ta', name: 'Tamil', localName: 'தமிழ்' },
  { id: 'kn', name: 'Kannada', localName: 'ಕನ್ನಡ' },
];

const TRANSLATIONS: Record<string, { title: string; subtitle: string; continue: string }> = {
  en: {
    title: 'Choose Language',
    subtitle: 'Select your preferred language to manage your DusMint Dukaan.',
    continue: 'Continue',
  },
  hi: {
    title: 'भाषा चुनें',
    subtitle: 'अपनी दसमिंट दुकान का प्रबंधन करने के लिए पसंदीदा भाषा चुनें।',
    continue: 'जारी रखें',
  },
  bn: {
    title: 'ভাষা নির্বাচন করুন',
    subtitle: 'আপনার ডাসমিন্ট দোকান পরিচালনা করতে পছন্দের ভাষা নির্বাচন করুন।',
    continue: 'চালিয়ে যান',
  },
  mr: {
    title: 'भाषा निवडा',
    subtitle: 'आपले डसमंट दुकान व्यवस्थापित करण्यासाठी पसंतीची भाषा निवडा.',
    continue: 'पुढे जा',
  },
  te: {
    title: 'భాషను ఎంచుకోండి',
    subtitle: 'మీ డస్మింట్ దుకాణాన్ని నిర్వహించడానికి ప్రాధాన్యత గల భాషను ఎంచుకోండి.',
    continue: 'కొనసాగించండి',
  },
  ta: {
    title: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    subtitle: 'உங்கள் டஸ்மிண்ட் கடையை நிர்வகிக்க உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்.',
    continue: 'தொடரவும்',
  },
  kn: {
    title: 'ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    subtitle: 'ನಿಮ್ಮ ಡಸ್ಮಿಂಟ್ ಅಂಗಡಿಯನ್ನು ನಿರ್ವಹಿಸಲು ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    continue: 'ಮುಂದುವರಿಸಿ',
  },
};

export const LanguageSelectScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedLang, setSelectedLang] = useState('en');
  const setLanguage = useVendorAuthStore((s) => s.setLanguage);

  const t = TRANSLATIONS[selectedLang] || TRANSLATIONS.en;

  const handleContinue = () => {
    setLanguage(selectedLang);
    navigation.replace('VendorLogin');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section without illustration */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* 2-Column Language Grid */}
        <View style={styles.gridContainer}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                activeOpacity={0.75}
                onPress={() => setSelectedLang(lang.id)}
                style={[
                  styles.langCard,
                  isSelected && styles.langCardSelected,
                ]}
              >
                <Text
                  style={[
                    styles.langName,
                    isSelected && styles.langNameSelected,
                  ]}
                >
                  {lang.name}
                </Text>
                {lang.name !== lang.localName && (
                  <Text
                    style={[
                      styles.langLocalName,
                      isSelected && styles.langLocalNameSelected,
                    ]}
                  >
                    {lang.localName}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Pinned Bottom CTA Button */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>{t.continue}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerSection: {
    paddingTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  langCard: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  langCardSelected: {
    borderColor: '#047A36',
    backgroundColor: '#F0FDF4',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  langName: {
    fontSize: 16,
    fontFamily: 'Metropolis-Bold',
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  langNameSelected: {
    color: '#047A36',
    fontWeight: '800',
  },
  langLocalName: {
    fontSize: 13,
    fontFamily: 'Metropolis-Medium',
    color: '#94A3B8',
    fontWeight: '500',
  },
  langLocalNameSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  continueButton: {
    backgroundColor: '#047A36',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Metropolis-Bold',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
