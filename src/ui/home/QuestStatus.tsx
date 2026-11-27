import type React from 'react';
import { Pressable, View } from 'react-native';
import { bossTokens } from '@/src/game/bosses';
import { questEndTime } from '@/src/game/questRun';
import type { SaveData } from '@/src/game/types';
import { home, radius, space } from '@/src/theme/tokens';
import { DragonToken } from '../icons/Icons';
import { Button } from '../kit/Button';
import { Text } from '../kit/Text';
import { formatRemaining } from '../format';

type GaugeState = { done: number; target: number; full: boolean; hasHabits: boolean };
type Props = {
  save: SaveData;
  gauge: GaugeState;
  canStart: boolean;
  startedToday: boolean;
  now: Date;
  onChoose: () => void;
  /** Only passed in development builds. */
  onSkip?: (outcome: 'win' | 'lose') => void;
  onBossHabit: () => void;
  onBoss: () => void;
};


/** The card under the scene: quest gauge, or the running quest's countdown. */
export function QuestStatus({ save, gauge, canStart, startedToday, now, onChoose, onSkip, onBossHabit, onBoss }: Props) {
  const tokens = bossTokens(save);
  const bossHabit = save.habits.find((h) => h.id === save.boss.habitId && !h.archived);
  const run = save.activeRun;

  // Boss tokens as red dragon coins: lit when earned, faded when not. Tap to choose or change the boss habit.
  const devils = save.habits.length > 0 ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={bossHabit ? `Boss habit ${bossHabit.name}, ${tokens} of 6 tokens. Change` : 'Choose a boss habit'}
      onPress={onBossHabit}
      hitSlop={6}
      style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s, opacity: pressed ? 0.7 : 1 })}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <DragonToken key={i} earned={!!bossHabit && i < tokens} />
      ))}
      {!bossHabit && <Text variant="label" style={{ color: home.muted }}>Choose a boss habit</Text>}
    </Pressable>
  ) : null;

  const panel = (children: React.ReactNode) => (
    <View style={{ backgroundColor: 'rgba(255,248,236,0.08)', borderWidth: 1, borderColor: home.line, borderRadius: 24, padding: space.l, gap: space.m }}>{children}</View>
  );

  if (run) {
    const end = questEndTime(run, save.completions).getTime();
    const start = new Date(run.startedAt).getTime();
    const total = Math.max(1, end - start);
    return panel(
      <>
        <Text variant="label" style={{ color: run.kind === 'boss' ? home.bossText : home.muted }}>
          {run.kind === 'boss' ? 'Boss fight' : 'On an adventure'} · {run.offer.name}
        </Text>
        <Gauge value={(now.getTime() - start) / total} fill={run.kind === 'boss' ? home.fill.ember : home.fill.slate} label="Adventure progress" text={`Back in ${formatRemaining(end - now.getTime())}`} />
        <Text variant="caption" style={{ color: home.muted }}>Each habit you finish brings them home sooner.</Text>
        {onSkip && (
          <View style={{ flexDirection: 'row', gap: space.s }}>
            <View style={{ flex: 1 }}>
              <Button title="Skip: win" variant="outline" outlineColor={home.text} onPress={() => onSkip('win')} accessibilityHint="Testing only" />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Skip: lose" variant="outline" outlineColor={home.text} onPress={() => onSkip('lose')} accessibilityHint="Testing only" />
            </View>
          </View>
        )}
      </>,
    );
  }

  let hint: string | null = null;
  if (save.habits.every((h) => h.archived)) hint = 'Add a habit to start your journey.';
  else if (!gauge.hasHabits) hint = 'No habits are scheduled today. Your hero is resting.';
  else if (startedToday) hint = 'Today\'s adventure is done. Rest up for tomorrow.';

  return panel(
    <>
      <Text variant="label" style={{ color: home.muted }}>Adventure gauge</Text>
      <Gauge
        value={gauge.done / gauge.target}
        fill={gauge.full ? home.fill.gold : home.fill.moss}
        label="Adventure gauge"
        text={`${Math.min(gauge.done, gauge.target)} / ${gauge.target}`}
      />
      {hint && <Text variant="caption" style={{ color: home.muted, textAlign: 'center' }}>{hint}</Text>}
      {devils}
      {canStart && (tokens >= 6 && bossHabit ? (
        <Button title="Boss fight" variant="reward" onPress={onBoss} accessibilityHint="Your 6 boss tokens are ready" />
      ) : (
        <Button title="Choose an adventure" variant="reward" onPress={onChoose} />
      ))}
    </>,
  );
}

/** A tall gauge with its count written inside. */
function Gauge({ value, fill, label, text }: { value: number; fill: string; label: string; text: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100), text }}
      style={{ height: 32, borderRadius: radius.chip, backgroundColor: 'rgba(255,248,236,0.14)', overflow: 'hidden', justifyContent: 'center' }}
    >
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${v * 100}%`, backgroundColor: fill, borderRadius: radius.chip }} />
      <Text variant="bodyStrong" style={{ color: home.text, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}
