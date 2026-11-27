import { View } from 'react-native';
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
  onSkip?: () => void;
};


/** The card under the scene: quest gauge, or the running quest's countdown. */
export function QuestStatus({ save, gauge, canStart, startedToday, now, onChoose, onSkip }: Props) {
  const run = save.activeRun;
  if (run) {
    const end = questEndTime(run, save.completions).getTime();
    const start = new Date(run.startedAt).getTime();
    const total = Math.max(1, end - start);
    return (
      <Card floating style={{ gap: space.s }}>
        <Text variant="label" color="info">On an adventure</Text>
        <Text variant="heading">{run.offer.name}</Text>
        <ProgressBar value={(now.getTime() - start) / total} tone="info" label="Adventure progress" />
        <Text variant="body" color="textMuted">
          Returns in {formatRemaining(end - now.getTime())}. Each habit you finish brings them home sooner.
        </Text>
        {onSkip && <Button title="Skip (testing)" variant="secondary" onPress={onSkip} />}
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="label" color="textMuted">Adventure gauge</Text>
        <Text variant="label" color="textMuted">
          {Math.min(gauge.done, gauge.target)} / {gauge.target}
        </Text>
      </View>
      <ProgressBar value={gauge.done / gauge.target} tone={gauge.full ? 'accent' : 'primary'} label="Adventure gauge" />
      <Text variant="body" color="textMuted">{hint}</Text>
      {canStart && <Button title="Choose an adventure" variant="reward" onPress={onChoose} />}
    </Card>
  );
}
