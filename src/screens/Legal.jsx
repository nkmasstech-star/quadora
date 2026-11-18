import { BackBar } from '../ui.jsx';
import { t } from '../i18n.js';
import { APP_NAME, CONTACT_EMAIL } from '../config.js';

const DOCS = {
  disclaimer: {
    title: 'Disclaimer',
    body: [
      ['For information and entertainment only', `${APP_NAME} shows lottery results, statistics, analysis and number suggestions for information and entertainment. It does not sell tickets, accept bets, handle money or run any draw.`],
      ['No guarantee', 'Predictions, charts, lucky numbers and community posts are statistical guesses or personal opinions. They are not advice and they are not guaranteed. Nobody can predict a lottery draw. Past results do not affect future draws.'],
      ['Not affiliated', 'Quadora is an independent app. It is not affiliated with, endorsed by or connected to Magnum, Sports Toto, Da Ma Cai, Singapore Pools, Grand Dragon Lotto or any other lottery operator. All names belong to their owners and are used only to describe the draws.'],
      ['Official results', 'Results are collected from public sources and may contain delays or errors. Always check the official operator before you act on any result.'],
      ['Age and responsibility', 'You must be 18 or older. Gambling can be addictive and may be restricted where you live. You are responsible for following your local laws. Never spend money you cannot afford to lose. If gambling is a problem for you, please seek help.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      ['What we collect', 'If you create an account: your name, email address, chosen avatar, the predictions you post, your likes, dislikes and follows. If you only use the app as a guest, we collect no account data. The app also stores your theme, language and lucky numbers on your phone.'],
      ['How we use it', 'To run your account, show your posts and profile to other players, calculate winning percentages, keep the app secure and improve it. We never sell your personal data.'],
      ['Other players see', 'Your display name, avatar, posts, follower count and winning percentage. Your email is never shown to other players.'],
      ['Services we use', 'Online accounts and the community are provided by Google Firebase. Ads may be shown through Google AdMob, which can use an advertising ID on your device. You can reset or limit the advertising ID in your Android settings.'],
      ['Your choices', 'You can delete your account at any time from Settings. This removes your profile and your posts. You can ask questions about your data by email.'],
      ['Children', 'This app is for adults aged 18 and over. We do not knowingly collect data from anyone under 18.'],
      ['Contact', `Questions about privacy: ${CONTACT_EMAIL}`],
    ],
  },
  terms: {
    title: 'Terms of Use',
    body: [
      ['Using the app', 'You may use Quadora for personal, lawful purposes if you are 18 or older. You are responsible for your account and for what you post.'],
      ['Community rules', 'Post only your own number picks. No abuse, hate, spam, scams, advertising or links. One post per day. Posts that break the rules can be removed and accounts can be blocked.'],
      ['No guarantees', 'The app is provided as is. We do not promise that results, analysis or predictions are accurate, complete or available at all times. See the Disclaimer.'],
      ['Changes', 'We may update the app and these terms. Continuing to use the app means you accept the updated terms.'],
      ['Contact', CONTACT_EMAIL],
    ],
  },
};

export function Legal({ kind }) {
  const d = DOCS[kind] || DOCS.disclaimer;
  return (
    <div class="legal-page">
      <BackBar title={t(d.title)} />
      <div class="pcard" style="margin-top:14px">
        {d.body.map(([h, p]) => (
          <div key={h} style="margin-bottom:16px">
            <div style="font-weight:700;margin-bottom:4px">{h}</div>
            <div class="meta" style="line-height:1.65;font-size:14px">{p}</div>
          </div>
        ))}
        <div class="meta" style="font-size:12px">Last updated: November 2026</div>
      </div>
    </div>
  );
}
