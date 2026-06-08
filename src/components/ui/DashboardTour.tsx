import { useState, useEffect, lazy, Suspense } from 'react';
import type { CallBackProps, Step } from 'react-joyride';

const TOUR_KEY = 'dashboard_tour_v1_done';

// Lazy-load Joyride so Rollup/PWA plugin never sees the import in static analysis.
// react-joyride ships ESM-only without a proper default export in its .mjs,
// which causes vite-plugin-pwa's build pass to fail on static analysis.
const JoyrideWrapper = lazy(() =>
  import('react-joyride').then((mod) => ({
    default: (mod as any).default ?? mod,
  }))
);

const STEPS: Step[] = [
  {
    target: '#dashboard-today-card',
    content: "👋 Welcome! This card shows today's total repair revenue — it updates in real time.",
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '#dashboard-week-card',
    content: "📅 This week's cumulative earnings are shown here, from Monday to today.",
    placement: 'bottom',
  },
  {
    target: '#revenue-chart',
    content: '📈 This chart tracks your daily revenue trend over the last 7 days.',
    placement: 'top',
  },
  {
    target: '#toggle-profits-btn',
    content: '🔒 Toggle profit visibility. Only admins and owners can see profit data.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="new-txn"]',
    content: "✅ You're all set! Click here to record your first repair transaction.",
    placement: 'left',
  },
];

const JOYRIDE_STYLES = {
  options: {
    primaryColor: 'hsl(221 83% 53%)',
    textColor: '#1e293b',
    backgroundColor: '#ffffff',
    arrowColor: '#ffffff',
    zIndex: 10000,
  },
  buttonNext: { borderRadius: '8px', fontWeight: 600 },
  buttonBack: { borderRadius: '8px' },
  buttonSkip: { borderRadius: '8px', color: '#64748b' },
  tooltip: { borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
};

/**
 * DashboardTour
 * Auto-runs a guided Joyride walkthrough the first time the Dashboard loads
 * in this browser. Uses localStorage so it only ever shows once.
 * Joyride is lazy-loaded to avoid Rollup/PWA plugin ESM interop issues.
 */
export function DashboardTour() {
  const [run, setRun] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Delay mount so all tour targets are in the DOM
  useEffect(() => {
    const alreadyDone = !!localStorage.getItem(TOUR_KEY);
    if (!alreadyDone) {
      const t = setTimeout(() => {
        setMounted(true);
        setRun(true);
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      localStorage.setItem(TOUR_KEY, 'true');
      setRun(false);
    }
  };

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <JoyrideWrapper
        steps={STEPS}
        run={run}
        continuous
        showSkipButton
        showProgress
        disableOverlayClose
        spotlightClicks
        styles={JOYRIDE_STYLES}
        callback={handleCallback}
      />
    </Suspense>
  );
}
