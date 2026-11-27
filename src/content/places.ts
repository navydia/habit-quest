/**
 * Scene palettes for each place. `top` is the wall (home) or upper sky (regions): it fills the pull-down area.
 * `bottom` is the floor or ground: it is the Home page background under the scene.
 */
export interface PlacePalette {
  kind: 'home' | 'outdoors';
  name: string;
  top: string;
  bottom: string;
  sky?: [string, string, string];
  hills?: string;
  trees?: string;
  sun?: string;
}

export const PLACES: Record<string, PlacePalette> = {
  home: { kind: 'home', name: 'Home', top: '#5B4A43', bottom: '#6E5444' },
  'thornwick-meadows': { kind: 'outdoors', name: 'Thornwick Meadows', top: '#3E4A63', bottom: '#3B5546', sky: ['#3E4A63', '#8E7A9E', '#E9B98A'], hills: '#4F6A5A', trees: '#3E5A4B', sun: '#F6D18B' },
  'willowmere-marsh': { kind: 'outdoors', name: 'Willowmere Marsh', top: '#3B4A52', bottom: '#38504C', sky: ['#3B4A52', '#7C8F8A', '#C9D3B8'], hills: '#4E6660', trees: '#33504A', sun: '#E8EEDC' },
  'greystone-hills': { kind: 'outdoors', name: 'Greystone Hills', top: '#45475A', bottom: '#4F4D4A', sky: ['#45475A', '#8C8FA3', '#D9C9B0'], hills: '#6E6B66', trees: '#4B5A4A', sun: '#F2E2B8' },
  'emberpeak-pass': { kind: 'outdoors', name: 'Emberpeak Pass', top: '#4A2E35', bottom: '#5A3A30', sky: ['#4A2E35', '#A0524A', '#F0A06A'], hills: '#7A4A3A', trees: '#4A3A30', sun: '#FFD08A' },
};

export const placeOf = (id: string): PlacePalette => PLACES[id] ?? PLACES['thornwick-meadows'];
