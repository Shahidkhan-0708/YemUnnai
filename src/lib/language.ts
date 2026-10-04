import { useCallback, useSyncExternalStore } from 'react';
import { safeStorage } from './storage';
import type { OrderStatus } from './types';
let language: 'en' | 'te' = safeStorage.getItem('yemunnai-language') === 'te' ? 'te' : 'en';
const listeners = new Set<() => void>();
export function useLanguage() {
  const lang = useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => language);
  const t = useCallback((en: string, te: string) => lang === 'te' ? te : en, [lang]);
  return { lang, t,
    setLanguage: (value: 'en' | 'te') => {
      language = value; safeStorage.setItem('yemunnai-language', value); document.documentElement.lang = value;
      listeners.forEach(cb => cb());
    },
  };
}
document.documentElement.lang = language;
export const statusLabels: Record<OrderStatus, [string, string]> = {
  pending: ['Waiting for the shop', 'దుకాణం అంగీకారం కోసం వేచి ఉంది'],
  preparing: ['Preparing', 'తయారు చేస్తున్నారు'], ready: ['Ready for pickup', 'తీసుకోవడానికి సిద్ధంగా ఉంది'],
  accepted: ['Preparing (legacy)', 'తయారు చేస్తున్నారు (పాత రికార్డు)'],
  collected: ['Collected · Paid', 'తీసుకున్నారు · చెల్లించారు'], declined: ['Declined by the shop', 'దుకాణం తిరస్కరించింది'],
  cancelled: ['Cancelled', 'రద్దు చేయబడింది'], completed: ['Legacy completed record · Pickup state unknown', 'పాత రికార్డు · తీసుకున్న స్థితి తెలియదు'],
};
export function pickupErrorText(code: string, t: (en: string, te: string) => string) {
  const errors: Record<string, [string, string]> = {
    email_invalid: ['Enter a valid email address.', 'సరైన ఇమెయిల్ చిరునామా నమోదు చేయండి.'],
    email_request_in_progress: ['Your email request is still being sent. Please wait.', 'ఇమెయిల్ అభ్యర్థన పంపుతున్నాం. వేచి ఉండండి.'],
    email_rate_limited: ['Please wait a minute before requesting another email link.', 'మరో ఇమెయిల్ లింక్ కోసం ఒక నిమిషం వేచి ఉండండి.'],
    email_delivery_unavailable: ['Email delivery is temporarily unavailable. You can keep browsing and use this device for saved food and orders.', 'ఇమెయిల్ పంపడం ప్రస్తుతం అందుబాటులో లేదు. ఈ పరికరంలో ఆహారాన్ని చూడవచ్చు, భద్రపరచవచ్చు.'],
    email_account_not_found: ['No existing account was found for this email. Choose “Create account or keep this account” to get started.', 'ఈ ఇమెయిల్‌కు పాత ఖాతా లేదు. కొత్త ఖాతా సృష్టించే ఎంపికను ఎంచుకోండి.'],
    email_already_linked: ['This email is linked to another account. Choose “Sign in to an existing account”.', 'ఈ ఇమెయిల్ మరో ఖాతాకు జోడించబడింది. పాత ఖాతాలో ప్రవేశించండి.'],
    email_signin_unavailable: ['Email sign-in is currently unavailable. Please try again later.', 'ఇమెయిల్ ప్రవేశం ప్రస్తుతం అందుబాటులో లేదు. తర్వాత ప్రయత్నించండి.'],
    invalid_checkout: ['Choose a whole quantity from 1 to 20 and a valid whole-rupee price.', '1 నుండి 20 వరకు పరిమాణం మరియు సరైన రూపాయల ధర ఎంచుకోండి.'],
    unavailable: ['The service is unavailable. Retry when your connection returns.', 'సేవ అందుబాటులో లేదు. కనెక్షన్ వచ్చినప్పుడు మళ్లీ ప్రయత్నించండి.'],
    not_found: ['This order is unavailable in your account. Refresh your orders.', 'ఈ ఆర్డర్ మీ ఖాతాలో అందుబాటులో లేదు. ఆర్డర్లను తాజాకరించండి.'],
    price_changed: ['The price changed. Review the new total and confirm again.', 'ధర మారింది. కొత్త మొత్తాన్ని చూసి మళ్లీ నిర్ధారించండి.'],
    item_unavailable: ['This item is unavailable. Refresh the menu and choose another item.', 'ఈ వంటకం అందుబాటులో లేదు. మెనూను తాజాకరించి మరో వంటకాన్ని ఎంచుకోండి.'],
    shop_offline: ['The shop is offline. Choose an open shop.', 'దుకాణం మూసివేయబడింది. తెరిచి ఉన్న దుకాణాన్ని ఎంచుకోండి.'],
    invalid_transition: ['The order changed. Refresh its status before trying again.', 'ఆర్డర్ స్థితి మారింది. మళ్లీ ప్రయత్నించే ముందు తాజా స్థితిని చూడండి.'],
    storage_unavailable: ['Enable browser storage before ordering so your order can be recovered.', 'ఆర్డర్‌ను తిరిగి పొందడానికి బ్రౌజర్ నిల్వను ప్రారంభించండి.'],
    session_unavailable: ['Guest access is unavailable. Please retry later.', 'అతిథి ప్రవేశం అందుబాటులో లేదు. తరువాత మళ్లీ ప్రయత్నించండి.'],
    resolve_attempt_first: ['Resolve your pending checkout before changing accounts.', 'ఖాతా మార్చే ముందు పెండింగ్ ఆర్డర్ ఫలితాన్ని తెలుసుకోండి.'],
    session_mismatch: ['Restore the original buyer session to resolve this checkout.', 'ఈ ఆర్డర్ ఫలితం తెలుసుకోవడానికి అసలు కొనుగోలుదారు ఖాతాను తిరిగి పొందండి.'],
    legacy_order: ['This historical order has no verified pickup state.', 'ఈ పాత ఆర్డర్ తీసుకున్న స్థితి నిర్ధారించబడలేదు.'],
    invalid_saved_attempt: ['Saved checkout data is unreadable. Check My orders before trying another purchase.', 'భద్రపరచిన ఆర్డర్ సమాచారం చదవలేకపోయాం. మరో కొనుగోలు ముందు నా ఆర్డర్లు చూడండి.'],
  };
  return t(...(errors[code] ?? ['Unable to confirm the outcome. Retry to recover the same checkout. Do not place another order yet.', 'ఫలితాన్ని నిర్ధారించలేకపోయాం. అదే ఆర్డర్‌ను తిరిగి పొందడానికి మళ్లీ ప్రయత్నించండి. ఇంకా మరో ఆర్డర్ పెట్టవద్దు.']));
}
