import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gearById, RARITY_LABEL } from '@/src/content/gear';
import { familiarById } from '@/src/content/regions';
import { SLOT_INFO } from '@/src/content/slots';
import { POWER_PER_POINT, SPEED_CUT_MAX, SPEED_CUT_PER_POINT, BOSS_DEFENSE_PER_POINT, DROP_LUCK_PER_POINT } from '@/src/game/config';
import { lifetimeStats } from '@/src/game/lifetime';
import { expToNext } from '@/src/game/progression';
import { STAT_KEYS, gearStats, powerOf } from '@/src/game/stats';
import type { Slot, StatKey } from '@/src/game/types';
import { useGameStore } from '@/src/store/gameStore';
import { board, fonts, home, hud, minTouch, radius, rarity as rarityColors, space } from '@/src/theme/tokens';
import { titleById } from '@/src/content/titles';
import { HomeScene } from '@/src/ui/home/HomeScene';
import { placeOf } from '@/src/content/places';
import { CustomizeScreen } from '@/src/ui/character/CustomizeScreen';
import { CogIcon } from '@/src/ui/icons/Icons';
import { useTheme } from '@/src/theme/useTheme';
import { FamiliarSheet, familiarBonusText } from '@/src/ui/character/FamiliarSheet';
import { SlotSheet } from '@/src/ui/character/SlotSheet';
import { HeroSprite } from '@/src/ui/hero/HeroSprite';
import { Button } from '@/src/ui/kit/Button';
import { ProgressBar } from '@/src/ui/kit/ProgressBar';
import { Sheet } from '@/src/ui/kit/Sheet';
import { TactileCard } from '@/src/ui/kit/TactileCard';
import { Text } from '@/src/ui/kit/Text';

const LEFT: Slot[] = ['weapon', 'head', 'body'];
const RIGHT: (Slot | 'familiar')[] = ['feet', 'accessory', 'familiar'];

const STAT_STYLE: Record<StatKey, { name: string; emoji: string; color: string }> = {
  power: { name: 'Power', emoji: '💪', color: '#E3A99A' },
  defense: { name: 'Defense', emoji: '🛡️', color: '#9DB8D3' },
  luck: { name: 'Luck', emoji: '🍀', color: '#A8C9A0' },
  speed: { name: 'Speed', emoji: '💨', color: '#E6C27A' },
};

/** What a stat total actually does, in plain numbers. */
function effectText(stat: StatKey, total: number): string {
  if (stat === 'power') return `+${POWER_PER_POINT * total} power rating`;
  if (stat === 'defense') return `+${BOSS_DEFENSE_PER_POINT * total} power against bosses`;
  if (stat === 'luck') return `+${Math.round(DROP_LUCK_PER_POINT * total * 100)}% drop chance`;
  return `−${Math.round(Math.min(SPEED_CUT_MAX, SPEED_CUT_PER_POINT * total) * 100)}% adventure time`;
}

