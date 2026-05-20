import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { ensureWebViewport } from './utils/ensureWebViewport';

export default function App() {
  useEffect(() => {
    ensureWebViewport();
  }, []);

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
