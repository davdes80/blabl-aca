import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import MainTabs from './src/navigation/MainTabs';

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: '#2563eb' },
};

function Root() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }
  return user ? <MainTabs /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="dark" />
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}
