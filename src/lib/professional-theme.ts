/**
 * Professional Theme Constants
 * Clean, modern design without childish elements
 */

export const PROFESSIONAL_THEME = {
  // Brand Colors - Professional Blue/Gray Palette
  colors: {
    primary: 'hsl(220, 70%, 50%)', // Professional blue
    secondary: 'hsl(220, 15%, 85%)', // Light gray
    accent: 'hsl(220, 60%, 45%)', // Accent blue
    success: 'hsl(142, 71%, 45%)', // Success green
    warning: 'hsl(38, 92%, 50%)', // Warning amber
    error: 'hsl(0, 84%, 60%)', // Error red
    background: 'hsl(0, 0%, 98%)', // Clean white
    surface: 'hsl(0, 0%, 100%)', // Pure white
    border: 'hsl(220, 13%, 91%)', // Light border
    text: {
      primary: 'hsl(220, 15%, 15%)', // Dark text
      secondary: 'hsl(220, 10%, 45%)', // Muted text
      muted: 'hsl(220, 5%, 65%)', // Light text
    }
  },

  // Typography - Professional fonts
  fonts: {
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace'
  },

  // Professional spacing
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },

  // Professional shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
  },

  // Professional animations
  animations: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease'
  }
} as const;

export const PROFESSIONAL_TEXT = {
  // Remove childish language
  systemStatus: 'System Operational',
  version: 'Version 2.1.0',
  copyright: '© 2025 CallMeMobiles. Professional mobile repair management solution.',
  
  // Professional button labels
  buttons: {
    save: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View Details',
    create: 'Create New',
    update: 'Update',
    export: 'Export Data',
    import: 'Import Data'
  },

  // Professional status messages
  status: {
    success: 'Operation completed successfully',
    error: 'An error occurred. Please try again.',
    loading: 'Processing...',
    saved: 'Changes saved successfully',
    deleted: 'Item deleted successfully',
    updated: 'Item updated successfully'
  }
} as const;

// Remove emoji usage utility
export const removeEmojis = (text: string): string => {
  return text.replace(/[🌀-🛿]|[☀-⛿]|[✀-➿]/gu, '').trim();
};

// Professional icon mapping (replace emoji icons)
export const PROFESSIONAL_ICONS = {
  // Replace emoji with Lucide icons
  success: 'CheckCircle',
  error: 'AlertCircle',
  warning: 'AlertTriangle',
  info: 'Info',
  loading: 'Loader2',
  system: 'Server',
  online: 'Wifi',
  offline: 'WifiOff'
} as const;
