import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Settings as SettingsIcon,
  ShieldAlert,
  Terminal,
  Cpu,
  Layers,
  Code,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface ComponentDoc {
  name: string;
  category: 'Form & Controls' | 'Layout & Navigation' | 'Feedback & Indicators';
  description: string;
  cliCommand: string;
  usageExample: string;
  apiDocs: { title: string; url: string }[];
  usesInApp: string[];
}

const componentDocs: Record<string, ComponentDoc> = {
  accordion: {
    name: 'Accordion',
    category: 'Layout & Navigation',
    description: 'A vertically stacked set of interactive headings that each reveal an associated section of content.',
    cliCommand: 'npx shadcn@latest add accordion',
    usageExample: `<Accordion type="single" collapsible>\n  <AccordionItem value="item-1">\n    <AccordionTrigger>Accordion Trigger</AccordionTrigger>\n    <AccordionContent>\n      Accordion Content\n    </AccordionContent>\n  </AccordionItem>\n</Accordion>`,
    apiDocs: [
      { title: 'Animate UI Accordion Primitive', url: 'https://animate-ui.com/docs/primitives/radix/accordion' },
      { title: 'Radix UI Accordion Root', url: 'https://www.radix-ui.com/primitives/docs/components/accordion' }
    ],
    usesInApp: [
      'Powers the frequently asked questions (FAQs) on this manual page.',
      'Organizes sub-settings panels inside the Settings page.'
    ]
  },
  tabs: {
    name: 'Tabs',
    category: 'Layout & Navigation',
    description: 'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
    cliCommand: 'npx shadcn@latest add tabs',
    usageExample: `<Tabs defaultValue="tab1">\n  <TabsList>\n    <TabsTrigger value="tab1">General</TabsTrigger>\n    <TabsTrigger value="tab2">Security</TabsTrigger>\n  </TabsList>\n  <TabsContent value="tab1">General content...</TabsContent>\n  <TabsContent value="tab2">Security content...</TabsContent>\n</Tabs>`,
    apiDocs: [
      { title: 'Animate UI Tabs Primitive', url: 'https://animate-ui.com/docs/primitives/radix/tabs' },
      { title: 'Radix UI Tabs Root', url: 'https://www.radix-ui.com/primitives/docs/components/tabs' }
    ],
    usesInApp: [
      'Splits User Manual and Developer Guide on this page.',
      'Navigates between different reports (Weekly, Monthly, Yearly) in the Reports panel.',
      'Swaps panels (Users, Logs, Export) in the Admin panel.'
    ]
  },
  managementBar: {
    name: 'Management Bar',
    category: 'Layout & Navigation',
    description: 'A dashboard-friendly control deck that combines search, filters, pagination, and bulk actions.',
    cliCommand: 'npx shadcn@latest add management-bar',
    usageExample: `<ManagementBar>\n  {/* Pagination, Filters, and Bulk Actions composited */}\n</ManagementBar>`,
    apiDocs: [
      { title: 'Community Management Bar Inspiration', url: 'https://x.com/amelieschltr/status/1915019518813851985' }
    ],
    usesInApp: [
      'Top bar of the Transactions listing page to hold filters, search, and page navigation.',
      'Top bar of the Expenditure logs page for quick sorting.'
    ]
  },
  notificationList: {
    name: 'Notification List',
    category: 'Feedback & Indicators',
    description: 'A fun notification stack with animated items and cards that expand dynamically as you hover or click.',
    cliCommand: 'npx shadcn@latest add notification-list',
    usageExample: `<NotificationList />`,
    apiDocs: [
      { title: 'Community Notification List Inspiration', url: 'https://x.com/privetavdey/status/1932774726889586780' }
    ],
    usesInApp: [
      'Used inside the Admin Control panel to stream real-time user session status and alerts.',
      'Streams background job progress notifications.'
    ]
  },
  button: {
    name: 'Button',
    category: 'Form & Controls',
    description: 'Displays a standard click target, button, or link wrapper with custom size and variant themes.',
    cliCommand: 'npx shadcn@latest add button',
    usageExample: `<Button variant="outline" size="sm">\n  Submit Transaction\n</Button>`,
    apiDocs: [
      { title: 'Base UI Button Primitive', url: 'https://base-ui.com' }
    ],
    usesInApp: [
      'Primary submit triggers inside the multi-step transaction creation form.',
      'Mask/unmask eyeball icons for Cost Price masking.',
      'Sidebar navigation items and logout triggers.'
    ]
  },
  datePicker: {
    name: 'Date Picker',
    category: 'Form & Controls',
    description: 'A popover calendar allowing single-date, date ranges, or date-of-birth selections.',
    cliCommand: 'npx shadcn@latest add date-picker',
    usageExample: `<Popover>\n  <PopoverTrigger>Select Date</PopoverTrigger>\n  <PopoverContent>\n    <Calendar mode="single" />\n  </PopoverContent>\n</Popover>`,
    apiDocs: [
      { title: 'React DayPicker Documentation', url: 'https://react-day-picker.js.org' }
    ],
    usesInApp: [
      'Filters transaction records by specific dates on the Reports panel.',
      'Records the target invoice date inside the Expenditures form.'
    ]
  },
  field: {
    name: 'Field',
    category: 'Form & Controls',
    description: 'Layout system that links labels, control elements, helper descriptions, and validation errors.',
    cliCommand: 'npx shadcn@latest add field',
    usageExample: `<Field>\n  <FieldLabel htmlFor="email">Email</FieldLabel>\n  <Input id="email" />\n  <FieldDescription>We will never share your email.</FieldDescription>\n</Field>`,
    apiDocs: [
      { title: 'Radix Nova Field Primitive', url: 'https://standardschema.dev' }
    ],
    usesInApp: [
      'Integrates label and input styling across all database forms (Bills, Suppliers, Transactions).',
      'Presents standard responsive forms inside the Profile creation tab.'
    ]
  },
  inputGroup: {
    name: 'Input Group',
    category: 'Form & Controls',
    description: 'Encloses inputs along with addons, buttons, loading indicators, and keyboard shortcut tags.',
    cliCommand: 'npx shadcn@latest add input-group',
    usageExample: `<InputGroup>\n  <InputGroupInput placeholder="Search..." />\n  <InputGroupAddon align="inline-end">🔍</InputGroupAddon>\n</InputGroup>`,
    apiDocs: [
      { title: 'Input Group Addon Reference', url: 'https://shadcn-ui/ui/pull/8341' }
    ],
    usesInApp: [
      'Holds the global fuzzy search input with standard prefix icons and Command-K shortcut badges.'
    ]
  },
  pagination: {
    name: 'Pagination',
    category: 'Layout & Navigation',
    description: 'Standard navigation component that allows moving through pages of item lists.',
    cliCommand: 'npx shadcn@latest add pagination',
    usageExample: `<Pagination>\n  <PaginationContent>\n    <PaginationPrevious href="#" />\n    <PaginationLink href="#">1</PaginationLink>\n    <PaginationNext href="#" />\n  </PaginationContent>\n</Pagination>`,
    apiDocs: [
      { title: 'Radix UI Pagination Reference', url: 'https://www.radix-ui.com' }
    ],
    usesInApp: [
      'Placed inside the Management Bar to split large Transaction collections into pages.'
    ]
  },
  progress: {
    name: 'Progress',
    category: 'Feedback & Indicators',
    description: 'Displays a colored horizontal bar showing completion of long-running operations.',
    cliCommand: 'npx shadcn@latest add progress',
    usageExample: `<Progress value={65} />`,
    apiDocs: [
      { title: 'Radix UI Progress documentation', url: 'https://www.radix-ui.com/docs/primitives/components/progress' }
    ],
    usesInApp: [
      'Shows file import and export completion percentages.',
      'Displays budget usage status bars in reports.'
    ]
  },
  radioGroup: {
    name: 'Radio Group',
    category: 'Form & Controls',
    description: 'A set of mutually exclusive selections where only one item can be active.',
    cliCommand: 'npx shadcn@latest add radio-group',
    usageExample: `<RadioGroup defaultValue="one">\n  <RadioGroupItem value="one" id="r1" />\n  <RadioGroupItem value="two" id="r2" />\n</RadioGroup>`,
    apiDocs: [
      { title: 'Radix UI Radio Group Reference', url: 'https://www.radix-ui.com/docs/primitives/components/radio-group' }
    ],
    usesInApp: [
      'Payment method selection (Cash, Card, UPI) inside the Add Transaction form.'
    ]
  },
  skeleton: {
    name: 'Skeleton',
    category: 'Feedback & Indicators',
    description: 'Displays a gray placeholder box showing animated loading state representation.',
    cliCommand: 'npx shadcn@latest add skeleton',
    usageExample: `<Skeleton className="h-12 w-12 rounded-full" />`,
    apiDocs: [
      { title: 'Shadcn UI Skeleton Reference', url: 'https://ui.shadcn.com/docs/components/skeleton' }
    ],
    usesInApp: [
      'Renders skeleton blocks for Dashboard charts and transaction list rows before fetch completion.'
    ]
  },
  spinner: {
    name: 'Spinner',
    category: 'Feedback & Indicators',
    description: 'A small loader indicator showing loading state inside tags, input bars, or buttons.',
    cliCommand: 'npx shadcn@latest add spinner',
    usageExample: `<Spinner className="size-4" />`,
    apiDocs: [
      { title: 'Spinner Indicator Reference', url: 'https://ui.shadcn.com/docs/components/spinner' }
    ],
    usesInApp: [
      'Placed inside buttons during transaction creation, supplier saves, or auth logins to signal delays.'
    ]
  },
  aspectRatio: {
    name: 'Aspect Ratio',
    category: 'Layout & Navigation',
    description: 'Wraps elements to enforce consistent square, portrait, or landscape dimension boxes.',
    cliCommand: 'npx shadcn@latest add aspect-ratio',
    usageExample: `<AspectRatio ratio={16 / 9}>\n  <img src="receipt.jpg" className="object-cover" />\n</AspectRatio>`,
    apiDocs: [
      { title: 'Radix UI Aspect Ratio', url: 'https://www.radix-ui.com/primitives/docs/components/aspect-ratio' }
    ],
    usesInApp: [
      'Renders uploaded transaction screenshots or bill receipts inside the details panel.'
    ]
  }
};

