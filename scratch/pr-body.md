## Summary

**Sales Transaction Feature**
**Goal:** Add a Sales Transaction page with item-level profit tracking to Expenso, alongside improvements to the Multi-Step Transaction Form that allow repair shop owners to also record product sales with real-time profit calculation.
**Status:** Verified ✓ (TypeScript 0 errors, Vercel production deployed)

This PR introduces a new **"New Sale"** flow that mirrors the existing repair transaction workflow but is tailored for direct product/item sales. Key additions include a `mode` prop on `MultiStepTransactionForm`, live profit calculation (`Sold Price − Our Cost`), bilingual navigation labels, and zero database migrations (repurposing existing schema columns).

---

## Changes

### Plan 01-01: Routing & Layout
Add SalesTransaction page, route, and sidebar navigation.

**Key files:**
- `src/pages/SalesTransaction.tsx` — NEW page rendering form in `mode="sales"`
- `src/App.tsx` — `/sales/new` lazy-loaded route inside ProtectedRoute
- `src/components/layout/Sidebar.tsx` — "New Sale" nav item (ShoppingBag icon, all roles)
- `src/components/layout/MobileBottomNav.tsx` — "New Sale" mobile nav entry
- `src/contexts/LanguageContext.tsx` — `sales` key: "New Sale" (EN) / "కొత్త అమ్మకం" (TE)

---

### Plan 01-02+03: Form Component Upgrades & API Data Flow
Extend `MultiStepTransactionForm` with sales mode and backend payload mapping.

**Key files:**
- `src/components/forms/MultiStepTransactionForm.tsx` — major update

**Changes:**
- `mode?: "repair" | "sales"` prop (defaults to `"repair"` — fully backward compatible)
- Zod schema extended: `itemName?`, `ourCost?`, `soldPrice?`
- `salesProfit` state tracks `soldPrice − ourCost` via `useEffect`, updates in real-time
- **Step 2** branches: Sales Details (Item Name, Our Cost, Sold Price, live Profit badge) vs Repair Information (unchanged)
- **Profit badge** — emerald green when profit ≥ 0, red when selling at a loss
- **Step 4 summary** shows sales breakdown (Item, Our Cost, Sold Price, Profit) or repair breakdown
- **Step breadcrumb** labels: "Sales Details" / ShoppingCart icon when in sales mode
- `onFormSubmit` maps: `deviceModel←itemName`, `repairType←"sale"`, `repairCost←soldPrice`, `internalCost←ourCost`, `profit←calculated`
- No DB migration — repurposes existing `internalCost` and `profit` schema columns

---

## Requirements Addressed

| Requirement | Status |
|-------------|--------|
| New Sales Transaction page using existing design system | ✅ |
| Sales option inside Multi-Step Transaction Form | ✅ |
| Item Name field | ✅ |
| Our Cost (purchase/internal cost) field | ✅ |
| Sold Price / Customer Cost field | ✅ |
| Auto-calculated Profit (Sold Price − Our Cost) | ✅ |
| Real-time profit calculation | ✅ |
| Numeric input validation | ✅ (Zod + `type="number"`) |
| Preserve existing repair multi-step flow | ✅ (untouched code paths) |
| Native look — same design system | ✅ |
| Bilingual (EN + Telugu) navigation label | ✅ |

---

## Verification

- [x] TypeScript: `npx tsc --noEmit` → **0 errors**
- [x] Vercel production deployment: **READY** (`expensoo-nxcc9k1q4-ritheshs-projects-2bddf162.vercel.app`)
- [x] Repair mode: untouched code paths — full regression safety
- [x] Sales mode: 4-step wizard functions independently from repair mode
- [x] Profit formula: `Profit = Sold Price − Our Cost` with real-time update
- [ ] Manual: Navigate Sidebar → New Sale → complete sales transaction form
- [ ] Manual: Verify profit badge updates in real time on Step 2
- [ ] Manual: Verify existing repair flow still works (regression)

---

## Key Decisions

- **Reuse `MultiStepTransactionForm`** with a `mode` prop instead of building a separate form — maximizes code reuse, guarantees identical UX feel
- **Repurpose existing DB columns** (`internalCost`, `profit`, `deviceModel`) — eliminates DB migration risk
- **`repairType = "sale"`** as a literal string — allows backend filtering of sales vs repairs in existing transaction lists
- **Backward-compatible default** — `mode` defaults to `"repair"`, existing callers unchanged

---

## Diff Stats

```
SALES-FEATURE-SUMMARY.md                          |  76 ++++++
src/App.tsx                                       |   5 +
src/components/forms/MultiStepTransactionForm.tsx | 316 ++++++++++------
src/components/layout/MobileBottomNav.tsx         |   7 +
src/components/layout/Sidebar.tsx                 |   7 +
src/contexts/LanguageContext.tsx                  |   2 +
src/pages/SalesTransaction.tsx                    |  35 +++
7 files changed, 362 insertions(+), 86 deletions(-)
```
