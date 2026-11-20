import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, LogBox, Animated, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
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
import { useVendorAuthStore } from './src/state/useVendorAuthStore';

// Suppress dev-mode LogBox banners to prevent bottom navigation occlusion
LogBox.ignoreAllLogs(true);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomVendorTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 6 : 14;
  const [barWidth, setBarWidth] = useState(0);

  // Animated sliding indicator value tracking route index (0, 1, 2, 3)
  const slideAnim = useRef(new Animated.Value(state.index)).current;

  // Scale animation for each of the 4 tabs
  const scaleAnims = useRef([
    new Animated.Value(state.index === 0 ? 1.16 : 1.0),
    new Animated.Value(state.index === 1 ? 1.16 : 1.0),
    new Animated.Value(state.index === 2 ? 1.16 : 1.0),
    new Animated.Value(state.index === 3 ? 1.16 : 1.0),
  ]).current;

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
        toValue: i === state.index ? 1.16 : 1.0,
        useNativeDriver: true,
        tension: 90,
        friction: 8,
      }).start();
    });
  }, [state.index, slideAnim, scaleAnims]);

  const numTabs = state.routes.length;
  const tabWidth = barWidth > 0 ? (barWidth - 12) / numTabs : 0;

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomOffset }]}>
      <View
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        style={styles.floatingBar}
      >
        {/* Smooth Sliding Capsule Pill Track */}
        {tabWidth > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View
              style={[
                styles.sliderTrack,
                {
                  left: 6,
                  width: tabWidth,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1, 2, 3],
                        outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
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

        {/* Tab Buttons */}
        <View style={styles.tabButtonsRow}>
          {state.routes.map((route, index) => {
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
                  <Animated.View style={{ transform: [{ scale: scaleAnims[index] }] }}>
                    <Ionicons
                      name={iconName}
                      size={20}
                      color={isFocused ? '#047A36' : '#94A3B8'}
                    />
                  </Animated.View>
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
          })}
        </View>
      </View>
    </View>
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
        options={{ tabBarLabel: 'Inventory' }}
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
  floatingWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  floatingBar: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderRadius: 31,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  sliderTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grayPill: {
    width: 68,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButtonsRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: '#047A36',
  },
  tabLabelInactive: {
    fontWeight: '600',
    color: '#94A3B8',
  },
});


