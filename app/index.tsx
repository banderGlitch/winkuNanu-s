import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Redirect to the feeds screen for now
    router.replace('/feeds');
  }, []);

  return null;
} 