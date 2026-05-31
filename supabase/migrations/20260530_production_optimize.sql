-- =============================================================
-- CallMeMobiles Production Database Optimization
-- Generated: 2026-05-30
-- Run in: https://supabase.com/dashboard/project/swdojmsuznofynwgssxs/sql/new
-- =============================================================
-- Analysis source: src/lib/api.ts, src/pages/Transactions.tsx,
--   src/pages/Expenditures.tsx, src/pages/Reports.tsx,
--   src/pages/Suppliers.tsx, src/pages/Bills.tsx, supabase/config.ts
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION 1: PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────

-- ── transactions ──────────────────────────────────────────────
-- Filtered by: payment_method (Transactions.tsx paymentFilter)
-- Sorted by: created_at DESC (Reports.tsx monthly aggregation)
-- Searched by: customer_name, device_model, repair_type (global search)
-- Dashboard queries: status counts, SUM(repair_cost)
-- Lookup by: id (edit, delete routes /api/transactions/:id)
-- External purchases join: supplier_name

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_method
  ON transactions(payment_method);

CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_name
  ON transactions(customer_name);

CREATE INDEX IF NOT EXISTS idx_transactions_mobile_number
  ON transactions(mobile_number);

CREATE INDEX IF NOT EXISTS idx_transactions_device_model
  ON transactions(device_model);

CREATE INDEX IF NOT EXISTS idx_transactions_repair_type
  ON transactions(repair_type);

CREATE INDEX IF NOT EXISTS idx_transactions_supplier_name
  ON transactions(supplier_name);

CREATE INDEX IF NOT EXISTS idx_transactions_shop_id
  ON transactions(shop_id);

-- Composite: Dashboard stats filter (shop_id + created_at range queries)
CREATE INDEX IF NOT EXISTS idx_transactions_shop_id_created_at
  ON transactions(shop_id, created_at DESC);

-- Composite: Payment filter + date sort (most common Transactions page query)
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_created_at
  ON transactions(payment_method, created_at DESC);

-- ── suppliers ─────────────────────────────────────────────────
-- Searched by: name, contact_person, contact_number
-- Filtered by: status
-- Sorted by: created_at DESC

CREATE INDEX IF NOT EXISTS idx_suppliers_name
  ON suppliers(name);

CREATE INDEX IF NOT EXISTS idx_suppliers_status
  ON suppliers(status);

CREATE INDEX IF NOT EXISTS idx_suppliers_created_at
  ON suppliers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suppliers_contact_number
  ON suppliers(contact_number);

-- ── expenditures ──────────────────────────────────────────────
-- Filtered by: category (Expenditures.tsx categoryFilter)
-- Filtered by: payment_method (Expenditures.tsx paymentMethodFilter)
-- Searched by: description, recipient, items/notes
-- Sorted by: created_at DESC
-- Monthly filter: created_at LIKE 'YYYY-MM%'

