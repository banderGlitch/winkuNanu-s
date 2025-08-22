import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Redirect to the login screen
    router.replace('/auth/login');
  }, []);

  return null;
} 