import { KeyboardAvoidingView, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PLACES } from '@/src/content/places';
import { REGIONS } from '@/src/content/regions';
import { TITLES, earnedTitles } from '@/src/content/titles';
import type { EyeColor, HairColor, HairStyle, Look, Pronouns, SaveData, Skin } from '@/src/game/types';
import { isRegionUnlocked } from '@/src/game/world';
import { minTouch, radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { HeroSprite } from '../hero/HeroSprite';
import { HomeScene } from '../home/HomeScene';
import { Text } from '../kit/Text';

const SKINS: { id: Skin; color: string }[] = [
  { id: 'fair', color: '#F4D7C2' },
  { id: 'light', color: '#EDC9A6' },
  { id: 'tan', color: '#E8C4A0' },
  { id: 'brown', color: '#B97F55' },
  { id: 'deep', color: '#7A4E33' },
];
const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'long', label: 'Long' },
  { id: 'curly', label: 'Curly' },
  { id: 'bun', label: 'Bun' },
];
const HAIR_COLORS: { id: HairColor; color: string }[] = [
  { id: 'black', color: '#2B2523' },
  { id: 'brown', color: '#5A3E32' },
  { id: 'auburn', color: '#8A3B24' },
  { id: 'blonde', color: '#D9B45A' },
  { id: 'silver', color: '#C9CDD2' },
  { id: 'teal', color: '#3E8A87' },
];
const EYES: { id: EyeColor; color: string }[] = [
  { id: 'dark', color: '#2A2623' },
  { id: 'brown', color: '#5B3A24' },
  { id: 'green', color: '#3E6B3A' },
  { id: 'blue', color: '#3A5E8C' },
  { id: 'violet', color: '#6A4A8C' },
];
const PRONOUNS: { id: Pronouns; label: string }[] = [
  { id: 'he', label: 'He / him' },
  { id: 'she', label: 'She / her' },
  { id: 'they', label: 'They / them' },
];

type Patch = Partial<Omit<SaveData['profile'], 'look'>> & { look?: Partial<Look> };
type Props = { visible: boolean; save: SaveData; onClose: () => void; onChange: (patch: Patch) => void };

/** Customize: name, title, pronouns, skin, hair, eyes, ears and the character box background. Changes apply as you tap. */
export function CustomizeScreen({ visible, save, onClose, onChange }: Props) {
  const { c, t } = useTheme();
  const insets = useSafeAreaInsets();
  const prof = save.profile;
  const earned = new Set(earnedTitles(save).map((x) => x.id));
  const backgrounds = ['home', ...REGIONS.filter((r) => isRegionUnlocked(save, r.id)).map((r) => r.id)];

  const chip = (label: string, selected: boolean, onPress: () => void, a11y = label, disabled = false) => (
    <Pressable
      key={a11y}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: minTouch, paddingHorizontal: space.m, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? c.primary : c.surface, borderWidth: 1, borderColor: selected ? c.primary : c.line, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 })}
    >
      <Text variant="bodyStrong" color={selected ? 'onPrimary' : 'text'}>{label}</Text>
    </Pressable>
  );
  const swatch = (color: string, selected: boolean, onPress: () => void, a11y: string) => (
    <Pressable
      key={a11y}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ width: minTouch, height: minTouch, borderRadius: minTouch / 2, backgroundColor: color, borderWidth: selected ? 3 : 1, borderColor: selected ? c.text : c.line }}
    />
  );
  const section = (title: string, body: React.ReactNode) => (
    <View style={{ gap: space.s }}>
      <Text variant="label" color="textMuted">{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>{body}</View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.s, minHeight: 52, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <View style={{ minWidth: 72 }} />
          <Text variant="heading" accessibilityRole="header">Customize</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={onClose} style={{ minWidth: 72, minHeight: minTouch, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: space.m }}>
            <Text variant="bodyStrong" color="primary">Done</Text>
          </Pressable>
        </View>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}>
            <View style={{ height: 230, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }}>
              <HomeScene place={prof.background} />
              <HeroSprite player={save.player} anim="idle" height={190} appearance={{ look: prof.look, pronouns: prof.pronouns }} />
            </View>
            <View style={{ padding: space.screen, gap: space.l }}>
              <View style={{ gap: space.s }}>
                <Text variant="label" color="textMuted">Name</Text>
                <TextInput
                  value={prof.name}
                  onChangeText={(name) => onChange({ name: name.slice(0, 24) })}
                  onEndEditing={() => !prof.name.trim() && onChange({ name: 'Adventurer' })}
                  accessibilityLabel="Name"
                  placeholder="Adventurer"
                  placeholderTextColor={c.textMuted}
                  style={[t.heading, { color: c.text, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.card, paddingHorizontal: space.l, minHeight: minTouch + 12 }]}
                />
              </View>
              {section('Title', TITLES.map((x) => chip(x.name, prof.titleId === x.id, () => onChange({ titleId: x.id }), earned.has(x.id) ? x.name : `${x.name}, locked: ${x.how}`, !earned.has(x.id))))}
              <Text variant="caption" color="textMuted">Earn more titles by adventuring, beating bosses and reaching milestones.</Text>
              {section('Pronouns', PRONOUNS.map((x) => chip(x.label, prof.pronouns === x.id, () => onChange({ pronouns: x.id }))))}
              {section('Skin tone', SKINS.map((x) => swatch(x.color, prof.look.skin === x.id, () => onChange({ look: { skin: x.id } }), `Skin ${x.id}`)))}
              {section('Hairstyle', HAIR_STYLES.map((x) => chip(x.label, prof.look.hairStyle === x.id, () => onChange({ look: { hairStyle: x.id } }))))}
              {section('Hair colour', HAIR_COLORS.map((x) => swatch(x.color, prof.look.hairColor === x.id, () => onChange({ look: { hairColor: x.id } }), `Hair ${x.id}`)))}
              {section('Eye colour', EYES.map((x) => swatch(x.color, prof.look.eyes === x.id, () => onChange({ look: { eyes: x.id } }), `Eyes ${x.id}`)))}
              {section('Ears', [chip('Round', prof.look.ears === 'round', () => onChange({ look: { ears: 'round' } })), chip('Pointed', prof.look.ears === 'pointed', () => onChange({ look: { ears: 'pointed' } }))])}
              {section('Change background', backgrounds.map((id) => chip(PLACES[id]?.name ?? id, prof.background === id, () => onChange({ background: id }))))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
