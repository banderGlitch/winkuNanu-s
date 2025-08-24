import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../utils/authContext';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function Index() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Welcome to Winku" />;
  }

  // This component will not render anything as AuthContext handles navigation
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 