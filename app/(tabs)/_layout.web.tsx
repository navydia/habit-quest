import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/src/theme/useTheme';

// Web preview only: native tabs render at the top on web, so use a bottom JS tab bar here.
const ICONS = { index: 'home', character: 'person', city: 'location_city', log: 'menu_book' } as const;
const TITLES = { index: 'Home', character: 'Character', city: 'City', log: 'Log' } as const;

export default function WebTabLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line },
        title: TITLES[route.name as keyof typeof TITLES],
        tabBarIcon: ({ color }) => (
          <SymbolView name={{ web: ICONS[route.name as keyof typeof ICONS] } as any} tintColor={color} size={24} />
        ),
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="character" />
      <Tabs.Screen name="city" />
      <Tabs.Screen name="log" />
    </Tabs>
  );
}
