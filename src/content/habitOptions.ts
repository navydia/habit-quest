import type { LifeArea, TimeOfDay } from '../game/types';

export const LIFE_AREAS: { id: LifeArea; label: string; emoji: string }[] = [
  { id: 'health', label: 'Health', emoji: '💪' },
  { id: 'mind', label: 'Mind', emoji: '🧘' },
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'home', label: 'Home', emoji: '🏡' },
  { id: 'social', label: 'Social', emoji: '💬' },
  { id: 'learning', label: 'Learning', emoji: '📚' },
  { id: 'fun', label: 'Fun', emoji: '🎨' },
  { id: 'other', label: 'Other', emoji: '✨' },
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