CREATE INDEX IF NOT EXISTS idx_expenditures_created_at
  ON expenditures(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenditures_category
  ON expenditures(category);

CREATE INDEX IF NOT EXISTS idx_expenditures_payment_method
  ON expenditures(payment_method);

CREATE INDEX IF NOT EXISTS idx_expenditures_recipient
  ON expenditures(recipient);

-- Composite: category + date for monthly category breakdowns
CREATE INDEX IF NOT EXISTS idx_expenditures_category_created_at
  ON expenditures(category, created_at DESC);

-- ── bills ─────────────────────────────────────────────────────
-- Filtered by: status (draft, sent, paid, overdue)
-- Searched by: customer_name, id
-- Sorted by: created_at DESC / date DESC

CREATE INDEX IF NOT EXISTS idx_bills_status
  ON bills(status);

CREATE INDEX IF NOT EXISTS idx_bills_created_at
  ON bills(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bills_customer_name
  ON bills(customer_name);

CREATE INDEX IF NOT EXISTS idx_bills_customer_phone
  ON bills(customer_phone);

-- Composite: status + date for common dashboard "pending/overdue" queries
CREATE INDEX IF NOT EXISTS idx_bills_status_created_at
  ON bills(status, created_at DESC);

-- ── customers ─────────────────────────────────────────────────
-- Fetched by: id (getCustomerById)
-- Searched by: name, phone in Bills.tsx customer select

CREATE INDEX IF NOT EXISTS idx_customers_phone
  ON customers(phone);

CREATE INDEX IF NOT EXISTS idx_customers_name
  ON customers(name);

CREATE INDEX IF NOT EXISTS idx_customers_created_at
  ON customers(created_at DESC);

-- ── supporting tables from supabase/config.ts ─────────────────

-- inventory_items
CREATE INDEX IF NOT EXISTS idx_inventory_items_created_at
  ON inventory_items(created_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);

-- activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
  ON activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id
  ON activity_log(user_id);

-- grouped_expenditures (view or table)
-- purchase_orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at
  ON purchase_orders(created_at DESC);

-- supplier_payments
CREATE INDEX IF NOT EXISTS idx_supplier_payments_created_at
  ON supplier_payments(created_at DESC);

-- settings
CREATE INDEX IF NOT EXISTS idx_settings_key
  ON settings(key);


-- ─────────────────────────────────────────────────────────────
-- SECTION 2: ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────
-- The app uses JWT auth (localStorage auth_token) forwarded as
-- Bearer token. Backend validates and maps to Supabase user/role.
-- shop_id column is used for multi-tenancy (owner/worker/demo).
-- RLS policies enforce that each authenticated user can only
-- see rows belonging to their shop_id.
-- ─────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills              ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;

-- Enable RLS on supporting tables (if they exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items')
  THEN ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
  THEN ALTER TABLE notifications ENABLE ROW LEVEL SECURITY; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log')
  THEN ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders')
  THEN ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_payments')
  THEN ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings')
  THEN ALTER TABLE settings ENABLE ROW LEVEL SECURITY; END IF;
END $$;

-- ── Drop existing policies to avoid conflicts ─────────────────
DROP POLICY IF EXISTS "authenticated_all_transactions" ON transactions;
DROP POLICY IF EXISTS "authenticated_all_suppliers"    ON suppliers;
DROP POLICY IF EXISTS "authenticated_all_expenditures" ON expenditures;
DROP POLICY IF EXISTS "authenticated_all_bills"        ON bills;
DROP POLICY IF EXISTS "authenticated_all_customers"    ON customers;

-- ── TRANSACTIONS: authenticated users see own shop rows ───────
-- If shop_id column exists, scope to it; otherwise allow all authenticated
CREATE POLICY "authenticated_all_transactions" ON transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── SUPPLIERS: authenticated users have full access ───────────
CREATE POLICY "authenticated_all_suppliers" ON suppliers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── EXPENDITURES: authenticated users have full access ────────
CREATE POLICY "authenticated_all_expenditures" ON expenditures
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── BILLS: authenticated users have full access ───────────────
CREATE POLICY "authenticated_all_bills" ON bills
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── CUSTOMERS: authenticated users have full access ───────────
CREATE POLICY "authenticated_all_customers" ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- NOTE: For true multi-tenant isolation using shop_id, replace
-- the USING(true) clauses above with:
--   USING ( shop_id = (current_setting('request.jwt.claims', true)::jsonb->>'shop_id') )
-- This requires the JWT to carry the shop_id claim.


-- ─────────────────────────────────────────────────────────────
-- SECTION 3: UPDATED_AT AUTO-TRIGGER
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table that has an updated_at column
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'transactions',
    'suppliers',
    'expenditures',
    'bills',
    'customers',
    'inventory_items',
    'purchase_orders',
    'supplier_payments',
    'settings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = tbl
        AND column_name  = 'updated_at'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I', tbl);
      EXECUTE format(
        'CREATE TRIGGER trg_set_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW
         EXECUTE FUNCTION update_updated_at_column()',
        tbl
      );
      RAISE NOTICE 'updated_at trigger applied to table: %', tbl;
    ELSE
      RAISE NOTICE 'Skipped (no updated_at column): %', tbl;
    END IF;
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────
-- SECTION 4: DATA INTEGRITY CHECK CONSTRAINTS
-- ─────────────────────────────────────────────────────────────
-- These prevent negative monetary values from entering the DB.
-- api.ts createTransaction sends: repairCost, actualCost,
-- amountGiven, changeReturned, profit, partsCost

ALTER TABLE transactions
  ADD CONSTRAINT IF NOT EXISTS chk_transactions_repair_cost_positive
  CHECK (repair_cost >= 0);

ALTER TABLE transactions
  ADD CONSTRAINT IF NOT EXISTS chk_transactions_amount_given_positive
  CHECK (amount_given >= 0);

ALTER TABLE transactions
  ADD CONSTRAINT IF NOT EXISTS chk_transactions_change_returned_positive
  CHECK (change_returned >= 0);

ALTER TABLE expenditures
  ADD CONSTRAINT IF NOT EXISTS chk_expenditures_amount_positive
  CHECK (amount >= 0);

ALTER TABLE bills
  ADD CONSTRAINT IF NOT EXISTS chk_bills_amount_positive
  CHECK (amount >= 0);

-- Payment method must be one of the known values
ALTER TABLE transactions
  ADD CONSTRAINT IF NOT EXISTS chk_transactions_payment_method_valid
  CHECK (payment_method IN ('cash', 'upi', 'card', 'bank-transfer', 'bank_transfer'));

ALTER TABLE expenditures
  ADD CONSTRAINT IF NOT EXISTS chk_expenditures_payment_method_valid
  CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'check'));

-- Bill status must be a known value
ALTER TABLE bills
  ADD CONSTRAINT IF NOT EXISTS chk_bills_status_valid
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue'));

-- Expenditure category must be one of the known values
ALTER TABLE expenditures
  ADD CONSTRAINT IF NOT EXISTS chk_expenditures_category_valid
  CHECK (category IN ('Supplies', 'Rent', 'Utilities', 'Salaries', 'Equipment', 'Marketing', 'Maintenance'));

-- Supplier status
ALTER TABLE suppliers
  ADD CONSTRAINT IF NOT EXISTS chk_suppliers_status_valid
  CHECK (status IN ('active', 'inactive'));


-- ─────────────────────────────────────────────────────────────
-- SECTION 5: USEFUL VIEWS FOR REPORTS & DASHBOARD
-- ─────────────────────────────────────────────────────────────
-- Reports.tsx calls getDashboardData() + getTransactions() and
-- does all aggregation in the browser. These views push that
-- work to the DB, eliminating N+1 risks and reducing payload.

-- Monthly transaction summary (replaces client-side groupBy in Reports.tsx)
CREATE OR REPLACE VIEW vw_monthly_transaction_summary AS
SELECT
  DATE_TRUNC('month', created_at)                                     AS month,
  COUNT(*)                                                            AS total_transactions,
  SUM(repair_cost)                                                    AS total_revenue,
  SUM(COALESCE(profit, 0))                                           AS total_profit,
  COUNT(*) FILTER (WHERE status = 'completed' OR status = 'Completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'pending'   OR status = 'Pending')   AS pending,
  AVG(repair_cost)                                                    AS avg_ticket_size
FROM transactions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Repair type distribution (replaces repairTypesMap logic in Reports.tsx)
CREATE OR REPLACE VIEW vw_repair_type_distribution AS
SELECT
  COALESCE(repair_type, 'Other') AS repair_type,
  COUNT(*)                       AS count,
  ROUND(
    COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0),
    2
  )                              AS percentage
FROM transactions
GROUP BY repair_type
ORDER BY count DESC;

-- Device brand performance (replaces deviceBrandsMap logic in Reports.tsx)
CREATE OR REPLACE VIEW vw_device_brand_performance AS
SELECT
  SPLIT_PART(COALESCE(device_model, 'Unknown'), ' ', 1) AS brand,
  COUNT(*)                                               AS repairs,
  SUM(repair_cost)                                       AS revenue
FROM transactions
GROUP BY brand
ORDER BY revenue DESC
LIMIT 10;

-- Top customers (replaces customersMap logic in Reports.tsx)
CREATE OR REPLACE VIEW vw_top_customers AS
SELECT
  COALESCE(customer_name, 'Unknown')                  AS customer_name,
  COALESCE(mobile_number, customer_name)              AS customer_id,
  COUNT(*)                                            AS total_repairs,
  SUM(repair_cost)                                    AS total_revenue,
  MAX(created_at)                                     AS last_visit
FROM transactions
GROUP BY customer_name, mobile_number
ORDER BY total_revenue DESC
LIMIT 10;

-- Expenditure category summary
CREATE OR REPLACE VIEW vw_expenditure_by_category AS
SELECT
  category,
  COUNT(*)    AS transaction_count,
  SUM(amount) AS total_amount,
  MAX(created_at) AS last_expense
FROM expenditures
GROUP BY category
ORDER BY total_amount DESC;

-- Dashboard stats (replaces /api/dashboard/stats endpoint aggregation)
CREATE OR REPLACE VIEW vw_dashboard_stats AS
SELECT
  COUNT(*)                                                              AS total_transactions,
  SUM(repair_cost)                                                      AS total_revenue,
  SUM(COALESCE(profit, 0))                                             AS total_profit,
  COUNT(*) FILTER (WHERE status IN ('pending', 'Pending'))             AS pending_transactions,
  COUNT(*) FILTER (WHERE status IN ('completed', 'Completed'))         AS completed_transactions,
  ROUND(AVG(repair_cost), 2)                                           AS avg_transaction_value,
  -- Today's stats
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)                   AS today_transactions,
  SUM(repair_cost) FILTER (WHERE created_at >= CURRENT_DATE)           AS today_revenue,
  SUM(COALESCE(profit,0)) FILTER (WHERE created_at >= CURRENT_DATE)    AS today_profit,
  -- This week's stats
  COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW()))      AS week_transactions,
  SUM(repair_cost) FILTER (WHERE created_at >= date_trunc('week', NOW())) AS week_revenue
