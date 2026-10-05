import { SvgScreenFrame } from './SvgScreenFrame';
﻿import { MapPin, Clock, Store } from 'lucide-react';
interface Props { onExplore?: () => void; onBusinessPortal?: () => void; }
export function SplashOnboardingScreen({ onExplore, onBusinessPortal }: Props) {
  return <SvgScreenFrame screen={'onboarding'}><section className="onboarding-screen screen-enter">
    <header><img src="/images/NewLogo.png" alt="YEMUNNAI mascot"/><h1>YEMUNNAI</h1><h2>Find food on campus.</h2><p>Check menus and availability before you go.</p></header>
    <div className="onboarding-features"><div><MapPin/><section><h3>Madanapalle Institute of Tech &amp; Science</h3><p>Angallu campus · Food Court</p></section></div><div><Store/><section><h3>4 food spots</h3><p>MITS Canteen, MITS Cafe,<br/>New Cafe and Pizza And Pasta (P2)</p></section></div><div><Clock/><section><h3>Opening hours</h3><p>Mon–Sat, 8 AM–9:30 PM<br/>Hot snacks from 4 PM</p></section></div></div>
    <footer><button type="button" onClick={onExplore}>Browse food</button><button type="button" onClick={onBusinessPortal}>Canteen owner? Open Business Portal</button></footer>
  </section></SvgScreenFrame>;
}
