const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateFormalLocationSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="375" height="812" viewBox="0 0 375 812" role="img" aria-labelledby="title desc">
<title id="title">Location Permission &amp; Campus Services</title>
<desc id="desc">Formal, executive campus location access modal with architectural cartography and zero border glare.</desc>
<defs>
  <!-- Clean, formal button gradient -->
  <linearGradient id="btnGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#FF7A1A"/>
    <stop offset="100%" stop-color="#E05D00"/>
  </linearGradient>

  <!-- High-end architectural drop shadows (NO WHITE LIGHT / NO HALO) -->
  <filter id="cardShadow" x="-20%" y="-15%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#090D16" flood-opacity="0.32"/>
    <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#090D16" flood-opacity="0.12"/>
  </filter>

  <filter id="btnShadow" x="-10%" y="-20%" width="120%" height="150%" color-interpolation-filters="sRGB">
    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#EA580C" flood-opacity="0.28"/>
  </filter>

  <filter id="badgeShadow" x="-20%" y="-30%" width="140%" height="180%" color-interpolation-filters="sRGB">
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.10"/>
  </filter>

  <!-- Clip path for the architectural campus map -->
  <clipPath id="mapClip">
    <rect width="299" height="180" rx="16"/>
  </clipPath>
</defs>

<style>
  text {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
</style>

<!-- Background Canvas with Feed Silhouette -->
<rect width="375" height="812" fill="#F1F5F9"/>

<!-- Feed Header Mock -->
<g opacity="0.45" transform="translate(16, 20)">
  <rect width="343" height="52" rx="14" fill="#FFFFFF" stroke="#E2E8F0"/>
  <circle cx="26" cy="26" r="14" fill="#FF7A1A"/>
  <rect x="50" y="21" width="70" height="10" rx="4" fill="#334155"/>
  <rect x="250" y="18" width="78" height="16" rx="8" fill="#FDBA74"/>
</g>

<!-- Feed Food Cards Mock -->
<g opacity="0.35" transform="translate(16, 88)">
  <rect width="343" height="120" rx="18" fill="#FFFFFF" stroke="#E2E8F0"/>
  <rect x="14" y="14" width="92" height="92" rx="12" fill="#E2E8F0"/>
  <rect x="120" y="24" width="130" height="12" rx="4" fill="#64748B"/>
  <rect x="120" y="46" width="80" height="10" rx="4" fill="#94A3B8"/>
  <rect x="120" y="74" width="60" height="14" rx="4" fill="#F97316"/>
</g>

<g opacity="0.25" transform="translate(16, 224)">
  <rect width="343" height="120" rx="18" fill="#FFFFFF" stroke="#E2E8F0"/>
  <rect x="14" y="14" width="92" height="92" rx="12" fill="#E2E8F0"/>
</g>

<!-- Refined Dark Translucent Scrim (No border glare) -->
<rect width="375" height="812" fill="#0B0F19" opacity="0.62"/>

<!-- Floating Modal Dialog (Pure crisp white, subtle hairline border, no glow) -->
<g transform="translate(18, 114)">
  <!-- Modal Base -->
  <rect width="339" height="588" rx="26" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" filter="url(#cardShadow)"/>
  
  <!-- Drag Handle Indicator -->
  <rect x="147" y="12" width="45" height="4" rx="2" fill="#CBD5E1"/>

  <!-- ==================== PREMIUM ARCHITECTURAL CAMPUS MAP ==================== -->
  <g transform="translate(20, 26)">
    <!-- Map Base Card -->
    <rect width="299" height="180" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
    
    <g clip-path="url(#mapClip)">
      <!-- Soft Architectural Ground Grid -->
      <g stroke="#F1F5F9" stroke-width="1" opacity="0.8">
        <line x1="0" y1="30" x2="299" y2="30"/>
        <line x1="0" y1="60" x2="299" y2="60"/>
        <line x1="0" y1="90" x2="299" y2="90"/>
        <line x1="0" y1="120" x2="299" y2="120"/>
        <line x1="0" y1="150" x2="299" y2="150"/>
        <line x1="40" y1="0" x2="40" y2="180"/>
        <line x1="80" y1="0" x2="80" y2="180"/>
        <line x1="120" y1="0" x2="120" y2="180"/>
        <line x1="160" y1="0" x2="160" y2="180"/>
        <line x1="200" y1="0" x2="200" y2="180"/>
        <line x1="240" y1="0" x2="240" y2="180"/>
        <line x1="280" y1="0" x2="280" y2="180"/>
      </g>

      <!-- Campus Landscaped Greenery Zones -->
      <path d="M -10 135 C 30 120, 70 145, 115 135 L 115 190 L -10 190 Z" fill="#EBF5EE" opacity="0.85"/>
      <path d="M 175 -10 C 220 15, 255 5, 310 20 L 310 -10 Z" fill="#EBF5EE" opacity="0.85"/>

      <!-- Primary Campus Avenues &amp; Walkways (Clean white roads with subtle outline) -->
      <!-- Outer road outline -->
      <path d="M -10 92 C 70 92, 120 86, 160 68 C 200 48, 230 44, 310 44" fill="none" stroke="#E2E8F0" stroke-width="19" stroke-linecap="round"/>
      <!-- Inner crisp white road -->
      <path d="M -10 92 C 70 92, 120 86, 160 68 C 200 48, 230 44, 310 44" fill="none" stroke="#FFFFFF" stroke-width="15" stroke-linecap="round"/>

      <!-- Secondary Connecting Street -->
      <path d="M 160 68 L 160 190" fill="none" stroke="#E2E8F0" stroke-width="14" stroke-linecap="round"/>
      <path d="M 160 68 L 160 190" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>

      <!-- Architectural Campus Buildings -->
      <!-- Academic Block -->
      <rect x="16" y="16" width="76" height="50" rx="8" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.2"/>
      <rect x="22" y="24" width="16" height="12" rx="2" fill="#E2E8F0"/>
      <rect x="42" y="24" width="16" height="12" rx="2" fill="#E2E8F0"/>
      <text x="54" y="55" font-size="8.5" font-weight="700" fill="#475569" text-anchor="middle">Academic Block</text>

      <!-- Central Library -->
      <rect x="16" y="116" width="80" height="46" rx="8" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="56" y="143" font-size="8.5" font-weight="700" fill="#475569" text-anchor="middle">Central Library</text>

      <!-- MITS Cafe Secondary Venue -->
      <rect x="195" y="118" width="86" height="42" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>
      <circle cx="207" cy="139" r="3" fill="#64748B"/>
      <text x="215" y="142" font-size="8.5" font-weight="700" fill="#334155">MITS Cafe</text>

      <!-- Main Food Court &amp; Canteen (Prominent Destination) -->
      <rect x="198" y="18" width="90" height="52" rx="8" fill="#FFF7ED" stroke="#FDBA74" stroke-width="1.4"/>
      <text x="243" y="42" font-size="9" font-weight="800" fill="#C2410C" text-anchor="middle">MITS Canteen</text>
      <text x="243" y="55" font-size="7.5" font-weight="600" fill="#EA580C" text-anchor="middle">Main Food Court</text>

      <!-- Active Walk Route: Dotted Navigation Track from User to Food Court -->
      <path d="M 124 104 C 142 90, 168 72, 198 44" fill="none" stroke="#F06A05" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 4"/>

      <!-- User Location Marker (Pulse ring + Crisp core dot) -->
      <g transform="translate(124, 104)">
        <circle cx="0" cy="0" r="16" fill="#F06A05" fill-opacity="0.16"/>
        <circle cx="0" cy="0" r="8" fill="#FFFFFF" filter="url(#badgeShadow)"/>
        <circle cx="0" cy="0" r="4.5" fill="#F06A05"/>
        
        <!-- Subtle "YOU" marker pill -->
        <rect x="-16" y="12" width="32" height="14" rx="7" fill="#0F172A"/>
        <text x="0" y="22" font-size="7" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">YOU</text>
      </g>

      <!-- Destination ETA Floating Badge -->
      <g transform="translate(182, 6)">
        <rect width="106" height="22" rx="11" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" filter="url(#badgeShadow)"/>
        <circle cx="12" cy="11" r="3" fill="#16A34A"/>
        <text x="20" y="14.5" font-size="8.5" font-weight="700" fill="#0F172A">2 min walk • 160m</text>
      </g>

      <!-- Geofence Status Pill (Top Left) -->
      <g transform="translate(8, 8)">
        <rect width="112" height="18" rx="9" fill="#FFFFFF" fill-opacity="0.94" stroke="#E2E8F0" stroke-width="1"/>
        <circle cx="14" cy="9" r="2.5" fill="#16A34A"/>
        <text x="21" y="12" font-size="7.5" font-weight="700" fill="#475569" letter-spacing="0.4">CAMPUS GEOFENCE</text>
      </g>
    </g>
  </g>

  <!-- ==================== FORMAL COPY &amp; HEADINGS ==================== -->
  <g transform="translate(169.5, 236)">
    <!-- Title -->
    <text x="0" y="0" font-size="19" font-weight="800" fill="#0F172A" text-anchor="middle" letter-spacing="-0.3">Enable Location Access</text>
    
    <!-- Subtitle (Formal &amp; Concise) -->
    <text x="0" y="21" font-size="11.5" font-weight="500" fill="#64748B" text-anchor="middle">Calculate real-time walking distance to campus cafeterias</text>
    <text x="0" y="37" font-size="11.5" font-weight="500" fill="#64748B" text-anchor="middle">and receive notifications when your order is ready.</text>
  </g>

  <!-- ==================== FORMAL FEATURE ROWS ==================== -->
  <!-- Feature 1: Walking Distance & ETAs -->
  <g transform="translate(22, 298)">
    <rect width="295" height="54" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
    
    <!-- Icon Container -->
    <g transform="translate(10, 10)">
      <rect width="34" height="34" rx="10" fill="#FFF7ED" stroke="#FFEDD5" stroke-width="1"/>
      <!-- Formal Navigation Compass Icon -->
      <path d="M17 9 L23 23 L17 19 L11 23 Z" fill="#F06A05"/>
    </g>
    
    <!-- Text Labels -->
    <text x="54" y="23" font-size="11.5" font-weight="700" fill="#0F172A">Live Distance &amp; Walk Time</text>
    <text x="54" y="39" font-size="9.5" font-weight="500" fill="#64748B">Main Canteen: 2 min • Cafe: 4 min</text>
    
    <!-- Formal Status Pill -->
    <g transform="translate(232, 16)">
      <rect width="53" height="22" rx="11" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1"/>
      <text x="26.5" y="14.5" font-size="9" font-weight="700" fill="#334155" text-anchor="middle">2m walk</text>
    </g>
  </g>

  <!-- Feature 2: Order Ready Notifications -->
  <g transform="translate(22, 362)">
    <rect width="295" height="54" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
    
    <!-- Icon Container -->
    <g transform="translate(10, 10)">
      <rect width="34" height="34" rx="10" fill="#ECFDF5" stroke="#D1FAE5" stroke-width="1"/>
      <!-- Formal Bell Notification Icon -->
      <path d="M17 10 C14.8 10 13 11.8 13 14 C13 17 11 18.5 11 19 L23 19 C23 18.5 21 17 21 14 C21 11.8 19.2 10 17 10 Z" fill="none" stroke="#059669" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M15.5 21 C15.5 21.8 16.2 22.5 17 22.5 C17.8 22.5 18.5 21.8 18.5 21" fill="none" stroke="#059669" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    
    <!-- Text Labels -->
    <text x="54" y="23" font-size="11.5" font-weight="700" fill="#0F172A">Order Status Notifications</text>
    <text x="54" y="39" font-size="9.5" font-weight="500" fill="#64748B">Instant alerts when order is ready</text>
    
    <!-- Formal Status Pill -->
    <g transform="translate(232, 16)">
      <rect width="53" height="22" rx="11" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1"/>
      <text x="26.5" y="14.5" font-size="9" font-weight="700" fill="#059669" text-anchor="middle">Ready</text>
    </g>
  </g>

  <!-- ==================== FORMAL PRIVACY STATEMENT ==================== -->
  <g transform="translate(169.5, 438)">
    <!-- Small Security Shield -->
    <path d="M -118 -3.5 L -114 -5 L -110 -3.5 C -110 -1 -110 2 -114 4 C -118 2 -118 -1 -118 -3.5 Z" fill="#16A34A"/>
    <text x="-103" y="0" font-size="9.5" font-weight="500" fill="#64748B" text-anchor="start">Restricted strictly to campus bounds. Active only while in use.</text>
  </g>

  <!-- ==================== CALL TO ACTION BUTTONS ==================== -->
  <!-- Primary Button: Allow While Using App -->
  <g transform="translate(22, 460)">
    <rect width="295" height="46" rx="13" fill="url(#btnGradient)" filter="url(#btnShadow)"/>
    <text x="147.5" y="28" font-size="13.5" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.2">Allow While Using App</text>
  </g>

  <!-- Secondary Button: Set Campus Manually -->
  <g transform="translate(22, 516)">
    <rect width="295" height="42" rx="13" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
    <text x="147.5" y="26" font-size="12" font-weight="600" fill="#334155" text-anchor="middle">Set Campus Manually</text>
  </g>
</g>
</svg>
`;
}

const root = path.resolve(__dirname, '..');
const svgContent = generateFormalLocationSvg();

// Write to public, figma_svgs, and page_svgs
const targetPaths = [
  path.join(root, 'public', 'svgs', '09_location_permission.svg'),
  path.join(root, 'figma_svgs', '09_location_permission.svg'),
  path.join(root, 'page_svgs', '09_location_permission.svg')
];

targetPaths.forEach(p => {
  fs.writeFileSync(p, svgContent, 'utf-8');
  console.log(`Updated: ${p}`);
});

// Render preview PNG with Edge
const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const edge = edgePaths.find(p => fs.existsSync(p));

if (edge) {
  const svgUrl = `file:///${targetPaths[0].replace(/\\/g, '/')}`;
  const outPng = path.join(root, 'figma_svgs', 'previews', '09_location_permission.png');
  const pubPng = path.join(root, 'public', 'svgs', 'previews', '09_location_permission.png');
  const brainDir = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\f403307d-079f-4382-8c50-4fb0fa4f9ad9';
  const brainPng = path.join(brainDir, 'preview_09_location_formal.png');

  const cmd = `"${edge}" --headless --disable-gpu --screenshot="${outPng}" --window-size=375,812 --hide-scrollbars "${svgUrl}"`;
  execSync(cmd, { stdio: 'inherit' });
  
  if (fs.existsSync(outPng)) {
    fs.copyFileSync(outPng, pubPng);
    fs.copyFileSync(outPng, brainPng);
    console.log(`Screenshot saved to: ${brainPng}`);
  }
}
