import { photoOf } from './data/photo.js';
export const AVATAR_THEMES = [
  { name: 'Festive', icons: ['🏮', '🐉', '🧧', '🎎', '🥮', '🎆', '🧨', '🏯', '🎋', '🐼', '🥟', '🍜', '🥢', '🎭', '🐓', '🍊', '🎏', '🍵', '🦁', '🐅'] },
  { name: 'Games', icons: ['🀄', '🎲', '🪁', '♟️', '🎴', '🏓', '🏸', '🥋', '🎯', '🧩', '🎱', '🃏', '🏀', '⚽', '🏆', '🥇', '🐼', '🍵', '🎮', '🏮'] },
  { name: 'Culture', icons: ['🌴', '🛶', '🕌', '🌺', '🥥', '🍛', '🐅', '🏝️', '🍢', '🍚', '🥭', '🍌', '🦧', '🌙', '⭐', '🍵', '🏙️', '🐘', '🦜', '🍍'] },
  { name: 'Sports', icons: ['🪁', '🏸', '⚽', '🥁', '🐓', '🎯', '🏹', '🥋', '🎈', '🏏', '🏆', '🥅', '🎣', '🛶', '🏐', '🚴', '🎱', '🤸', '🏅', '🥇'] },
  { name: 'City Life', icons: ['🦁', '🌆', '🌺', '🚇', '🛳️', '🍜', '🦀', '🦐', '🎡', '🏙️', '🌇', '🍗', '✈️', '🌴', '🛍️', '🍧', '🌃', '🎆', '🏗️', '🐠'] },
  { name: 'Heritage', icons: ['🪔', '🛕', '🌾', '🐂', '🥁', '🌺', '🐘', '🍃', '🥭', '🍌', '🌴', '🥥', '☀️', '🐅', '🦚', '☕', '🍛', '🪕', '🎬', '🎞️'] },
  { name: 'Play', icons: ['🤼', '🏏', '🐂', '🏹', '🎯', '🥁', '🏐', '🏑', '🏸', '🎲', '🥋', '🏆', '⚽', '🏃', '🚴', '🎱', '🥥', '🪁', '🎬', '🥇'] },
  { name: 'Classic', icons: ['🎩', '☂️', '🏰', '💂', '👑', '🍵', '🎡', '🚌', '🎻', '🎭', '📞', '🕰️', '⚽', '🏏', '🥧', '🌹', '🚇', '🎠', '🐎', '🌧️'] },
  { name: 'Temples', icons: ['🛕', '🐘', '🌸', '🛺', '🌾', '🐅', '🛶', '🥥', '🎭', '☀️', '🍚', '🍲', '🐟', '🌴', '🥭', '🏺', '🐍', '🎶', '🦜', '🌺'] },
  { name: 'Lucky', icons: ['🍀', '💰', '🧿', '⭐', '🎰', '🐉', '🌈', '🔮', '🎲', '🃏', '🐞', '🌟', '🎁', '💎', '🔔', '🧧', '🐠', '🦄', '🍊', '🏆'] },
];
// 10 themes x 100 = 1000 avatars: 20 pictures x 5 colours per theme. Users can only pick from these.
const COLOURS = ['#F6D365', '#F59F9F', '#9EC9F5', '#A8E0B8', '#D5B3F2'];

export const avatarIcon = (id) => { const n = ((id % 1000) + 1000) % 1000; const th = AVATAR_THEMES[Math.floor(n / 100)]; return th.icons[(n % 100) % 20]; };
export const avatarColour = (id) => { const n = ((id % 1000) + 1000) % 1000; return COLOURS[Math.floor((n % 100) / 20)]; };

// uid given and the player set a photo (not hidden by reports): show the photo, else the sticker
export function Avatar({ id, size = 40, ring, uid }) {
  const photo = uid ? photoOf(uid) : '';
  if (photo) return <img class="av av-photo" src={photo} alt="" loading="lazy" style={`width:${size}px;height:${size}px;${ring ? 'box-shadow:0 0 0 2px var(--gold)' : ''}`} onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />;
  return (
    <span class="av" style={`width:${size}px;height:${size}px;font-size:${Math.round(size * 0.52)}px;background:${avatarColour(id || 0)};${ring ? 'box-shadow:0 0 0 2px var(--gold)' : ''}`} aria-hidden="true">{avatarIcon(id || 0)}</span>
  );
}
