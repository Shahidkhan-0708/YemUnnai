import { useEffect, useRef, useState } from 'react';
import { Bookmark, ChevronRight, ShoppingBag, UserRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { BuyerTab } from './BuyerTabBar';
import { buyerSupabase } from '../lib/supabase';
import { pendingCheckout, PickupError, requestBuyerEmail } from '../lib/pickup';
import { pickupErrorText, useLanguage } from '../lib/language';

export function BuyerProfileScreen({ onNavigate }: { onNavigate: (tab: BuyerTab) => void }) {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!buyerSupabase);
  const [email, setEmail] = useState('');
  const [existing, setExisting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    let active = true, revision = 0;
    const subscription = buyerSupabase?.auth.onAuthStateChange((_event, session) => {
      revision++; if (active) { setUser(session?.user ?? null); setLoading(false); }
    });
    const current = revision;
    void buyerSupabase?.auth.getSession().then(({ data }) => {
      if (active && current === revision) { setUser(data.session?.user ?? null); setLoading(false); }
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; subscription?.data.subscription.unsubscribe(); };
  }, []);
  const verified = !!user && !user.is_anonymous && !!user.email_confirmed_at;
  let unresolved = false;
  try { unresolved = !!pendingCheckout(); } catch { unresolved = true; }
  const submit = async () => {
    if (lock.current || !buyerSupabase || unresolved) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      await requestBuyerEmail(email.trim(), existing);
      if (mounted.current) setNotice(t('Check your email for the verification link.', 'నిర్ధారణ లింక్ కోసం మీ ఇమెయిల్ చూడండి.'));
    } catch (cause) {
      if (mounted.current) setError(cause instanceof PickupError ? pickupErrorText(cause.code, t) : t('Could not send the email link. Please try again.', 'ఇమెయిల్ లింక్ పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి.'));
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  return <section className="buyer-profile screen-enter" aria-labelledby="profile-title">
    <header className="buyer-profile-header"><p>YEMUNNAI</p><h1 id="profile-title">{t('Your profile', 'మీ ప్రొఫైల్')}</h1></header>
    <div className="buyer-profile-identity">
      <span className="buyer-profile-avatar"><UserRound size={30} strokeWidth={1.5} aria-hidden="true" /></span>
      <div><h2>{loading ? t('Loading profile…', 'ప్రొఫైల్ లోడ్ అవుతోంది…') : verified ? t('Your account', 'మీ ఖాతా') : t('Guest profile', 'అతిథి ప్రొఫైల్')}</h2><p>{verified ? user.email : t('Discover food at your own pace.', 'మీకు నచ్చిన ఆహారాన్ని కనుగొనండి.')}</p></div>
    </div>
    <div className="buyer-profile-links">
      {[{ tab: 'orders' as const, Icon: ShoppingBag, title: t('My orders', 'నా ఆర్డర్లు'), description: t('Pickup updates and order history', 'పికప్ వివరాలు మరియు ఆర్డర్ చరిత్ర') }, { tab: 'saved' as const, Icon: Bookmark, title: t('Saved food', 'భద్రపరచిన ఆహారం'), description: t('Your bookmarked dishes', 'మీరు భద్రపరచిన వంటకాలు') }].map(({ tab, Icon, title, description }) => <button key={tab} type="button" onClick={() => onNavigate(tab)}><span className="buyer-profile-link-icon"><Icon size={20} aria-hidden="true" /></span><span><strong>{title}</strong><small>{description}</small></span><ChevronRight size={18} aria-hidden="true" /></button>)}
    </div>
    <details className="buyer-profile-account">
      <summary>{t('Account & recovery', 'ఖాతా మరియు పునరుద్ధరణ')}<ChevronRight size={18} aria-hidden="true" /></summary>
      <p>{t('Link a verified email to keep this account across devices, or sign in to an existing account.', 'ఇతర పరికరాల్లో ఇదే ఖాతా కోసం ఇమెయిల్ నిర్ధారించండి, లేదా పాత ఖాతాలో ప్రవేశించండి.')}</p>
      {unresolved && <p role="status">{t('Check My orders to resolve your checkout before changing accounts.', 'ఖాతాను మార్చే ముందు నా ఆర్డర్లలో మీ చెక్అవుట్ పూర్తి చేయండి.')}</p>}
      <form onSubmit={event => { event.preventDefault(); void submit(); }}>
        <label htmlFor="profile-email">{t('Email', 'ఇమెయిల్')}</label><input id="profile-email" type="email" autoComplete="email" required value={email} disabled={busy} onChange={event => { setEmail(event.target.value); setNotice(''); setError(''); }} />
        <label htmlFor="profile-account-action">{t('Account action', 'ఖాతా చర్య')}</label><select id="profile-account-action" value={existing ? 'login' : 'link'} disabled={busy} onChange={event => { setExisting(event.target.value === 'login'); setNotice(''); setError(''); }}><option value="link">{verified ? t('Update account email', 'ఖాతా ఇమెయిల్ మార్చండి') : t('Link email to this guest account', 'ఈ అతిథి ఖాతాకు ఇమెయిల్ జోడించండి')}</option><option value="login">{t('Sign in to an existing account', 'పాత ఖాతాలో ప్రవేశించండి')}</option></select>
        <button type="submit" disabled={busy || unresolved || !buyerSupabase || loading}>{busy ? t('Sending…', 'పంపుతున్నాం…') : t('Send email link', 'ఇమెయిల్ లింక్ పంపండి')}</button>
      </form>
      {notice && <p role="status">{notice}</p>}{error && <p role="alert" className="pickup-error">{error}</p>}
    </details>
    <p className="buyer-profile-footer">A Food Discovery Platform</p>
  </section>;
}
