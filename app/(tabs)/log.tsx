import { useEffect, useState } from 'react';
import { dayKey } from '@/src/game/dates';
import { Button } from '@/src/ui/kit/Button';
import { FamiliarsCard } from '@/src/ui/character/FamiliarsCard';
import { useMinuteClock } from '@/src/ui/useMinuteClock';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REGIONS } from '@/src/content/regions';
import { isRegionUnlocked, progressOf } from '@/src/game/world';
import { useGameStore } from '@/src/store/gameStore';
import { minTouch, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Card } from '@/src/ui/kit/Card';
import { Text } from '@/src/ui/kit/Text';
import { ScrapbookSheet } from '@/src/ui/world/ScrapbookSheet';

const dayTitle = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

/** The Log: mail, daily quests, scrapbooks, familiars and history — everything that doesn't have its own home. */
export default function LogScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const save = useGameStore((s) => s.save);
  const hideFromHistory = useGameStore((s) => s.hideFromHistory);
  const { claimDaily, ensureDaily, setActiveFamiliar } = useGameStore.getState();
  const now = useMinuteClock();
  const today = dayKey(now);
  useEffect(() => {
    ensureDaily(now);
  }, [ensureDaily, now]);
  const [scrapbook, setScrapbook] = useState<string | null>(null);

  const entries = save.completions.filter((x) => !x.hidden).sort((a, b) => (a.at < b.at ? 1 : -1));
  const byDay = new Map<string, typeof entries>();
  for (const e of entries.slice(0, 200)) byDay.set(e.dayKey, [...(byDay.get(e.dayKey) ?? []), e]);
  const days = [...byDay.entries()].sort(([a], [b]) => (a < b ? 1 : -1)); // newest day first

  const placeholder = (title: string, text: string) => (
    <Card style={{ gap: space.xs }}>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      <Text color="textMuted">{text}</Text>
    </Card>
  );

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.screen, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + 96, gap: space.l }}>
      <Text variant="display" accessibilityRole="header">Log</Text>

      {placeholder('Mail', 'Letters from the Guild Master arrive in a later update.')}
      <Card style={{ gap: space.s }}>
        <Text variant="heading" accessibilityRole="header">Daily quests</Text>
        <Text variant="caption" color="textMuted">Three new quests every day.</Text>
        {save.daily.dayKey === today &&
          save.daily.quests.map((q) => {
            const done = q.progress >= q.target;
            return (
              <View key={q.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: minTouch + 8 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong" color={q.claimed ? 'textMuted' : 'text'}>{q.title}</Text>
                  <Text variant="caption" color="textMuted">{q.claimed ? 'Claimed' : `${q.progress} / ${q.target} · ${q.reward} gold`}</Text>
                </View>
                {!q.claimed && (
                  <Button title={done ? 'Claim' : 'In progress'} variant={done ? 'reward' : 'secondary'} disabled={!done} onPress={() => claimDaily(q.id)} />
                )}
              </View>
            );
          })}
      </Card>

      <Card style={{ gap: space.s }}>
        <Text variant="heading" accessibilityRole="header">Scrapbooks</Text>
        {REGIONS.filter((r) => isRegionUnlocked(save, r.id)).map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            accessibilityLabel={`${r.name} scrapbook, ${progressOf(save, r.id).mementos.length} of 3 mementos`}
            onPress={() => setScrapbook(r.id)}
            style={({ pressed }) => ({ minHeight: minTouch, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.7 : 1 })}
          >
            <Text variant="bodyStrong">{r.name}</Text>
            <Text color="textMuted">{progressOf(save, r.id).mementos.length} / 3 ›</Text>
          </Pressable>
        ))}
      </Card>

      <FamiliarsCard owned={save.familiars.owned} active={save.familiars.active} onSetActive={setActiveFamiliar} />

      <View style={{ gap: space.s }}>
        <Text variant="title" accessibilityRole="header">History</Text>
        {entries.length === 0 && <Text color="textMuted">Completed habits show up here.</Text>}
        {days.map(([key, list]) => (
          <View key={key} style={{ gap: space.xs }}>
            <Text variant="label" color="textMuted">{dayTitle(key)}</Text>
            <Card style={{ paddingVertical: space.xs }}>
              {list.map((e) => {
                const h = save.habits.find((x) => x.id === e.habitId);
                const name = h?.name ?? 'Deleted habit';
                return (
                  <View key={`${e.habitId}-${e.dayKey}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: minTouch + 4 }}>
                    <Text style={{ fontSize: 20, lineHeight: 26 }}>{h?.emoji ?? '✨'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{name}</Text>
                      <Text variant="caption" color="textMuted">{new Date(e.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${name} from history`}
                      onPress={() => hideFromHistory(e.habitId, e.dayKey)}
                      style={({ pressed }) => ({ minHeight: minTouch, paddingHorizontal: space.m, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
                    >
                      <Text variant="label" color="textMuted">Remove</Text>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          </View>
        ))}
        {entries.length > 0 && <Text variant="caption" color="textMuted">Removing an entry tidies your history. The habit still counts as done that day.</Text>}
      </View>

      <ScrapbookSheet regionId={scrapbook} save={save} onClose={() => setScrapbook(null)} />
    </ScrollView>
  );
}
