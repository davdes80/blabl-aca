import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import TripsScreen from '../screens/TripsScreen';
import PublishScreen from '../screens/PublishScreen';
import MyTripsScreen from '../screens/MyTripsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TripDetailScreen from '../screens/TripDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const Icon = ({ emoji }: { emoji: string }) => <Text style={{ fontSize: 20 }}>{emoji}</Text>;

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#2563eb',
      }}
    >
      <Tab.Screen name="Trajets" component={TripsScreen} options={{ tabBarIcon: () => <Icon emoji="🚗" /> }} />
      <Tab.Screen name="Publier" component={PublishScreen} options={{ tabBarIcon: () => <Icon emoji="➕" /> }} />
      <Tab.Screen name="Mes trajets" component={MyTripsScreen} options={{ tabBarIcon: () => <Icon emoji="📋" /> }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ tabBarIcon: () => <Icon emoji="👤" /> }} />
    </Tab.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Accueil" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: 'Détail du trajet' }}
      />
    </Stack.Navigator>
  );
}
