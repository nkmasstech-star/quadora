// App-wide constants. Fill CONTACT_EMAIL before the Play Store release.
export const APP_NAME = 'Q Spot 4D';
export const CONTACT_EMAIL = 'support@qspot4d.app';
export const EDIT_BEFORE_HOURS = 2; // posts can be edited/deleted until this many hours before the draw starts
export const FOLLOW_MIN_DRAWS = 4; // winning % shows after this many checked posts
export const MIN_AGE = 18;
export const NAME_EDITS = 3;
export const AVATAR_EDITS = 3;
export const NAME_MAX = 25;

// Official draw start times (local time of the operator's country). CHECK against the official sites before release.
// utc = hours ahead of UTC for that country (Malaysia/Singapore +8, Cambodia +7)
export const DRAW_TIMES = {
  magnum: { h: 19, m: 0, utc: 8 },
  toto: { h: 19, m: 0, utc: 8 },
  damacai: { h: 19, m: 0, utc: 8 },
  singapore: { h: 18, m: 30, utc: 8 },
  gdlotto: { h: 19, m: 15, utc: 7 },
};
