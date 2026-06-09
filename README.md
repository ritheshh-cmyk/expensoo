# Expensoo — Mobile Repair Shop Management System

Expensoo is a modern, high-performance web application designed for mobile repair shops to streamline customer transactions, repair tracking, supplier billing, expenditures, and visual business reporting.

## 🚀 Key Features
- **Dashboard Overview**: Dynamic period-based filtration (Today, Week, Month, Last 30 Days, Last 6 Months, Year, All Time) with animated stats cards and a revenue area chart.
- **Transaction Management**: Multi-step forms for logging repairs, sales, and internal transactions, complete with parts management and customer information.
- **Supplier Lifecycle Tracking**: Visual metrics, status tags (Settled, Pending, Overpaid), transaction and payment history accordions, and outstanding balance settlement flows.
- **E-Bill Generator**: PDF receipt generation, invoice date configuration, and history list tracking.
- **Analytics & Reports**: Visualized Recharts dashboard for repair distribution, revenue trends, top device brands, and customer retention metrics.
- **Security & RBAC**: Role-based access controls for Admin, Owner, and Worker (Technician) users, including active session auditing.

## 🛠️ Tech Stack
- **Frontend Core**: React 18, TypeScript, Vite, Tailwind CSS.
- **State & Routing**: React Router DOM, Custom Context Providers (Auth, Language).
- **Libraries & UI**: Radix UI (Select, Dialog, Tabs, Popover), Lucide React, Tippy.js, Recharts, Framer Motion, React Confetti.
- **Build & Package**: npm, Vite PWA Plugin.

## 📁 Directory Structure
```
expensoo/
├── e2e/                 # Playwright end-to-end integration tests
├── src/
│   ├── components/      # Reusable UI atoms, layouts, forms, and tour guides
│   ├── contexts/        # Auth and Internationalization contexts
│   ├── hooks/           # Custom React hooks (fuzzy search, toasts)
│   ├── lib/             # API client client-side state
│   └── pages/           # Page routes (Dashboard, Reports, Suppliers, etc.)
├── docs/                # Project canonical documentation
├── package.json
└── vite.config.ts
```
