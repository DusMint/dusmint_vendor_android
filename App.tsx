import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  LogBox,
  Animated,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Modal,
  Vibration,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@dusmint/ui';
import { VendorOrdersScreen } from './src/screens/orders/VendorOrdersScreen';
import { VendorPackScreen } from './src/screens/orders/VendorPackScreen';
import { VendorStockScreen } from './src/screens/stock/VendorStockScreen';
import { VendorEarningsScreen } from './src/screens/earnings/VendorEarningsScreen';
import { VendorProfileScreen } from './src/screens/profile/VendorProfileScreen';
import { LanguageSelectScreen } from './src/screens/language/LanguageSelectScreen';
import { VendorLoginScreen } from './src/screens/auth/VendorLoginScreen';
import { VendorOtpScreen } from './src/screens/auth/VendorOtpScreen';
import { VendorOnboardingScreen } from './src/screens/onboarding/VendorOnboardingScreen';
import { VendorVoiceModal } from './src/screens/voice/VendorVoiceModal';
import { useVendorAuthStore } from './src/state/useVendorAuthStore';

// Suppress dev-mode LogBox banners to prevent bottom navigation occlusion
LogBox.ignoreAllLogs(true);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomVendorTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const [barWidth, setBarWidth] = useState(0);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const pendingOrdersCount = useVendorAuthStore((s) => s.pendingOrdersCount ?? 2);

  // Animated sliding indicator value tracking route index (0, 1, 2, 3)
  const slideAnim = useRef(new Animated.Value(state.index)).current;

  // Scale animation for each of the 4 tabs
  const scaleAnims = useRef([
    new Animated.Value(state.index === 0 ? 1.14 : 1.0),
    new Animated.Value(state.index === 1 ? 1.14 : 1.0),
    new Animated.Value(state.index === 2 ? 1.14 : 1.0),
    new Animated.Value(state.index === 3 ? 1.14 : 1.0),
  ]).current;

  // Pulsing animation for the Voice Assistant visualizer ring
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Smooth spring slide of the gray pill
    Animated.spring(slideAnim, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();

    // 2. Smooth scale enlargement for active tab, smooth scale down for others
    scaleAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === state.index ? 1.14 : 1.0,
        useNativeDriver: true,
        tension: 90,
        friction: 8,
      }).start();
    });
  }, [state.index, slideAnim, scaleAnims]);

  useEffect(() => {
    if (isVoiceModalOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isVoiceModalOpen, pulseAnim]);

  // 5 slots: Slot 0 (Orders), Slot 1 (Stock), Slot 2 (Mic), Slot 3 (Earnings), Slot 4 (Profile)
  const numSlots = 5;
  const slotWidth = barWidth > 0 ? barWidth / numSlots : 0;

  const renderTabButton = (route: any, index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;

    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
        ? options.title
        : route.name;

    let iconName: keyof typeof Ionicons.glyphMap = 'receipt-outline';
    if (route.name === 'VendorOrders') {
      iconName = isFocused ? 'receipt' : 'receipt-outline';
    } else if (route.name === 'VendorStock') {
      iconName = isFocused ? 'grid' : 'grid-outline';
    } else if (route.name === 'VendorEarnings') {
      iconName = isFocused ? 'wallet' : 'wallet-outline';
    } else if (route.name === 'VendorProfile') {
      iconName = isFocused ? 'person' : 'person-outline';
    }

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarTestID}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tabButton}
        activeOpacity={0.8}
      >
        <View style={styles.tabContent}>
          <View style={styles.iconWrapper}>
            <Animated.View style={{ transform: [{ scale: scaleAnims[index] }] }}>
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? '#047A36' : '#475569'}
              />
            </Animated.View>
            {route.name === 'VendorOrders' && pendingOrdersCount > 0 && (
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>
                  {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
            numberOfLines={1}
          >
            {label as string}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        style={[
          styles.tabBarContainer,
          {
            height: 68 + bottomInset,
            paddingBottom: bottomInset,
          },
        ]}
      >
        {/* Smooth Sliding Capsule Pill Track (Skips center slot 2 where Mic sits) */}
        {slotWidth > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View
              style={[
                styles.sliderTrack,
                {
                  width: slotWidth,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1, 2, 3],
                        outputRange: [0, slotWidth, slotWidth * 3, slotWidth * 4],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.grayPill} />
            </Animated.View>
          </View>
        )}

        {/* 5-Slot Tab Row: [Orders] [Stock] [Popped-Out Mic] [Earnings] [Profile] */}
        <View style={styles.tabButtonsRow}>
          {/* Slot 0: Orders */}
          {state.routes[0] && renderTabButton(state.routes[0], 0)}

          {/* Slot 1: Stock */}
          {state.routes[1] && renderTabButton(state.routes[1], 1)}

          {/* Slot 2: Popped-Out Center AI Mic Button */}
          <View style={styles.micSlotContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Vibration.vibrate(35);
                setIsVoiceModalOpen(true);
              }}
              style={styles.micPoppedButton}
            >
              <Ionicons name="mic" size={26} color="#047A36" />
            </TouchableOpacity>
            <Text style={styles.micSubLabel}>Speak</Text>
          </View>

          {/* Slot 3: Earnings */}
          {state.routes[2] && renderTabButton(state.routes[2], 2)}

          {/* Slot 4: Profile */}
          {state.routes[3] && renderTabButton(state.routes[3], 3)}
        </View>
      </View>

      {/* Real-time Multilingual Google Voice Assistant Modal */}
      <VendorVoiceModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </>
  );
}

function VendorTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomVendorTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="VendorOrders"
        component={VendorOrdersScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="VendorStock"
        component={VendorStockScreen}
        options={{ tabBarLabel: 'Stock' }}
      />
      <Tab.Screen
        name="VendorEarnings"
        component={VendorEarningsScreen}
        options={{ tabBarLabel: 'Earnings' }}
      />
      <Tab.Screen
        name="VendorProfile"
        component={VendorProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Metropolis-Regular': require('./assets/font/Metropolis-Regular.otf'),
    'Metropolis-Medium': require('./assets/font/Metropolis-Medium.otf'),
    'Metropolis-SemiBold': require('./assets/font/Metropolis-SemiBold.otf'),
    'Metropolis-Bold': require('./assets/font/Metropolis-Bold.otf'),
    'Metropolis-ExtraBold': require('./assets/font/Metropolis-ExtraBold.otf'),
    'Poppins-Regular': require('./assets/font/Metropolis-Regular.otf'),
    'Poppins-Medium': require('./assets/font/Metropolis-Medium.otf'),
    'Poppins-SemiBold': require('./assets/font/Metropolis-SemiBold.otf'),
    'Poppins-Bold': require('./assets/font/Metropolis-Bold.otf'),
    'Poppins_400Regular': require('./assets/font/Metropolis-Regular.otf'),
    'Poppins_500Medium': require('./assets/font/Metropolis-Medium.otf'),
    'Poppins_600SemiBold': require('./assets/font/Metropolis-SemiBold.otf'),
    'Poppins_700Bold': require('./assets/font/Metropolis-Bold.otf'),
    'NotoSans-Regular': require('./assets/font/Metropolis-Regular.otf'),
    'NotoSans-Medium': require('./assets/font/Metropolis-Medium.otf'),
    'NotoSans-Bold': require('./assets/font/Metropolis-Bold.otf'),
  });

  const selectedLanguage = useVendorAuthStore((s) => s.selectedLanguage);
  const isAuthenticated = useVendorAuthStore((s) => s.isAuthenticated);
  const hasActiveVendor = useVendorAuthStore((s) => s.hasActiveVendor);
  const isHydrated = useVendorAuthStore((s) => s.isHydrated);

  if (!fontsLoaded || !isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#047A36" />
      </View>
    );
  }

  const initialRouteName = !selectedLanguage
    ? 'LanguageSelect'
    : !isAuthenticated
    ? 'VendorLogin'
    : !hasActiveVendor
    ? 'VendorOnboarding'
    : 'Tabs';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
          <Stack.Screen name="VendorLogin" component={VendorLoginScreen} />
          <Stack.Screen name="VendorOtp" component={VendorOtpScreen} />
          <Stack.Screen name="VendorOnboarding" component={VendorOnboardingScreen} />
          <Stack.Screen name="Tabs" component={VendorTabs} />
          <Stack.Screen name="VendorPack" component={VendorPackScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderTrack: {
    position: 'absolute',
    top: 6,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grayPill: {
    width: 66,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  tabButtonsRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    paddingTop: 4,
  },
  tabButton: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#D9482B',
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    paddingHorizontal: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  orderBadgeText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 12,
  },
  tabLabel: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    marginTop: 3,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: '#047A36',
  },
  tabLabelInactive: {
    fontWeight: '700',
    color: '#475569',
  },

  // Popped-Out Center Mic Button
  micSlotContainer: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  micPoppedButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    borderWidth: 2.5,
    borderColor: '#047A36',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  micSubLabel: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    fontWeight: '800',
    color: '#047A36',
    marginTop: 3,
    letterSpacing: -0.2,
  },

  // Voice Assistant Preview Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  voiceSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  voiceHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#111117',
    marginBottom: 4,
  },
  voiceSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  visualizerContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#BBF7D0',
  },
  micCircleBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#047A36',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  listeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  listeningDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#047A36',
    marginRight: 6,
  },
  listeningText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    fontWeight: '800',
    color: '#047A36',
  },
  examplesLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  exampleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    width: '100%',
  },
  exampleChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  exampleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  closeVoiceBtn: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeVoiceBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#475569',
  },
});


