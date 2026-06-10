import React from 'react';
import {
  BookOpen,
  FileText,
  Settings as SettingsIcon,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Manual() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-zinc-800 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-500" />
              Expensoo Documentation
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Access the User manual.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-zinc-950/40 border-zinc-800/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <FileText className="h-5 w-5 text-blue-500" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">Quick answers to common operations and workflows.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-2">
              <AccordionItem value="getting-started" className="border-zinc-800/60">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-blue-400 transition-colors">
                  Getting Started
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed text-xs pt-1 pb-3 space-y-2">
                  <p>Welcome to Expensoo! To get started, make sure you configure your profile and settings. Explore the dashboard cards to see a real-time overview of your store's performance. The bottom navigation bar on mobile or sidebar on desktop makes it easy to move between sections.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="creating-transaction" className="border-zinc-800/60">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-blue-400 transition-colors">
                  Creating a Transaction
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed text-xs pt-1 pb-3 space-y-2">
                  <p>Click the floating <strong className="text-zinc-200">"+" button</strong> on the dashboard or <strong className="text-zinc-200">"New Transaction"</strong> on the Transactions page. Follow the multistep form: enter customer details, specify repair details, set parts cost, select optional inventory tracking, and input payment method. Transactions are stored securely and sync automatically.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="managing-transactions" className="border-zinc-800/60">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-blue-400 transition-colors">
                  Managing Transactions
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed text-xs pt-1 pb-3 space-y-2">
                  <p>View, edit, or delete transactions from the Transactions list. You can filter by date or payment status. Click any transaction row to expand its full detail panel. If a customer is unpaid, you can mark them as paid or send them a reminder SMS directly.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="dashboard-overview" className="border-zinc-850">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-blue-400 transition-colors">
                  Dashboard Overview
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed text-xs pt-1 pb-3 space-y-2">
                  <p>The dashboard is your command center. It shows critical metrics: Total Revenue, Total Profit, and Today's metrics. Cost Price (CP) is masked by default for privacy—click the Eye icon next to it to show it. Expandable metric cards provide detailed graphical reports.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="settings-guide" className="border-zinc-850">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-blue-400 transition-colors">
                  Settings Guide
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed text-xs pt-1 pb-3 space-y-2">
                  <p>Customize Expensoo in the Settings page. You can change your password with real-time strength feedback, set appearance mode (Light, Dark, System), configure language (English or Telugu), and toggle mobile options like touch optimization or auto-sync.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-zinc-950/20 border-zinc-800/80">
            <CardHeader>
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <SettingsIcon className="h-4.5 w-4.5 text-blue-500" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-zinc-400">
              <p>
                <strong className="text-zinc-200">Expandable Rows:</strong> In the Sales and Transactions history, simply click on any row to expand it and view full details without leaving the page.
              </p>
              <p>
                <strong className="text-zinc-200">Mobile Navigation:</strong> On smaller screens, you can close the sidebar by simply clicking outside of it.
              </p>
              <p>
                <strong className="text-zinc-200">Unpaid Filters:</strong> Use the "Status" filter on the Transactions page to quickly find any pending "Unpaid" jobs that need to be collected.
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-950/40 bg-red-950/5">
            <CardHeader>
              <CardTitle className="text-md font-bold flex items-center gap-2 text-red-400">
                <ShieldAlert className="h-4.5 w-4.5" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-400">
              Your session automatically expires after 15 minutes of inactivity. For shared devices, always remember to manually log out using the Profile page when you're done.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
