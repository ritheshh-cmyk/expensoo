import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Download, Users, DollarSign, Package, Loader2 } from 'lucide-react';

const BACKEND = 'https://backendmobile-4swg.onrender.com';

interface ExportOption {
  id: string;
  label: string;
  endpoint: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  description: string;
  color: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'users',
    label: 'Users',
    endpoint: '/api/auth/export/users',
    icon: Users,
    description: 'All user accounts and roles',
    color: 'text-blue-500',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    endpoint: '/api/auth/export/transactions',
    icon: DollarSign,
    description: 'All transaction records',
    color: 'text-green-500',
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    endpoint: '/api/auth/export/suppliers',
    icon: Package,
    description: 'Supplier data with contact info',
    color: 'text-orange-500',
  },
];

export function DataExportPanel() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (option: ExportOption) => {
    setExporting(option.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}${option.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${option.id}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `${option.label} data downloaded as CSV`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not download data';
      toast({
        title: 'Export failed',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export
        </CardTitle>
        <CardDescription>
          Export system data to CSV for accounting and backup purposes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {EXPORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isLoading = exporting === opt.id;
            return (
              <div
                key={opt.id}
                className="border rounded-lg p-4 flex flex-col gap-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-8 w-8 ${opt.color}`} />
                  <div>
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={exporting !== null}
                  onClick={() => handleExport(opt)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting…
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          ⚠️ Exported data is sensitive. Store securely and comply with data protection regulations.
        </p>
      </CardContent>
    </Card>
  );
}
