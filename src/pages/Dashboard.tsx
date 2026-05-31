import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import {
  DollarSign,
  Clock,
  TrendingUp,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Backend returns camelCase: customerName, deviceModel, repairType, createdAt */
function getField(tx: any, ...keys: string[]): string {
  for (const k of keys) {
    if (tx[k] !== undefined && tx[k] !== null && tx[k] !== "") return String(tx[k]);
  }
  return "";
}

function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(value: any): string {
  const num = parseFloat(String(value ?? 0));
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "completed": return "bg-brand-green-50 text-brand-green-600 border-brand-green/20 dark:bg-brand-green/15 dark:text-brand-green dark:border-brand-green/20";
    case "pending":   return "bg-brand-orange-50 text-brand-orange-600 border-brand-orange/20 dark:bg-brand-orange/15 dark:text-brand-orange dark:border-brand-orange/20";
    case "cancelled": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800";
    default:          return "bg-muted text-muted-foreground border-border";
  }
}

// ─── component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, hasAccess } = useAuth();

  const [showProfits, setShowProfits] = useState(
    localStorage.getItem("showProfits") === "true",
  );
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalProfit: 0,
    todayProfit: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const toggleProfits = () => {
    const next = !showProfits;
    setShowProfits(next);
    localStorage.setItem("showProfits", String(next));
  };

  const fetchDashboardData = async (showToast = false) => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    try {
      const [dash, txns] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getTransactions(),
      ]);

      // ── dashboard metrics ─────────────────────────────────────────────────
      // getDashboardStats() returns { success, data: { totals, today, week } }
      const dashData = dash?.data ?? dash;
      if (dashData?.totals) {
        const t = dashData.totals;
        const td = dashData.today ?? {};
        setDashboardData({
          totalRevenue:        Number(t.totalRevenue)        || 0,
          todayRevenue:        Number(td.totalRevenue)       || 0,
          totalProfit:         Number(t.totalProfit)         || 0,
          todayProfit:         Number(td.totalProfit)        || 0,
          totalTransactions:   Number(t.totalTransactions)   || 0,
          pendingTransactions: Number(t.pendingTransactions) || 0,
        });
      }


      // ── recent transactions ───────────────────────────────────────────────
      const raw: any[] = Array.isArray(txns)
        ? txns
        : Array.isArray(txns?.data)
        ? txns.data
        : Array.isArray(txns?.transactions)
        ? txns.transactions
        : [];
      setRecentTransactions(raw.slice(0, 6));

      if (showToast) {
        toast({ title: "Refreshed", description: "Dashboard data updated." });
      }
    } catch (err) {
      console.error("[Dashboard] fetch error:", err);
      if (showToast) {
        toast({ title: "Refresh failed", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [user]);

  const isOwnerOrAdmin = hasAccess(["admin", "owner"]);

  return (
    // ⚠️ NO <AppLayout> here — App.tsx already wraps this in <AppLayout>
    <div className="space-y-6">

      {/* ── page header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">
            {t("dashboard")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("welcome-back")},{" "}
            <span className="font-medium text-foreground">
              {user?.name || user?.username || "—"}
            </span>
            !{" "}
            {user?.role === "worker"
              ? t("worker-tasks")
              : t("shop-overview")}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={loading}
            className="min-h-[44px] px-4"
            style={{ touchAction: "manipulation" }}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            {loading ? t("loading") : t("refresh")}
          </Button>

          {isOwnerOrAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleProfits}
              className="min-h-[44px] px-4"
              style={{ touchAction: "manipulation" }}
            >
              {showProfits ? t("hide-profits") : t("show-profits")}
            </Button>
          )}
        </div>
      </div>

      {/* ── stat cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("today-revenue")}
            </CardTitle>
            <div className="rounded-full bg-brand-green-50 dark:bg-brand-green/15 p-2">
              <DollarSign className="h-4 w-4 text-brand-green dark:text-brand-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-green font-heading">
              ₹{formatCurrency(dashboardData.todayRevenue)}
            </div>
            {isOwnerOrAdmin && showProfits && dashboardData.todayProfit > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("profit")}: ₹{formatCurrency(dashboardData.todayProfit)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{t("today-earnings")}</p>
          </CardContent>
        </Card>

        {/* Pending Repairs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("pending-repairs")}
            </CardTitle>
            <div className="rounded-full bg-brand-orange-50 dark:bg-brand-orange/15 p-2">
              <Clock className="h-4 w-4 text-brand-orange dark:text-brand-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-orange font-heading">
              {dashboardData.pendingTransactions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("awaiting-completion")}</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("total-revenue")}
            </CardTitle>
            <div className="rounded-full bg-brand-blue-50 dark:bg-brand-blue/15 p-2">
              <TrendingUp className="h-4 w-4 text-brand-blue dark:text-brand-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">
              ₹{formatCurrency(dashboardData.totalRevenue)}
            </div>
            {isOwnerOrAdmin && showProfits && dashboardData.totalProfit > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("profit")}: ₹{formatCurrency(dashboardData.totalProfit)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.totalTransactions} {t("total-transactions-label")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── recent transactions ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t("recent-transactions")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("latest-repair-jobs")}
              </p>
            </div>
            <Link to="/transactions">
              <Button variant="outline" size="sm" className="gap-1">
                {t("view-all")} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="divide-y">
              {recentTransactions.map((tx, i) => {
                // Backend returns camelCase — map correctly
                const customerName =
                  getField(tx, "customerName", "customer_name", "name") ||
                  `Customer #${tx.id}`;
                const deviceModel =
                  getField(tx, "deviceModel", "device_model", "device_type", "device") || "—";
                const repairType =
                  getField(tx, "repairType", "repair_type", "repair") || "—";
                const dateStr = formatDate(
                  tx.createdAt ?? tx.created_at ?? tx.date
                );
                const cost = getField(tx, "repairCost", "repair_cost", "amountGiven", "amount_given");
                const status = getField(tx, "status") || "pending";

                return (
                  <div
                    key={tx.id ?? i}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    {/* Icon */}
                    <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{customerName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {deviceModel} · {repairType}
                      </div>
                      <div className="text-xs text-muted-foreground">{dateStr}</div>
                    </div>

                    {/* Right side */}
                    <div className="shrink-0 text-right space-y-1">
                      <div className="font-semibold text-sm">₹{formatCurrency(cost)}</div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                          getStatusColor(status),
                        )}
                      >
                        {status === "Completed" ? (
                          <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                        ) : (
                          <AlertCircle className="mr-0.5 h-2.5 w-2.5" />
                        )}
                        {t(status.toLowerCase())}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Smartphone className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">{t("no-transactions-yet")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("add-first-transaction")}
              </p>
              <Link to="/transactions/new" className="mt-4">
                <Button size="sm">{t("add-transaction")}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
