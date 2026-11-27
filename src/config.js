// App-wide constants.
export const APP_NAME = 'Q Spot 4D';
export const CONTACT_EMAIL = 'nkmasstech@gmail.com';
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
export const PUBLISHER = 'Mass tech';
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.quadora.app';
export const GOVERNING_LAW = 'India';
export const LEGAL_UPDATED = '27 November 2026';

// Ads (TEST placeholders for now; real AdMob units are added at release). Timings are easy to change here.
export const AD_INTERSTITIAL_GAP_SEC = 0; // 0 = no limit in the app; how often a full-screen ad may show is set in AdMob (frequency capping)
export const AD_BANNER_REFRESH_SEC = 60; // a banner shows a new ad this often while the user stays on the page
export const AD_FEED_EVERY = 4; // one ad card after this many posts in the Community feed
export const AD_PREDICTION_GAMES = ['magnum', 'singapore', 'gdlotto']; // full-screen ad only when these prediction cards are opened
export const POLL_GAMES = ['magnum', 'toto', 'damacai', 'singapore', 'gdlotto'];

// Test build helpers (set to false before the Play Store release).
export const TEST_MODE = !!import.meta.env.DEV;

// AdMob (personal AdMob account). Test ads everywhere except the Play release build (release workflow sets VITE_ADS_LIVE=1).
export const AD_TEST = import.meta.env.VITE_ADS_LIVE !== '1';
export const ADMOB_BANNER_ID = 'ca-app-pub-1116963475189668/2300589539';
export const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-1116963475189668/4879932670';
export const ADMOB_REWARDED_ID = 'ca-app-pub-1116963475189668/9571655026';
export const ADMOB_NATIVE_ID = 'ca-app-pub-1116963475189668/5388256020'; // Native advanced unit "QSpot Community Native"
export const ADMOB_NATIVE_TEST_ID = 'ca-app-pub-3940256099942544/2247696110'; // Google's sample native unit for test builds

// Straight chart history starts on the launch day (no back-filled charts or wins from before the app was public).
export const STRAIGHT_START = '2026-11-21';
