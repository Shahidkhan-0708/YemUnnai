// lab/page.tsx - Main Design Lab page
// Displays all variants from all 4 screens (A-E) in a responsive grid
// Each variant container has data-variant="X" for feedback identification
// Includes interactive FeedbackOverlay for structured review

import { LabShell } from './components/LabShell';
import { FeedbackOverlay } from './components/FeedbackOverlay';

// All 16 component variants (4 screens × 5 variants)
import HomeDiscoveryVariantA from './variants/HomeDiscoveryVariantA';
import HomeDiscoveryVariantB from './variants/HomeDiscoveryVariantB';
import HomeDiscoveryVariantC from './variants/HomeDiscoveryVariantC';
import HomeDiscoveryVariantD from './variants/HomeDiscoveryVariantD';
import HomeDiscoveryVariantE from './variants/HomeDiscoveryVariantE';

import FoodItemDetailVariantA from './variants/FoodItemDetailVariantA';
import FoodItemDetailVariantB from './variants/FoodItemDetailVariantB';
import FoodItemDetailVariantC from './variants/FoodItemDetailVariantC';
import FoodItemDetailVariantD from './variants/FoodItemDetailVariantD';
import FoodItemDetailVariantE from './variants/FoodItemDetailVariantE';

import QuickOrderModalVariantA from './variants/QuickOrderModalVariantA';
import QuickOrderModalVariantB from './variants/QuickOrderModalVariantB';
import QuickOrderModalVariantC from './variants/QuickOrderModalVariantC';
import QuickOrderModalVariantD from './variants/QuickOrderModalVariantD';
import QuickOrderModalVariantE from './variants/QuickOrderModalVariantE';

import SplashOnboardingVariantA from './variants/SplashOnboardingVariantA';
import SplashOnboardingVariantB from './variants/SplashOnboardingVariantB';
import SplashOnboardingVariantC from './variants/SplashOnboardingVariantC';
import SplashOnboardingVariantD from './variants/SplashOnboardingVariantD';
import SplashOnboardingVariantE from './variants/SplashOnboardingVariantE';

interface VariantCardProps {
  variant: string;
  component: React.ReactNode;
  rationale?: string;
}

