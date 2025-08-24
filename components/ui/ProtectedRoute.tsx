import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../utils/authContext';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // This should not happen as AuthContext handles redirects
    // But just in case, we show loading
    return <LoadingScreen message="Redirecting to login..." />;
  }

  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 