export default function CharacterScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const save = useGameStore((s) => s.save);
  const p = save.player;
  const { allocateSp, respec, equip, unequip, setActiveFamiliar } = useGameStore.getState();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [familiarOpen, setFamiliarOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const { setProfile } = useGameStore.getState();
  const need = expToNext(p.level);
  const gear = gearStats(p);
  const life = lifetimeStats(save);
  const fam = save.familiars.active ? familiarById(save.familiars.active) : undefined;

  const box = (s: Slot | 'familiar') => {
    const def = s === 'familiar' ? undefined : gearById(p.inventory.find((i) => i.uid === p.equipped[s])?.gearId ?? '');
    const filled = s === 'familiar' ? !!fam : !!def;
    const unknown = s !== 'familiar' && !!p.equipped[s] && !def;
    const border = s === 'familiar' ? (fam ? c.primary : c.line) : def ? rarityColors[def.rarity] : c.line;
    const name = s === 'familiar' ? (fam?.name ?? 'Familiar') : (def?.name ?? SLOT_INFO[s].name);
    return (
      <Pressable
        key={s}
        accessibilityRole="button"
        accessibilityLabel={s === 'familiar' ? `Familiar: ${fam ? `${fam.name}, ${familiarBonusText(fam.id)}` : 'empty'}` : `${SLOT_INFO[s].name}: ${def ? `${def.name}, ${RARITY_LABEL[def.rarity]}` : unknown ? 'Unknown item' : 'empty'}`}
        onPress={() => (s === 'familiar' ? setFamiliarOpen(true) : setSlot(s))}
        style={({ pressed }) => ({ alignItems: 'center', gap: 2, opacity: pressed ? 0.8 : 1, width: 76 })}
      >
        <View style={{ width: 64, height: 64, borderRadius: 18, borderWidth: 3, borderColor: border, backgroundColor: filled ? 'rgba(255,248,236,0.16)' : 'rgba(255,248,236,0.06)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 26, lineHeight: 32, opacity: filled ? 1 : 0.4 }}>{s === 'familiar' ? (fam ? '🐾' : '🐾') : SLOT_INFO[s].emoji}</Text>
        </View>
        <Text variant="caption" style={{ color: home.text, textAlign: 'center', backgroundColor: hud.bg, borderRadius: 6, paddingHorizontal: 4, overflow: 'hidden' }} numberOfLines={1}>{name}</Text>
      </Pressable>
    );
  };

  const tile = (emoji: string, value: number, label: string, color: string) => (
    <View key={label} style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: color, borderRadius: radius.card, padding: space.m, gap: 2 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text variant="title" style={{ color: board.ink }}>{value}</Text>
      <Text variant="caption" style={{ color: board.ink }}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.screen, paddingTop: insets.top + space.l, paddingBottom: insets.bottom + 96, gap: space.l }}>
      {/* Full-bleed character box: place background, power on top, then name, title, class · level. */}
      {/* Background colour = the place's ground, so a tall box (long name, big text) never shows a pale gap. */}
      <View style={{ marginHorizontal: -space.screen, marginTop: -(insets.top + space.l), paddingTop: insets.top + space.m, paddingHorizontal: space.screen, paddingBottom: space.l, gap: space.s, overflow: 'hidden', backgroundColor: placeOf(save.profile.background).bottom }}>
        <HomeScene place={save.profile.background} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%', backgroundColor: 'rgba(28,24,22,0.35)' }} />
        <View style={{ alignItems: 'center' }} accessible accessibilityLabel={`${powerOf(p)} power`}>
          <Text variant="label" style={{ color: home.muted }}>POWER</Text>
          <Text style={{ fontFamily: fonts.heading, fontSize: 44, lineHeight: 50, color: home.text }}>{powerOf(p)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: space.m }}>{LEFT.map(box)}</View>
          {/* The cog sits on the portrait's bottom-right, next to the familiar box. */}
          <View>
            <HeroSprite player={p} anim="idle" height={200} appearance={{ look: save.profile.look, pronouns: save.profile.pronouns }} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Customize your character"
              onPress={() => setCustomizing(true)}
              style={({ pressed }) => ({ position: 'absolute', right: -6, bottom: 4, width: minTouch, height: minTouch, borderRadius: minTouch / 2, backgroundColor: hud.bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
            >
              <CogIcon color={home.text} />
            </Pressable>
          </View>
          <View style={{ gap: space.m }}>{RIGHT.map(box)}</View>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text variant="display" accessibilityRole="header" style={{ color: home.text, textAlign: 'center' }}>{save.profile.name.trim() || 'Adventurer'}</Text>
          <Text variant="bodyStrong" style={{ color: home.muted }}>{titleById(save.profile.titleId)?.name ?? 'the Wanderer'}</Text>
          <Text variant="caption" style={{ color: home.muted }}>{p.title} · Level {p.level}</Text>
        </View>
        <View style={{ gap: space.xs }}>
          <ProgressBar value={p.exp / need} label="Experience" tone="accent" />
          <Text variant="caption" style={{ color: home.muted }}>{p.exp} / {need} EXP to level {p.level + 1}</Text>
        </View>
      </View>

      {/* Stats with what they do */}
      <TactileCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="heading" accessibilityRole="header">Stats</Text>
          {p.unspentSp > 0 && (
            <View style={{ backgroundColor: c.accent, borderRadius: radius.chip, paddingHorizontal: space.m, paddingVertical: 2 }}>
              <Text variant="label" color="onAccent">{p.unspentSp} {p.unspentSp === 1 ? 'point' : 'points'} to spend</Text>
            </View>
          )}
        </View>
        {STAT_KEYS.map((k) => {
          const total = p.stats[k] + gear[k];
          return (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: minTouch + 8 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: STAT_STYLE[k].color, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] }}>
                <Text style={{ fontSize: 20 }}>{STAT_STYLE[k].emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{STAT_STYLE[k].name} {total}{gear[k] ? <Text variant="caption" color="textMuted">{`  (${p.stats[k]} + ${gear[k]} gear)`}</Text> : null}</Text>
                <Text variant="caption" color="textMuted">{effectText(k, total)}</Text>
              </View>
              {p.unspentSp > 0 && (
                <Pressable accessibilityRole="button" accessibilityLabel={`Add a point to ${STAT_STYLE[k].name}`} onPress={() => allocateSp(k)} style={({ pressed }) => ({ width: minTouch, height: minTouch, borderRadius: radius.button, backgroundColor: pressed ? c.primaryLip : c.primary, alignItems: 'center', justifyContent: 'center' })}>
                  <Text variant="title" color="onPrimary">+</Text>
                </Pressable>
              )}
            </View>
          );
        })}
        {p.spentSp > 0 && <Button title="Reset points" variant="secondary" onPress={() => setConfirmReset(true)} />}
      </TactileCard>

      {/* Lifetime stats */}
      <TactileCard>
        <Text variant="heading" accessibilityRole="header">Your journey</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
          {tile('⚔️', life.adventuresCompleted, `Adventures won (${life.adventuresTried} tried)`, '#E3A99A')}
          {tile('✅', life.habitsCompleted, 'Habits completed', '#A8C9A0')}
          {tile('😈', life.bossesBeaten, 'Bosses beaten', '#D9B28A')}
          {tile('🗺️', life.regionsExplored, 'Regions explored', '#9DB8D3')}
          {tile('✦', life.mementos, 'Mementos found', '#E6C27A')}
          {tile('🪙', life.goldEarned, 'Gold earned', '#B9AED6')}
        </View>
      </TactileCard>

      {__DEV__ && <Button title="Art preview (testing)" variant="secondary" onPress={() => router.push('/art-preview')} />}

      <CustomizeScreen visible={customizing} save={save} onClose={() => setCustomizing(false)} onChange={setProfile} />
      <SlotSheet slot={slot} player={p} onClose={() => setSlot(null)} onEquip={(uid) => equip(uid)} onUnequip={unequip} />
      <FamiliarSheet visible={familiarOpen} owned={save.familiars.owned} active={save.familiars.active} onClose={() => setFamiliarOpen(false)} onSetActive={setActiveFamiliar} />
      <Sheet visible={confirmReset} title="Reset your points?" onClose={() => setConfirmReset(false)}>
        <View style={{ gap: space.l }}>
          <Text color="textMuted">All {p.spentSp} points come back for you to spend again. It&rsquo;s free.</Text>
          <Button title={`Reset ${p.spentSp} points`} onPress={() => { respec(); setConfirmReset(false); }} />
          <Button title="Keep them" variant="secondary" onPress={() => setConfirmReset(false)} />
        </View>
      </Sheet>
    </ScrollView>
  );
}
