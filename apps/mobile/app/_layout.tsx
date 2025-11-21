import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';
import { SpaceProvider } from '@/contexts/SpaceContext';
import {
  Stack,
  StatusBar,
  useColorScheme,
  PaperProvider,
  SafeAreaProvider,
} from '@/lib/react-native-compat';
import { theme } from '@/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme[colorScheme === 'dark' ? 'dark' : 'light']}>
        <SafeAreaProvider>
          <AuthProvider>
            <SpaceProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{
                    presentation: 'modal',
                    headerShown: true,
                    title: 'Account Settings',
                  }}
                />
              </Stack>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            </SpaceProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
