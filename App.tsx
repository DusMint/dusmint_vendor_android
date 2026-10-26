import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { Colors, Typography } from '@dusmint/ui';
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
        tabBarInactiveTintColor: Colors.secondary,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: Colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
        },
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamily.heading,
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="VendorOrders"
        component={VendorOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="VendorStock"
        component={VendorStockScreen}
        options={{
          tabBarLabel: 'Stock & Mandi',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🥦</Text>,
        }}
      />
      <Tab.Screen
        name="VendorEarnings"
        component={VendorEarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>💰</Text>,
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
