import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useGameStore } from '@/src/store/gameStore';
import { fontAssets } from '@/src/theme/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const saveLoaded = useGameStore((s) => s.loaded);
  const ready = (fontsLoaded || !!fontError) && saveLoaded;

  // Load the save, then resolve finished quests on open, on return to the app, and every minute.
  useEffect(() => {
    const { load, tick } = useGameStore.getState();
    load().then(() => tick()).catch(() => {});
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') useGameStore.getState().tick();
    });
    const id = setInterval(() => useGameStore.getState().tick(), 60_000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Render nothing until the save is loaded, so no action can overwrite it with an empty one.
  if (!ready) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="art-preview" options={{ headerShown: true, title: "Art preview", presentation: "modal" }} />
      </Stack>
    </>
  );
}
