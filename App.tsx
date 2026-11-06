import React from 'react';
import { View, Image, StyleSheet, LogBox, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Colors } from '@dusmint/ui';
import { VendorOrdersScreen } from './src/screens/orders/VendorOrdersScreen';
import { VendorPackScreen } from './src/screens/orders/VendorPackScreen';
import { VendorStockScreen } from './src/screens/stock/VendorStockScreen';
import { VendorEarningsScreen } from './src/screens/earnings/VendorEarningsScreen';

// Suppress dev-mode LogBox banners to prevent bottom navigation occlusion
LogBox.ignoreAllLogs(true);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function VendorTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FC6011',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 10,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="VendorOrders"
        component={VendorOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('./assets/img/tab_home.png')}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? '#FC6011' : '#94A3B8' },
                ]}
                resizeMode="contain"
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="VendorStock"
        component={VendorStockScreen}
        options={{
          tabBarLabel: 'Menu & Stock',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('./assets/img/tab_menu.png')}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? '#FC6011' : '#94A3B8' },
                ]}
                resizeMode="contain"
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="VendorEarnings"
        component={VendorEarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('./assets/img/more_payment.png')}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? '#FC6011' : '#94A3B8' },
                ]}
                resizeMode="contain"
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
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

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#FC6011" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={VendorTabs} />
          <Stack.Screen name="VendorPack" component={VendorPackScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 22,
    height: 22,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FC6011',
    marginTop: 2,
  },
});
