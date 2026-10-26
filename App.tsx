import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@dusmint/ui';
import { VendorOrdersScreen } from './src/screens/orders/VendorOrdersScreen';
import { VendorPackScreen } from './src/screens/orders/VendorPackScreen';
import { VendorStockScreen } from './src/screens/stock/VendorStockScreen';
import { VendorEarningsScreen } from './src/screens/earnings/VendorEarningsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function VendorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.placeholder,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
          elevation: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="VendorOrders"
        component={VendorOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('./assets/img/tab_home.png')}
              style={[
                styles.tabIcon,
                { tintColor: focused ? Colors.primary : Colors.placeholder },
              ]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="VendorStock"
        component={VendorStockScreen}
        options={{
          tabBarLabel: 'Menu & Stock',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('./assets/img/tab_menu.png')}
              style={[
                styles.tabIcon,
                { tintColor: focused ? Colors.primary : Colors.placeholder },
              ]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="VendorEarnings"
        component={VendorEarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('./assets/img/more_payment.png')}
              style={[
                styles.tabIcon,
                { tintColor: focused ? Colors.primary : Colors.placeholder },
              ]}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={VendorTabs} />
          <Stack.Screen name="VendorPack" component={VendorPackScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 22,
    height: 22,
  },
});