export default function Manual() {
  const [activeTab, setActiveTab] = useState<'user' | 'dev'>('user');
  const [selectedCompKey, setSelectedCompKey] = useState<string>('accordion');

  const selectedComp = componentDocs[selectedCompKey];

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
              Access the User manual or explore the underlying Radix & Tailwind design components used in the application.
            </p>
          </div>
          <div>
            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-auto">
              <TabsList className="bg-zinc-900 border border-zinc-850 p-1 rounded-xl">
                <TabsTrigger value="user" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 rounded-lg text-xs font-semibold px-4 py-2">
                  User Manual
                </TabsTrigger>
                <TabsTrigger value="dev" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400 rounded-lg text-xs font-semibold px-4 py-2">
                  Developer Guide
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {activeTab === 'user' ? (
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
      ) : (
        <div className="grid gap-6 md:grid-cols-4 items-start">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1 space-y-4 bg-zinc-950/30 border border-zinc-805 rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" /> Core UI Elements
            </h3>
            <div className="space-y-1">
              {Object.keys(componentDocs).map((key) => {
                const comp = componentDocs[key];
                const isSelected = selectedCompKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCompKey(key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-all group ${
                      isSelected
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-950/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                    }`}
                  >
                    <span>{comp.name}</span>
                    <ChevronRight className={`h-3 w-3 transition-transform ${isSelected ? 'translate-x-0.5 text-indigo-400' : 'text-zinc-650 group-hover:text-zinc-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Docs Explorer Viewer */}
          <div className="md:col-span-3">
            <Card className="bg-zinc-950/45 border-zinc-800/80 backdrop-blur shadow-xl">
              <CardHeader className="border-b border-zinc-900 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <CardTitle className="text-2xl font-black text-indigo-300">{selectedComp.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400 capitalize px-2 py-0.5 rounded">
                        {selectedComp.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-zinc-450 text-xs">
                      {selectedComp.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 self-start">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                    <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Vite + Tailwind V4 Ready</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Installation CLI */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-indigo-400" /> CLI Installation
                  </h4>
                  <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-850 font-mono text-xs flex items-center justify-between text-indigo-300">
                    <code>{selectedComp.cliCommand}</code>
                    <Badge variant="secondary" className="text-[10px] bg-zinc-900 text-zinc-500 font-bold border-none uppercase tracking-wide px-1.5 py-0.5">
                      copy
                    </Badge>
                  </div>
                </div>

                {/* Uses inside Expensoo */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" /> Used in Expensoo
                  </h4>
                  <ul className="space-y-2 pl-2 border-l border-zinc-800">
                    {selectedComp.usesInApp.map((use, idx) => (
                      <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                        <span className="text-indigo-500 font-bold select-none">•</span>
                        <span>{use}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Usage Code Snippet */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <Code className="h-3.5 w-3.5 text-indigo-400" /> React Usage Example
                  </h4>
                  <pre className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-850 overflow-x-auto font-mono text-xs text-zinc-300 leading-relaxed custom-scrollbar">
                    <code>{selectedComp.usageExample}</code>
                  </pre>
                </div>

                {/* API References */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300">API Documentation References</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {selectedComp.apiDocs.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-zinc-850 bg-zinc-950/30 hover:bg-zinc-900/60 hover:border-zinc-800 transition-all group"
                      >
                        <span className="text-xs font-medium text-zinc-400 group-hover:text-indigo-300 transition-colors">
                          {doc.title}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-650 group-hover:text-indigo-400 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
