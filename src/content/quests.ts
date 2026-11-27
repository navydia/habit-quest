export interface QuestTemplate {
  id: string;
  name: string;
  flavour: string;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  { id: 'slime-patrol', name: 'Slime Patrol', flavour: 'The meadow slimes are bouncing into the farm fields again.' },
  { id: 'lost-lantern', name: 'The Lost Lantern', flavour: 'A lamplighter dropped her lantern somewhere along the old canal.' },
  { id: 'mill-rats', name: 'Trouble at the Mill', flavour: 'Something with too many teeth has moved into the grain store.' },
  { id: 'courier-run', name: 'Courier Run', flavour: 'A sealed letter needs to reach the hill fort before nightfall.' },
  { id: 'bramble-clearing', name: 'Bramble Clearing', flavour: 'The north road has vanished under thorns. Again.' },
  { id: 'herb-gathering', name: 'Moonleaf Gathering', flavour: 'The apothecary is out of moonleaf, and it only grows past the ford.' },
  { id: 'bridge-toll', name: 'The Troll Toll', flavour: 'A troll is charging travellers in riddles. Nobody can answer them.' },
  { id: 'missing-goat', name: 'A Goat of Interest', flavour: 'Old Benna\'s goat has wandered off with her house key.' },
  { id: 'cave-survey', name: 'Cave Survey', flavour: 'The cartographers\' guild wants the echo caves mapped, carefully.' },
  { id: 'wisp-lights', name: 'Wisp Lights', flavour: 'Strange lights over the marsh are leading fishermen astray.' },
  { id: 'caravan-guard', name: 'Caravan Guard', flavour: 'A spice caravan needs an extra sword through the pass.' },
  { id: 'bell-tower', name: 'The Silent Bell', flavour: 'The chapel bell stopped ringing. Something is nesting in it.' },
  { id: 'scarecrow', name: 'The Restless Scarecrow', flavour: 'A scarecrow keeps turning up in different fields each morning.' },
  { id: 'ruin-relic', name: 'Relic in the Ruins', flavour: 'A scholar will pay well for a carved stone from the old watchtower.' },
];
