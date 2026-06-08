const fs = require('fs');
const results = [];

function check(label, condition) {
  results.push({ test: label, pass: !!condition });
}

// ── PHASE 1: Fuse.js ────────────────────────────────────────────────────────
const hook = fs.readFileSync('src/hooks/useFuzzySearch.ts', 'utf8');
check('P1-1: useFuzzySearch.ts exists', hook.includes('import Fuse'));
check('P1-2: useFuzzySearch uses threshold param', hook.includes('threshold = 0.35'));

const txn = fs.readFileSync('src/pages/Transactions.tsx', 'utf8');
check('P1-3: Transactions imports useFuzzySearch', txn.includes('useFuzzySearch'));
check('P1-4: Transactions imports Tippy', txn.includes('@tippyjs/react'));
check('P1-5: globalFilterFn includesString REMOVED', !txn.includes('globalFilterFn'));
check('P1-6: paymentFiltered step exists', txn.includes('paymentFiltered'));
check('P1-7: fuzzy keys include customer+mobile+deviceModel', txn.includes("'customer'") && txn.includes("'mobile'") && txn.includes("'deviceModel'"));

// ── PHASE 2: Tippy.js ────────────────────────────────────────────────────────
const badge = fs.readFileSync('src/components/ui/InitialsBadge.tsx', 'utf8');
check('P2-1: InitialsBadge imports Tippy', badge.includes('@tippyjs/react'));
check('P2-2: InitialsBadge imports tippy.css', badge.includes('tippy.js/dist/tippy.css'));
check('P2-3: InitialsBadge imports scale animation', badge.includes('animations/scale.css'));
check('P2-4: InitialsBadge wraps badge in Tippy', badge.includes('<Tippy'));
check('P2-5: InitialsBadge tooltip shows display_name', badge.includes('user.display_name'));

check('P2-6: StatusBadge has STATUS_DESCRIPTIONS map', txn.includes('STATUS_DESCRIPTIONS'));
check('P2-7: StatusBadge wrapped in Tippy', txn.includes('<Tippy'));
check('P2-8: STATUS_DESCRIPTIONS has completed/pending/cancelled keys', txn.includes("completed:") && txn.includes("pending:") && txn.includes("cancelled:"));

const dash = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
check('P2-9: Dashboard imports Tippy', dash.includes('@tippyjs/react'));
check('P2-10: Toggle Profits button wrapped in Tippy', dash.includes('<Tippy') && dash.includes('toggle-profits-btn'));

// ── PHASE 3: React Confetti ────────────────────────────────────────────────
const confetti = fs.readFileSync('src/components/ui/SuccessConfetti.tsx', 'utf8');
check('P3-1: SuccessConfetti.tsx exists + imports react-confetti', confetti.includes('react-confetti'));
check('P3-2: SuccessConfetti uses useWindowSize from react-use', confetti.includes('useWindowSize'));
check('P3-3: SuccessConfetti has trigger + onDone props', confetti.includes('trigger') && confetti.includes('onDone'));
check('P3-4: SuccessConfetti is fixed position zIndex 9999', confetti.includes('9999') && confetti.includes('fixed'));
check('P3-5: SuccessConfetti has stop-recycle + hide timers', confetti.includes('setRecycle(false)') && confetti.includes('setActive(false)'));

const form = fs.readFileSync('src/components/forms/MultiStepTransactionForm.tsx', 'utf8');
check('P3-6: Form imports SuccessConfetti', form.includes('SuccessConfetti'));
check('P3-7: Form has showConfetti useState', form.includes('showConfetti'));
check('P3-8: Form sets showConfetti true on success', form.includes('setShowConfetti(true)'));
check('P3-9: Form renders <SuccessConfetti trigger={showConfetti}>', form.includes('<SuccessConfetti'));
check('P3-10: Dashboard imports DashboardTour + SuccessConfetti', dash.includes('SuccessConfetti') && dash.includes('DashboardTour'));

// ── PHASE 4: React Dropzone ───────────────────────────────────────────────
const avDrop = fs.readFileSync('src/components/ui/AvatarDropzone.tsx', 'utf8');
check('P4-1: AvatarDropzone.tsx imports react-dropzone', avDrop.includes('react-dropzone'));
check('P4-2: AvatarDropzone accepts image/jpeg + image/png + image/webp', avDrop.includes('image/jpeg') && avDrop.includes('image/png') && avDrop.includes('image/webp'));
check('P4-3: AvatarDropzone has 5MB maxSize', avDrop.includes('5 * 1024 * 1024'));
check('P4-4: AvatarDropzone shows isDragActive state', avDrop.includes('isDragActive'));
check('P4-5: AvatarDropzone shows isDragReject state', avDrop.includes('isDragReject'));
check('P4-6: AvatarDropzone disabled while uploading', avDrop.includes('disabled: uploading'));

