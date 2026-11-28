// Comment safety filter (same patterns are enforced again in firestore.rules, so the app can't be bypassed).
// Blocks: phone numbers, links and chat apps, contact requests, "sure number"/payment scams, and bad words.
// 4D numbers in groups of four ("1234 5678") are allowed.
export const COMMENT_MAX = 200;

// keep this list in step with okText() in firestore.rules
export const BLOCK_WORDS = [
  'http', 'www.', '.com', '.net', '.org', '.in/', '.my/', 'wa.me', 't.me', 'bit.ly',
  'whatsapp', 'whats app', 'watsapp', 'wtsapp', 'telegram', 'tele gram', 'wechat', 'line id', 'signal app', 'imo app',
  'dm me', 'pm me', 'inbox me', 'msg me', 'message me', 'contact me', 'call me', 'my number', 'join my group', 'join group link',
  'sure number', 'sure no', 'confirm number', 'fix number', 'fixed number', '100%', 'guarantee', 'guaranteed',
  'gpay', 'g pay', 'phonepe', 'paytm', 'upi', 'bank account', 'deposit', 'touch n go', 'tng ewallet', 'duitnow',
  'hubungi', 'pasti menang', 'nombor pasti', 'nombor tepat', 'wasap',
  '微信', '电报', '包中', '联系我', '私聊', '加我',
  'நிச்சயம் நம்பர்', 'உறுதி நம்பர்', 'கால் பண்ணுங்க', 'வாட்ஸ்அப்', 'டெலிகிராம்',
  'fuck', 'f*ck', 'bitch', 'bastard', 'asshole', 'motherfucker', 'pukimak', 'babi', 'bodoh', 'sial', 'lancau', 'puki',
  '他妈的', '傻逼', '操你', 'ommala', 'otha', 'thevidiya', 'punda', 'sunni', 'oombu', 'தேவிடியா', 'ஓத்தா', 'புண்ட',
];
// phone shapes: 012 345 6789, 98-76-543210, 98765 43210, 7+ digits in a row, +country code (4D groups of four pass)
const PHONE = [/([0-9]{1,3}[ .-]){2,}[0-9]{3,}/, /([0-9]{1,3}[ .-]){4,}[0-9]{1,3}/, /[0-9]{5,6}[ .-]?[0-9]{4,6}/, /[0-9]{7,}/, /\+ ?[0-9]/];

export function checkComment(text) {
  const s = String(text || '').trim();
  if (!s) return 'Write something first.';
  if (s.length > COMMENT_MAX) return 'Keep it under 200 characters.';
  const low = s.toLowerCase();
  if (PHONE.some((r) => r.test(low))) return 'Phone numbers are not allowed in comments.';
  if (BLOCK_WORDS.some((w) => low.includes(w))) return 'Links, contact details, payment requests and bad words are not allowed.';
  return '';
}
