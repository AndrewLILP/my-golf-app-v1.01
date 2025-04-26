import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#e0f2f1', // Light teal for calm vibe
          },
          headerTintColor: '#2e7d32', // Green text for nature feel
          headerTitleStyle: {
            fontWeight: '500',
          },
          contentStyle: {
            backgroundColor: '#f5f9f8', // Very light blue-green for background
          }
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Golf Companion',
          }}
        />
        <Stack.Screen
          name="weather"
          options={{
            title: 'Weather',
          }}
        />
        <Stack.Screen
          name="goals"
          options={{
            title: 'Round Goals',
          }}
        />
        <Stack.Screen
          name="round"
          options={{
            title: 'Current Round',
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: 'Round History',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}