function VariantCard({ variant, component, rationale }: VariantCardProps) {
  return (
    <div className={`data-variant-${variant}`} style={{ background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', border: '1px solid #F0E8E0', boxShadow: '0 2px 8px rgba(31,20,10,0.06)' }}>
      {rationale && (
        <div style={{ padding: '8px 12px', background: '#FFF8F2', fontSize: '10px', color: '#7A6658', borderBottom: '1px solid #F0E8E0' }}>
          {rationale}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '480px' }}>
        <div style={{ flex: '1', overflow: 'hidden', maxHeight: '480px' }}>{component}</div>
      </div>
    </div>
  );
}

export default function LabPage() {
  return (
    <LabShell
      title="Premium Redesign Design Lab"
      subtitle="Yemunnai food delivery app — 4 screens × 5 variants each"
      instructions="Review all 20 design variants across four screens. Click 'Add Feedback' on any element to leave structured comments. Each variant card uses shared fixture data for fair comparison. After reviewing, tell us which variant wins (A-E) and what changes we should make."
      briefSummary={[
        { label: 'Scope', value: '4 screens', },
        { label: 'Variants', value: '20 total (5 per screen)', },
        { label: 'Inspiration', value: 'Swiggy · Zomato · Toing', },
        { label: 'Palette', value: '#F06A05 orange', },
        { label: 'Typography', value: 'Plus Jakarta Sans', },
        { label: 'Format', value: 'React + Framer Motion', },
      ]}
    >
      {/* ========== SCREEN A: Home Discovery ========== */}
      <section className="mb-8 mt-2">
        <h2 className="text-lg font-bold text-[#1F140A] mb-4 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F06A05]" />
          Screen A — Home Discovery
        </h2>
        <p className="text-xs text-[#7A6658] mb-3">Category pills, tactile deals, vendor cards, nearby food deck</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VariantCard variant="A" component={<HomeDiscoveryVariantA />} rationale="Hierarchy — compact grid, clear visual order" />
          <VariantCard variant="B" component={<HomeDiscoveryVariantB />} rationale="List layout — expandable vendor sections, category scroll tabs" />
          <VariantCard variant="C" component={<HomeDiscoveryVariantC />} rationale="Compact density — more items visible, tighter spacing" />
          <VariantCard variant="D" component={<HomeDiscoveryVariantD />} rationale="Drawer pattern — progressive disclosure, bottom sheets" />
          <VariantCard variant="E" component={<HomeDiscoveryVariantE />} rationale="Expressive — ambient blobs, parallax hero, shimmer effects" />
        </div>
      </section>

      {/* ========== SCREEN B: Food Item Detail ========== */}
      <section className="mb-8 mt-2">
        <h2 className="text-lg font-bold text-[#1F140A] mb-4 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F06A05]" />
          Screen B — Food Item Detail
        </h2>
        <p className="text-xs text-[#7A6658] mb-3">Hero image, sticky actions, portion selector, nutrition info</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VariantCard variant="A" component={<FoodItemDetailVariantA />} rationale="Split sections — hero image, organized left column, right details" />
          <VariantCard variant="B" component={<FoodItemDetailVariantB />} rationale="Split-pane — sticky image sidebar, horizontal tabbed content" />
          <VariantCard variant="C" component={<FoodItemDetailVariantC />} rationale="Compact density — efficient real estate, inline controls" />
          <VariantCard variant="D" component={<FoodItemDetailVariantD />} rationale="Drawer — progressive disclosure, expandable description/portion/nutrition" />
          <VariantCard variant="E" component={<FoodItemDetailVariantE />} rationale="Expressive — parallax hero, floating particles, micro-interactions" />
        </div>
      </section>

      {/* ========== SCREEN C: Quick Order Modal ========== */}
      <section className="mb-8 mt-2">
        <h2 className="text-lg font-bold text-[#1F140A] mb-4 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F06A05]" />
          Screen C — Quick Order Modal
        </h2>
        <p className="text-xs text-[#7A6658] mb-3">Bottom sheet, item card, quantity selector, price breakdown</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VariantCard variant="A" component={<QuickOrderModalVariantA onClose={() => {}} onConfirm={() => {}} />} rationale="Bottom sheet — handle, item card, quantity inline, sticky confirm" />
          <VariantCard variant="B" component={<QuickOrderModalVariantB onClose={() => {}} onConfirm={() => {}} />} rationale="Section tabs — Item/Options/Summary, sticky tabs, stepper progression" />
          <VariantCard variant="C" component={<QuickOrderModalVariantC onClose={() => {}} onConfirm={() => {}} />} rationale="Compact density — inline controls, minimal scrolling" />
          <VariantCard variant="D" component={<QuickOrderModalVariantD onClose={() => {}} onConfirm={() => {}} />} rationale="Stepper flow — 3-step guided: Item → Options → Confirm" />
          <VariantCard variant="E" component={<QuickOrderModalVariantE onClose={() => {}} onConfirm={() => {}} />} rationale="Expressive — confetti on confirm, success pulse, shimmer effects" />
        </div>
      </section>

      {/* ========== SCREEN D: Splash Onboarding ========== */}
      <section className="mt-2">
        <h2 className="text-lg font-bold text-[#1F140A] mb-4 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F06A05]" />
          Screen D — Splash Onboarding
        </h2>
        <p className="text-xs text-[#7A6658] mb-3">Value prop intro, onboarding steps, discover nearby, quick order</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VariantCard variant="A" component={<SplashOnboardingVariantA />} rationale="Hierarchy — hero value prop, 4 step cards, clear one primary action" />
          <VariantCard variant="B" component={<SplashOnboardingVariantB />} rationale="Layout model — list cards, horizontal category tabs below hero, expandable vendor sections" />
          <VariantCard variant="C" component={<SplashOnboardingVariantC />} rationale="Compact density — more info visible, tighter spacing, stat-heavy" />
          <VariantCard variant="D" component={<SplashOnboardingVariantD />} rationale="Interaction — bottom sheet drawer with progressive disclosure, swipe gestures" />
          <VariantCard variant="E" component={<SplashOnboardingVariantE />} rationale="Expressive — parallax hero, floating particles, drop-shadows, confetti explosion" />
        </div>
      </section>

      {/* ========== Feedback Overlay (CRITICAL) ========== */}
      <section className="mt-6 p-4 bg-[#FFF8F2] border border-[#F0E8E0] rounded-xl">
        <h3 className="text-sm font-bold text-[#1F140A] mb-2">📝 Interactive Feedback</h3>
        <p className="text-xs text-[#7A6658] mb-4">
          Click <strong>Add Feedback</strong> button (bottom-right), then click any element you want to comment on. Type your feedback and hit Save. Fill in Overall Direction and click Copy Feedback. Paste the result here in the terminal.
        </p>
        <FeedbackOverlay targetName="Premium Redesign: 4 screens × 5 variants" />
      </section>
    </LabShell>
  );
}
