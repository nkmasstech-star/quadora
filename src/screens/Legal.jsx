import { BackBar } from '../ui.jsx';
import { t } from '../i18n.js';
import { APP_NAME, CONTACT_EMAIL, PUBLISHER, GOVERNING_LAW, LEGAL_UPDATED } from '../config.js';

export const DOCS = {
  disclaimer: {
    title: 'Disclaimer',
    body: [
      ['For information and entertainment only', `${APP_NAME} shows lottery results, statistics, analysis and number suggestions for information and entertainment. It does not sell tickets, accept bets, handle money, offer prizes or run any draw.`],
      ['No guarantee', 'Predictions, charts, lucky numbers, game numbers and community posts are statistical guesses or personal opinions. They are not advice and they are not guaranteed. Nobody can predict a lottery draw. Past results do not affect future draws. Any number you get from a game or scratch card is random.'],
      ['Not affiliated', `${APP_NAME} is an independent app published by ${PUBLISHER}. It is not affiliated with, endorsed by, sponsored by or connected to Magnum, Sports Toto, Da Ma Cai, Singapore Pools, Grand Dragon Lotto or any other lottery operator. All names and trademarks belong to their owners and are used only to describe the draws.`],
      ['Results may contain errors', 'Results are collected from public sources and may be delayed, incomplete or wrong. Always check the official operator before you act on any result or claim any prize. We are not responsible for any loss caused by relying on results shown here.'],
      ['Your local laws', 'Lottery and gambling laws are different in every country and some places restrict or forbid them. You are responsible for following the laws where you live. The app is not an invitation to gamble anywhere gambling is not allowed.'],
      ['Age and responsible play', 'You must be 18 or older. Gambling can be addictive. Never spend money you cannot afford to lose and never chase losses. If gambling is a problem for you or someone you know, please talk to someone you trust and contact a gambling support service in your country.'],
      ['Ads and links', 'The app may show ads. We do not control the ads or any website you reach from them and we do not endorse them.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      ['Who we are', `${APP_NAME} is published by ${PUBLISHER}, India. Contact: ${CONTACT_EMAIL}`],
      ['What we collect', 'If you sign in with Google: your name, email address and Google account ID. In the app: the avatar you choose, the predictions you post, your likes, saves, follows, blocks and reports, and your saved lucky numbers. As a guest we collect no account data. Your theme, language and sound choice are stored on your phone.'],
      ['What we do not collect', 'We do not collect your precise location, contacts, photos, microphone or payment details. We do not ask for your phone number or date of birth.'],
      ['How we use it', 'To create and run your account, show your posts and profile to other players, work out winning percentages, check your saved numbers when results arrive, keep the community safe and improve the app. We never sell your personal data.'],
      ['What other players see', 'Your display name, avatar, posts, follower count and winning percentage. Your email is never shown to other players.'],
      ['Services we use', 'Sign-in, accounts and the community are provided by Google Firebase (Google LLC). Ads may be shown through Google AdMob, which may use the advertising ID of your device and similar technology. You can reset or limit the advertising ID in your Android settings. These services process data under their own privacy policies.'],
      ['Where data is kept', 'Your data may be stored and processed on Google servers in other countries. We take reasonable steps to protect it, but no system is completely secure.'],
      ['How long we keep it', 'We keep your account data while your account is active. When you delete your account, your profile and posts are removed. Some records, such as safety reports, may be kept for a limited time where needed to protect the community or meet legal duties.'],
      ['Your choices and rights', 'You can change your name and avatar (within the limits shown in the app), and you can delete your account at any time in Settings. You can also ask us by email to access, correct or delete your data. We will reply within a reasonable time.'],
      ['Children', 'This app is only for adults aged 18 and over. We do not knowingly collect data from anyone under 18. If you think a child has an account, email us and we will remove it.'],
      ['Changes', 'We may update this policy. The date at the bottom shows the latest version. If a change is important we will tell you in the app.'],
      ['Contact', `Questions about privacy: ${CONTACT_EMAIL}`],
    ],
  },
  terms: {
    title: 'Terms of Use',
    body: [
      ['Using the app', `By using ${APP_NAME} you agree to these terms. You must be 18 or older and use the app only for personal, lawful purposes. You are responsible for your account and for what you post.`],
      ['Not a gambling service', 'The app only shows information and entertainment. We do not sell tickets, take bets, hold money or pay prizes. See the Disclaimer.'],
      ['Your account', 'You sign in with your Google account. Keep it secure. You may delete your account at any time in Settings. We may suspend or remove accounts that break these terms.'],
      ['Community rules', 'Post only your own number picks. Do not post abuse, hate, threats, adult content, scams, false claims of winning, spam, advertising, links or other people\'s personal details. One post per day. Do not copy or pretend to be someone else.'],
      ['Reports and moderation', 'You can report any post and block any player. We may hide, edit or remove posts and warn, suspend or ban accounts that break the rules, with or without notice. Posts that receive several reports may be hidden until we review them.'],
      ['Your content', 'You own what you post. By posting you allow us to show it inside the app to other users. You promise that it is yours to share and does not break any law or anyone\'s rights.'],
      ['No guarantees', 'The app is provided as is and as available. We do not promise that results, analysis, predictions or numbers are accurate, complete, winning or available at all times.'],
      ['Limit of responsibility', 'To the fullest extent the law allows, we are not responsible for any loss or damage from using the app or relying on its information, including any money spent on lottery tickets.'],
      ['Changes', 'We may update the app and these terms. Continuing to use the app after a change means you accept the updated terms.'],
      ['Governing law', `These terms are governed by the laws of ${GOVERNING_LAW}. Any dispute will be handled by the courts of ${GOVERNING_LAW}.`],
      ['Contact', `${PUBLISHER} · ${CONTACT_EMAIL}`],
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
        <div class="meta" style="font-size:12px">{t("Last updated")}: {LEGAL_UPDATED}</div>
      </div>
    </div>
  );
}
