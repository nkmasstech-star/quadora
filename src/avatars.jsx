// 1000 built-in avatars: 10 themes x 100 (10 symbols x 10 colours). Users can only pick from these.
export const AVATAR_THEMES = [
  { name: 'Chinese Festival', icons: ['🏮', '🐉', '🧧', '🎎', '🥮', '🎆', '🐲', '🪭', '🏯', '🎋'] },
  { name: 'Chinese Games', icons: ['🀄', '🎲', '🪁', '🦁', '🥢', '♟️', '🎴', '🐼', '🪘', '🍵'] },
  { name: 'Malay Culture', icons: ['🌴', '🛶', '🪘', '🌺', '🕌', '🥥', '🍛', '🐅', '🏝️', '🎶'] },
  { name: 'Malay Games', icons: ['🪀', '🪁', '🎯', '🪃', '🥁', '🐓', '🪵', '🎈', '🏸', '⚽'] },
  { name: 'Singapore', icons: ['🦁', '🌆', '🌺', '🚇', '🛳️', '🍜', '🌇', '🦐', '🎡', '🏙️'] },
  { name: 'Tamil Culture', icons: ['🪔', '🛕', '🌾', '🐂', '🥁', '🌺', '🐘', '🍃', '🎺', '☀️'] },
  { name: 'Tamil Games', icons: ['🤼', '🏏', '🪀', '🐂', '🎯', '🏹', '🪘', '🥥', '🛞', '🪁'] },
  { name: 'English Classic', icons: ['🎩', '☂️', '🏰', '💂', '👑', '🫖', '🎡', '🚌', '🎻', '🎭'] },
  { name: 'Cambodia', icons: ['🛕', '🐘', '🪷', '🛺', '🌾', '🐅', '🛶', '🥥', '🎭', '☀️'] },
  { name: 'Lucky Charms', icons: ['🍀', '🪙', '🧿', '⭐', '🎰', '🐉', '🌈', '🔮', '🎲', '🃏'] },
];
const COLOURS = ['#F6D365', '#F59F9F', '#9EC9F5', '#A8E0B8', '#D5B3F2', '#F7B98B', '#8FD6D0', '#F2A5C8', '#C4D67B', '#B9B7F7'];

export const avatarIcon = (id) => { const n = ((id % 1000) + 1000) % 1000; const th = AVATAR_THEMES[Math.floor(n / 100)]; return th.icons[Math.floor((n % 100) / 10)]; };
export const avatarColour = (id) => COLOURS[(((id % 1000) + 1000) % 1000) % 10];

export function Avatar({ id, size = 40, ring }) {
  return (
    <span class="av" style={`width:${size}px;height:${size}px;font-size:${Math.round(size * 0.52)}px;background:${avatarColour(id || 0)};${ring ? 'box-shadow:0 0 0 2px var(--gold)' : ''}`} aria-hidden="true">{avatarIcon(id || 0)}</span>
  );
}