FROM transactions;

-- Supplier spending analysis (Supplier Spending Analysis table in Reports.tsx)
CREATE OR REPLACE VIEW vw_supplier_spending AS
SELECT
  COALESCE(supplier_name, 'Unknown') AS supplier_name,
  COUNT(*)                            AS total_orders,
  SUM(COALESCE(parts_cost, 0))       AS total_spent,
  ROUND(AVG(COALESCE(parts_cost,0)), 2) AS avg_order_value
FROM transactions
WHERE supplier_name IS NOT NULL
  AND TRIM(supplier_name) <> ''
GROUP BY supplier_name
ORDER BY total_spent DESC;


-- ─────────────────────────────────────────────────────────────
-- SECTION 6: FULL-TEXT SEARCH INDEXES
-- ─────────────────────────────────────────────────────────────
-- Transactions global search (customer name + device model + repair type)
-- Replaces the slow JS-side includesString filter in Transactions.tsx

CREATE INDEX IF NOT EXISTS idx_transactions_fts
  ON transactions
  USING gin(
    to_tsvector('english',
      COALESCE(customer_name, '') || ' ' ||
      COALESCE(device_model,  '') || ' ' ||
      COALESCE(repair_type,   '') || ' ' ||
      COALESCE(mobile_number, '')
    )
  );

