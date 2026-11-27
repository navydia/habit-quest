import { Pressable, View } from 'react-native';
import { bossTokens } from '@/src/game/bosses';
import { useTheme } from '@/src/theme/useTheme';
import { questEndTime } from '@/src/game/questRun';
import type { SaveData } from '@/src/game/types';
import { space } from '@/src/theme/tokens';
import { Button } from '../kit/Button';
import { Card } from '../kit/Card';
import { ProgressBar } from '../kit/ProgressBar';
import { Text } from '../kit/Text';
import { formatRemaining } from '../format';

type Gauge = { done: number; target: number; full: boolean; hasHabits: boolean };
type Props = {
  save: SaveData;
  gauge: Gauge;
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
  const { c } = useTheme();
  const tokens = bossTokens(save);
  const bossHabit = save.habits.find((h) => h.id === save.boss.habitId && !h.archived);
  const bossRow = gauge.hasHabits || save.habits.length > 0 ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={bossHabit ? `Boss habit ${bossHabit.name}, ${tokens} of 6 tokens. Change` : 'Choose a boss habit'}
      onPress={onBossHabit}
      style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: pressed ? 0.7 : 1 })}
    >
      {bossHabit ? (
        <>
          <Text variant="label" color="ember">{`Boss tokens ${tokens} / 6`}</Text>
          <Text variant="label" color="ember" accessibilityElementsHidden importantForAccessibility="no">
            {'◆'.repeat(tokens)}
            <Text variant="label" style={{ color: c.line }}>{'◆'.repeat(6 - tokens)}</Text>
          </Text>
        </>
      ) : (
        <Text variant="label" color="ember">Choose a boss habit ›</Text>
      )}
    </Pressable>
  ) : null;
  const run = save.activeRun;
  if (run) {
    const end = questEndTime(run, save.completions).getTime();
    const start = new Date(run.startedAt).getTime();
    const total = Math.max(1, end - start);
    return (
      <Card floating style={{ gap: space.s }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
          <IconBlob emoji={run.kind === 'boss' ? '👹' : '⚔️'} color={run.kind === 'boss' ? c.ember : c.info} />
          <View style={{ flex: 1 }}>
            <Text variant="label" color={run.kind === 'boss' ? 'ember' : 'info'}>{run.kind === 'boss' ? 'Boss fight' : 'On an adventure'}</Text>
            <Text variant="heading">{run.offer.name}</Text>
          </View>
        </View>
        <ProgressBar value={(now.getTime() - start) / total} tone="info" label="Adventure progress" />
        <Text variant="body" color="textMuted">
          Returns in {formatRemaining(end - now.getTime())}. Each habit you finish brings them home sooner.
        </Text>
        {onSkip && (
          <View style={{ flexDirection: 'row', gap: space.s }}>
            <View style={{ flex: 1 }}>
              <Button title="Skip: win" variant="secondary" onPress={() => onSkip('win')} accessibilityHint="Testing only" />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Skip: lose" variant="secondary" onPress={() => onSkip('lose')} accessibilityHint="Testing only" />
            </View>
          </View>
        )}
      </Card>
    );
  }

  let hint: string;
  if (save.habits.every((h) => h.archived)) hint = 'Add a habit to start your journey.';
  else if (!gauge.hasHabits) hint = 'No habits are scheduled today. Your hero is resting.';
  else if (startedToday) hint = 'Today\'s adventure is done. Rest up for tomorrow.';
  else if (gauge.full) hint = 'Your hero is ready to set out.';
  else hint = `${gauge.target - gauge.done} more ${gauge.target - gauge.done === 1 ? 'habit' : 'habits'} until an adventure is ready.`;

  return (
    <Card floating style={{ gap: space.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
        <IconBlob emoji="🧭" color={c.accent} />
        <Text variant="label" color="textMuted" style={{ flex: 1 }}>Adventure gauge</Text>
        <Text variant="label" color="textMuted">
          {Math.min(gauge.done, gauge.target)} / {gauge.target}
        </Text>
      </View>
      <ProgressBar value={gauge.done / gauge.target} tone={gauge.full ? 'accent' : 'primary'} label="Adventure gauge" />
      <Text variant="body" color="textMuted">{hint}</Text>
      {canStart && (tokens >= 6 && bossHabit ? (
        <Button title="Boss fight" variant="reward" onPress={onBoss} accessibilityHint="Your 6 boss tokens are ready" />
      ) : (
        <Button title="Choose an adventure" variant="reward" onPress={onChoose} />
      ))}
      {bossRow}
    </Card>
  );
}

/** Round tinted icon, like the bolt on Finch's adventure bar. */
function IconBlob({ emoji, color }: { emoji: string; color: string }) {
  return (
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no">
      <Text style={{ fontSize: 22, lineHeight: 28 }}>{emoji}</Text>
    </View>
  );
}
