import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Language = "en" | "te";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    transactions: "Transactions",
    suppliers: "Suppliers",
    expenditures: "Expenditures",
    bills: "Bills",
    reports: "Reports",
    settings: "Settings",

    // Dashboard
    "today-revenue": "Today's Revenue",
    "pending-repairs": "Pending Repairs",
    "quick-actions": "Quick Actions",
    "recent-transactions": "Recent Transactions",
    "new-transaction": "New Transaction",
    "record-payment": "Record Payment",

    // Transactions
    "customer-details": "Customer Details",
    "repair-info": "Repair Info",
    "parts-supplier": "Parts & Supplier",
    "additional-details": "Additional Details",
    "customer-name": "Customer Name",
    "phone-number": "Phone Number",
    "device-model": "Device Model",
    "repair-type": "Repair Type",
    "repair-cost": "Repair Cost",
    "payment-method": "Payment Method",
    "amount-given": "Amount Given",
    "change-returned": "Change Returned",

    // Status
    pending: "Pending",
    "in-progress": "In Progress",
    completed: "Completed",
    delivered: "Delivered",

    // Common
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    filter: "Filter",
    export: "Export",
    print: "Print",
    send: "Send",
    back: "Back",
    next: "Next",
    finish: "Finish",

    // Auth
    login: "Login",
    logout: "Logout",
    email: "Email",
    password: "Password",
    "remember-me": "Remember me",
    "forgot-password": "Forgot password?",
    "sign-in": "Sign in",

    // Connection
    online: "Online",
    offline: "Offline",
    connecting: "Connecting...",

    // Stock levels
    critical: "Critical",
    low: "Low",
    good: "Good",

    // Repair types
    "screen-replacement": "Screen Replacement",
    "battery-replacement": "Battery Replacement",
    "charging-port": "Charging Port",
    "speaker-repair": "Speaker Repair",
    "camera-repair": "Camera Repair",
    "water-damage": "Water Damage",
    "software-issue": "Software Issue",

    // Payment methods
    cash: "Cash",
    upi: "UPI",
    card: "Card",
    "bank-transfer": "Bank Transfer",
  },
  te: {
    // Navigation
    dashboard: "డాష్‌బోర్డ్",
    transactions: "లావాదేవీలు",
    suppliers: "సరఫరాదారులు",
    expenditures: "ఖర్చులు",
    bills: "బిల్లులు",
    reports: "నివేదికలు",
    settings: "సెట్టింగ్‌లు",

    // Dashboard
    "today-revenue": "నేటి ఆదాయం",
    "pending-repairs": "పెండింగ్ రిపేర్లు",
    "quick-actions": "త్వరిత చర్యలు",
    "recent-transactions": "ఇటీవలి లావాదేవీలు",
    "new-transaction": "కొత్త లావాదేవీ",
    "record-payment": "చెల్లింపు రికార్���్",

    // Transactions
    "customer-details": "కస్టమర్ వివరాలు",
    "repair-info": "రిపేర్ వివరాలు",
    "parts-supplier": "భాగాలు & సప్లయర్",
    "additional-details": "అదనపు వివరాలు",
    "customer-name": "కస్టమర్ పేరు",
    "phone-number": "ఫోన్ నంబర్",
    "device-model": "డివైస్ మోడల్",
    "repair-type": "రిపేర్ రకం",
    "repair-cost": "రిపేర్ ఖర్చు",
    "payment-method": "చెల్లింపు పద్ధతి",
    "amount-given": "ఇచ్చిన మొత్తం",
    "change-returned": "తిరిగి ఇచ్చిన డబ్బు",

    // Status
    pending: "పెండింగ్",
    "in-progress": "ప్రోగ్రెస్‌లో",
    completed: "పూర్తయింది",
    delivered: "డెలివరీ అయింది",

    // Common
    save: "సేవ్",
    cancel: "రద్దు",
    edit: "ఎడిట్",
    delete: "తొలగించు",
    search: "వెతుకు",
    filter: "ఫిల్టర్",
    export: "ఎక్స్‌పోర్���్",
    print: "ప్రింట్",
    send: "పంపు",
    back: "వెనుకకు",
    next: "తదుపరి",
    finish: "పూర్తి",

    // Auth
    login: "లాగిన్",
    logout: "లాగ్అవుట్",
    email: "ఈమెయిల్",
    password: "పాస్‌వర్డ్",
    "remember-me": "నన్ను గుర్తుంచుకో",
    "forgot-password": "పాస్‌వర్డ్ మర్చిపోయారా?",
    "sign-in": "లాగిన్ అవ్వండి",

    // Connection
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    connecting: "కనెక్ట్ అవుతోంది...",

    // Stock levels
    critical: "క్రిటికల్",
    low: "తక్��ువ",
    good: "బాగుంది",

    // Repair types
    "screen-replacement": "స్క్రీన్ రీప్లేస్‌మెంట్",
    "battery-replacement": "బ్యాటరీ రీప్లేస్‌మెంట్",
    "charging-port": "చార్జింగ్ పోర్ట్",
    "speaker-repair": "స్పీకర్ రిపేర్",
    "camera-repair": "కెమెరా రిపేర్",
    "water-damage": "నీటి నష్టం",
    "software-issue": "సాఫ్ట్‌వేర్ సమస్య",

    // Payment methods
    cash: "నగదు",
    upi: "UPI",
    card: "కార్డ్",
    "bank-transfer": "బ్యాంక్ బదిలీ",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("language") as Language) || "en";
    }
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;

    // Add Telugu class for font support
    if (language === "te") {
      document.documentElement.classList.add("telugu");
    } else {
      document.documentElement.classList.remove("telugu");
    }
  }, [language]);

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