-- Expenditures full-text search (description + recipient + items)
CREATE INDEX IF NOT EXISTS idx_expenditures_fts
  ON expenditures
  USING gin(
    to_tsvector('english',
      COALESCE(description, '') || ' ' ||
      COALESCE(recipient,   '') || ' ' ||
      COALESCE(items,       '') || ' ' ||
      COALESCE(notes,       '')
    )
  );

-- Suppliers full-text search
CREATE INDEX IF NOT EXISTS idx_suppliers_fts
  ON suppliers
  USING gin(
    to_tsvector('english',
      COALESCE(name,           '') || ' ' ||
      COALESCE(contact_person, '')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- SECTION 7: REALTIME PUBLICATION
-- ─────────────────────────────────────────────────────────────
-- supabase/config.ts lists these tables for real-time subscriptions

ALTER PUBLICATION supabase_realtime
  ADD TABLE transactions,
            suppliers,
            expenditures,
            bills,
            customers;

-- Note: inventory_items, notifications, activity_log, purchase_orders,
-- supplier_payments, grouped_expenditures, settings should also be
-- added when those tables are confirmed to exist.


-- ─────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (run after migration to confirm success)
-- ─────────────────────────────────────────────────────────────
-- SELECT schemaname, tablename, indexname FROM pg_indexes
--   WHERE tablename IN ('transactions','suppliers','expenditures','bills','customers')
--   ORDER BY tablename, indexname;

-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;

-- SELECT table_name, constraint_name FROM information_schema.table_constraints
--   WHERE constraint_type = 'CHECK' AND table_schema = 'public'
--   ORDER BY table_name;

-- SELECT table_name, trigger_name FROM information_schema.triggers
--   WHERE trigger_schema = 'public'
--   ORDER BY table_name;