const rcDrop = fs.readFileSync('src/components/ui/ReceiptDropzone.tsx', 'utf8');
check('P4-7: ReceiptDropzone.tsx imports react-dropzone', rcDrop.includes('react-dropzone'));
check('P4-8: ReceiptDropzone accepts PDF', rcDrop.includes('application/pdf'));
check('P4-9: ReceiptDropzone has 10MB maxSize', rcDrop.includes('10 * 1024 * 1024'));
check('P4-10: ReceiptDropzone shows file list with remove button', rcDrop.includes('attachedFiles') && rcDrop.includes('onRemove'));

const profile = fs.readFileSync('src/pages/Profile.tsx', 'utf8');
check('P4-11: Profile imports AvatarDropzone', profile.includes('AvatarDropzone'));
check('P4-12: Profile renders <AvatarDropzone>', profile.includes('<AvatarDropzone'));
check('P4-13: Profile passes processFile + uploading to dropzone', profile.includes('onFile={processFile}') && profile.includes('uploading={uploading}'));

// ── PHASE 5: React Joyride ───────────────────────────────────────────────
const tour = fs.readFileSync('src/components/ui/DashboardTour.tsx', 'utf8');
check('P5-1: DashboardTour.tsx imports react-joyride', tour.includes('react-joyride'));
check('P5-2: DashboardTour lazy-loads Joyride', tour.includes('lazy('));
check('P5-3: DashboardTour wraps in Suspense', tour.includes('Suspense'));
check('P5-4: DashboardTour uses TOUR_KEY localStorage', tour.includes('TOUR_KEY') && tour.includes('localStorage'));
check('P5-5: DashboardTour has 5+ steps', (tour.match(/target:/g) || []).length >= 5);
check('P5-6: DashboardTour marks done on finished+skipped', tour.includes("'finished'") && tour.includes("'skipped'"));
check('P5-7: DashboardTour delayed mount (800ms)', tour.includes('800'));

check('P5-8: Dashboard imports DashboardTour', dash.includes("DashboardTour"));
check('P5-9: Dashboard renders <DashboardTour />', dash.includes('<DashboardTour'));
check('P5-10: Today card has id="dashboard-today-card"', dash.includes('id="dashboard-today-card"'));
check('P5-11: Week card has id="dashboard-week-card"', dash.includes('id="dashboard-week-card"'));
check('P5-12: Revenue chart Card has id="revenue-chart"', dash.includes('id="revenue-chart"'));
check('P5-13: New Transaction link has data-tour="new-txn"', dash.includes('data-tour="new-txn"'));
check('P5-14: Toggle Profits button has id="toggle-profits-btn"', dash.includes('id="toggle-profits-btn"'));

// ── VITE CONFIG ──────────────────────────────────────────────────────────────
const vite = fs.readFileSync('vite.config.ts', 'utf8');
check('CFG-1: vite.config has optimizeDeps.include react-joyride', vite.includes("'react-joyride'"));
check('CFG-2: vite.config has commonjsOptions.include', vite.includes('commonjsOptions'));
check('CFG-3: vite.config has rollup interop auto', vite.includes("interop: 'auto'"));

// ── PACKAGE VERSIONS ─────────────────────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
check('PKG-1: fuse.js installed', 'fuse.js' in deps);
check('PKG-2: @tippyjs/react installed', '@tippyjs/react' in deps);
check('PKG-3: tippy.js installed', 'tippy.js' in deps);
check('PKG-4: react-confetti installed', 'react-confetti' in deps);
check('PKG-5: react-dropzone installed', 'react-dropzone' in deps);
check('PKG-6: react-joyride installed', 'react-joyride' in deps);
check('PKG-7: react-use installed (for useWindowSize)', 'react-use' in deps);

// ── PRINT RESULTS ─────────────────────────────────────────────────────────────
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass);

console.log('\n' + '═'.repeat(60));
results.forEach(r => console.log((r.pass ? '✅' : '❌') + '  ' + r.test));
console.log('\n' + '═'.repeat(60));
console.log('RESULT: ' + passed + ' / ' + results.length + ' tests passed');
if (failed.length > 0) {
  console.log('\nFAILED TESTS:');
  failed.forEach(r => console.log('  ❌ ' + r.test));
}
console.log('═'.repeat(60) + '\n');
