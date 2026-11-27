import type { LifeArea, TimeOfDay } from '../game/types';

/** `color`: the soft blob behind a habit's emoji (muted, style guide §3). */
export const LIFE_AREAS: { id: LifeArea; label: string; emoji: string; color: string }[] = [
  { color: '#A8C9A0', id: 'health', label: 'Health', emoji: '💪' },
  { color: '#B9AED6', id: 'mind', label: 'Mind', emoji: '🧘' },
  { color: '#C9B48E', id: 'work', label: 'Work', emoji: '💼' },
  { color: '#D9B28A', id: 'home', label: 'Home', emoji: '🏡' },
  { color: '#E3A99A', id: 'social', label: 'Social', emoji: '💬' },
  { color: '#9DB8D3', id: 'learning', label: 'Learning', emoji: '📚' },
  { color: '#E6C27A', id: 'fun', label: 'Fun', emoji: '🎨' },
  { color: '#CFC6B8', id: 'other', label: 'Other', emoji: '✨' },
];

export const TIMES_OF_DAY: { id: TimeOfDay; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'anytime', label: 'Anytime' },
];

export const EMOJI_CHOICES = ['✨', '💧', '🏃', '🧘', '📚', '✍️', '🛏️', '🍎', '🦷', '💊', '🧹', '🪴', '🎸', '🎨', '💼', '📞', '🚶', '🏋️', '🧠', '🌞', '🌙', '☕', '🥗', '🐾'];

export const lifeAreaLabel = (id: LifeArea) => LIFE_AREAS.find((a) => a.id === id)?.label ?? 'Other';
export const timeLabel = (id: TimeOfDay) => TIMES_OF_DAY.find((t) => t.id === id)?.label ?? 'Anytime';

export const lifeAreaColor = (id: LifeArea) => LIFE_AREAS.find((a) => a.id === id)?.color ?? '#CFC6B8';
