import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LoadingSpinner from './LoadingSpinner';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <LoadingSpinner size="large" color="#667eea" />
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.subtitle}>Please wait while we set things up</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  message: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginTop: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
}); 