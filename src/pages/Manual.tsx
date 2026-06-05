import React from 'react';
import { BookOpen, FileText, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Manual() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/15 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" />
            User Manual
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
            Everything you need to know about using Expensoo efficiently. Browse the sections below for step-by-step guides and FAQs.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Quick answers to common operations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I add a new transaction?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  To add a new transaction, tap the floating <strong>"+" button</strong> on the Dashboard or navigate to the <strong>Transactions</strong> page and click "Add Transaction". 
                  You will be guided through a 3-step wizard where you can select the customer, add job details (Cost Price, Selling Price), and confirm the payment method (Cash, UPI, Card).
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>What is "Internal Repair" mode?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  When creating a transaction, if the device belongs to the shop and is not for a direct customer, you can toggle <strong>"Internal Repair"</strong> on Step 2. 
                  This will hide the payment options (since the shop doesn't pay itself) and automatically mark the transaction as internal in your records.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How is the Cost Price (CP) hidden?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  To ensure privacy, the Cost Price (CP) and resulting profits are masked by default across the Dashboard, Reports, and Transaction History. 
                  You can click the <strong>Eye icon</strong> next to these values to temporarily reveal them.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>How do I change my Display Name or Photo?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Navigate to the <strong>Profile</strong> page from the sidebar. You can upload a new photo directly, which saves locally on your device. 
                  Scroll down to "Update Credentials" to change your Display Name or Username. Changes are applied instantly!
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Expandable Rows:</strong> In the Sales and Transactions history, simply click on any row to expand it and view full details without leaving the page.
              </p>
              <p>
                <strong className="text-foreground">Mobile Navigation:</strong> On smaller screens, you can close the sidebar by simply clicking outside of it.
              </p>
              <p>
                <strong className="text-foreground">Unpaid Filters:</strong> Use the "Status" filter on the Transactions page to quickly find any pending "Unpaid" jobs that need to be collected.
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Your session automatically expires after 15 minutes of inactivity. For shared devices, always remember to manually log out using the Profile page when you're done.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
