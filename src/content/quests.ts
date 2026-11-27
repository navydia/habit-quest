export interface QuestTemplate {
  id: string;
  name: string;
  flavour: string;
  /** Quest-log anecdotes, in the Guild Master's voice. */
  success: string;
  failure: string;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'slime-patrol',
    name: 'Slime Patrol',
    flavour: 'The meadow slimes are bouncing into the farm fields again.',
    success: 'Our hero herded eleven slimes back over the stone wall, mostly by standing very still and looking unimpressed. The farmer paid in gold and a jar of plum jam. The jam did not survive the walk home.',
    failure: 'The slimes merged into one large, wobbling slime and sat on the turnip patch out of spite. Our hero retreated with dignity and only a little goo in their boots. The farmer paid something for the effort anyway.',
  },
  {
    id: 'lost-lantern',
    name: 'The Lost Lantern',
    flavour: 'A lamplighter dropped her lantern somewhere along the old canal.',
    success: 'Found it hanging from a willow, still lit, guarded by a very proud heron. A fair trade of one sardine later, the lantern was back on its hook before dusk.',
    failure: 'Our hero searched the canal until the stars came out, then realised they could no longer tell which light was the lantern. The lamplighter laughed, tipped them a few coins, and said she would look in the morning.',
  },
  {
    id: 'mill-rats',
    name: 'Trouble at the Mill',
    flavour: 'Something with too many teeth has moved into the grain store.',
    success: 'It turned out to be one enormous, very old rat with a taste for barley cakes. Our hero struck a deal: it moved to the empty barn, and the miller leaves out a cake on Sundays. Everyone is happier.',
    failure: 'There were more teeth than advertised. Our hero held the door long enough for the miller to save the flour sacks, then wisely let the grain store go for the night.',
  },
  {
    id: 'courier-run',
    name: 'Courier Run',
    flavour: 'A sealed letter needs to reach the hill fort before nightfall.',
    success: 'Up the switchbacks at a steady jog, through the gate as the bell rang six. The captain read the letter, went pale, then laughed. Apparently it was a wedding invitation. Our hero was invited too.',
    failure: 'A rockslide closed the short path and the long one took until moonrise. The letter arrived late, but intact. The captain was gracious about it and paid half.',
  },
  {
    id: 'bramble-clearing',
    name: 'Bramble Clearing',
    flavour: 'The north road has vanished under thorns. Again.',
    success: 'Three hours of careful hacking and the north road reappeared, along with a cart nobody had reported missing. The cart now belongs to the town. The thorns will be back, but not this week.',
    failure: 'The brambles grew back almost as fast as our hero cut them. They cleared enough for a person on foot, which counts for something, and came home scratched but cheerful.',
  },
  {
    id: 'herb-gathering',
    name: 'Moonleaf Gathering',
    flavour: 'The apothecary is out of moonleaf, and it only grows past the ford.',
    success: 'The ford was knee-deep and freezing, the moonleaf was exactly where the old map said. Our hero brought back a full basket and an unreasonable number of opinions about cold water.',
    failure: 'A goat had found the moonleaf first and eaten nearly all of it. Our hero brought back three sprigs and a description of the goat. The apothecary was sympathetic.',
  },
  {
    id: 'bridge-toll',
    name: 'The Troll Toll',
    flavour: 'A troll is charging travellers in riddles. Nobody can answer them.',
    success: 'The answer to the troll\'s riddle was "a kettle". Our hero got it on the second try, and the troll was so delighted to finally lose that it now runs the bridge as a riddle club on weekends.',
    failure: 'The troll\'s riddles were genuinely impossible. Our hero lost five in a row, but the troll enjoyed the company so much it let the next six travellers cross for free.',
  },
  {
    id: 'missing-goat',
    name: 'A Goat of Interest',
    flavour: 'Old Benna\'s goat has wandered off with her house key.',
    success: 'The goat was on the chapel roof. Nobody knows how. The key was in its mouth, slightly chewed but still working, and Benna insisted on paying in gold and soup.',
    failure: 'Our hero found the goat but not the key, which the goat had apparently swallowed. Benna had the locksmith round by supper and paid our hero for the goat, at least.',
  },
  {
    id: 'cave-survey',
    name: 'Cave Survey',
    flavour: 'The cartographers\' guild wants the echo caves mapped, carefully.',
    success: 'Every passage counted, every drop measured, and only one moment of panic when the echo answered back in a different voice. The map is now framed in the guild hall.',
    failure: 'The echoes made it impossible to tell which tunnels were real. Our hero mapped the first chamber beautifully and wisely turned back before the second. Partial pay, full honour.',
  },
  {
    id: 'wisp-lights',
    name: 'Wisp Lights',
    flavour: 'Strange lights over the marsh are leading fishermen astray.',
    success: 'The wisps were lonely, it turns out, and liked being followed. Our hero taught the fishermen a whistle that the wisps answer, and now they light the safe path home instead.',
    failure: 'Our hero followed the lights for an hour and ended up exactly where they started, twice. They came back with wet boots, a good story and a small purse from the fishermen\'s guild.',
  },
  {
    id: 'caravan-guard',
    name: 'Caravan Guard',
    flavour: 'A spice caravan needs an extra sword through the pass.',
    success: 'Two would-be bandits took one look at our hero and remembered urgent business elsewhere. The caravan reached the far side with every sack of saffron intact, and the cook shared supper.',
    failure: 'Bandits took one cart of cinnamon before our hero drove them off. The rest of the caravan made it through, and the merchant paid for the carts that survived.',
  },
  {
    id: 'bell-tower',
    name: 'The Silent Bell',
    flavour: 'The chapel bell stopped ringing. Something is nesting in it.',
    success: 'A family of owls had moved into the bell. Our hero built them a nest box on the next beam over, and the bell rang for vespers on time for the first time in a month.',
    failure: 'The nesting thing was a very territorial owl, and it won. Our hero came down with feathers in their hair and a promise to try again once the owlets have flown.',
  },
  {
    id: 'scarecrow',
    name: 'The Restless Scarecrow',
    flavour: 'A scarecrow keeps turning up in different fields each morning.',
    success: 'Our hero kept watch all night and caught the culprit: three farm children and a wheelbarrow. The scarecrow is now officially allowed one field per week, rotating.',
    failure: 'Our hero stayed up all night and saw nothing. In the morning the scarecrow was standing right behind them. Nobody has explained this. The farmers paid them to stop asking.',
  },
  {
    id: 'ruin-relic',
    name: 'Relic in the Ruins',
    flavour: 'A scholar will pay well for a carved stone from the old watchtower.',
    success: 'The carved stone was right where the scholar said, under three centuries of ivy. She wept a little when she saw it, then paid double and started talking about a second expedition.',
    failure: 'The watchtower stairs gave way halfway up. Our hero made it down safely with a sketch of the carving instead of the stone. The scholar called it "almost as good" and paid a little.',
  },
];
