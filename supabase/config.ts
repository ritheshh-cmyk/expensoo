import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ixjqjqjqjqjqjqjqjqjq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4anFqcWpxanFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY4MDAsImV4cCI6MjA2OTk1MjgwMH0.placeholder'
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4anFqcWpxanFqcWpxanFqcWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3NjgwMCwiZXhwIjoyMDY5OTUyODAwfQ.placeholder'

// Create Supabase client for frontend (using anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Create Supabase client for backend (using service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Real-time subscription configuration
export const realtimeConfig = {
  // Tables to subscribe to for real-time updates
  tables: [
    'transactions',
    'inventory_items',
    'notifications',
    'activity_log',
    'bills',
    'purchase_orders',
    'grouped_expenditures',
    'supplier_payments',
    'expenditures',
    'settings',
  ],
  
  // Events to listen for
  events: ['INSERT', 'UPDATE', 'DELETE'],
  
  // Role-based subscription filters
  roleFilters: {
    admin: '*', // Admin can see all data
    owner: 'shop_id=eq.default', // Owner can see their shop data
    worker: 'shop_id=eq.default', // Worker can see their shop data
    demo: 'shop_id=eq.demo', // Demo user sees demo data only
  },
}

// WebSocket configuration for Socket.IO fallback
export const websocketConfig = {
  url: process.env.NODE_ENV === 'production' 
    ? 'wss://your-production-domain.com'
    : 'ws://localhost:3001',
  options: {
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    forceNew: false,
  },
}

// Real-time event types
export const REALTIME_EVENTS = {
  // Transaction events
  TRANSACTION_CREATED: 'transaction:created',
  TRANSACTION_UPDATED: 'transaction:updated',
  TRANSACTION_DELETED: 'transaction:deleted',
  
  // Inventory events
  INVENTORY_UPDATED: 'inventory:updated',
  INVENTORY_LOW_STOCK: 'inventory:low_stock',
  INVENTORY_OUT_OF_STOCK: 'inventory:out_of_stock',
  
  // Notification events
  NOTIFICATION_CREATED: 'notification:created',
  NOTIFICATION_READ: 'notification:read',
  
  // Activity events
  ACTIVITY_LOGGED: 'activity:logged',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  
  // System events
  SYSTEM_ALERT: 'system:alert',
  SYSTEM_MAINTENANCE: 'system:maintenance',
  
  // Business events
  REVENUE_MILESTONE: 'business:revenue_milestone',
  DAILY_SUMMARY: 'business:daily_summary',
} as const

// Type definitions for real-time data
export interface RealtimePayload<T = any> {
  eventType: string
  new: T
  old: T
  table: string
  schema: string
  commit_timestamp: string
}

export interface NotificationPayload {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  user_id?: number
  priority: 'low' | 'normal' | 'high' | 'critical'
  action_url?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface ActivityLogPayload {
  id: number
  user_id?: number
  action: string
  entity_type: string
  entity_id?: number
  description: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Helper functions for real-time subscriptions
export const createRealtimeSubscription = (
  table: string,
  callback: (payload: RealtimePayload) => void,
  filter?: string
) => {
  return supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter,
      },
      callback
    )
    .subscribe()
}

export const unsubscribeFromRealtime = (subscription: any) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
}

// Role-based real-time access control
export const getRoleBasedFilter = (userRole: string, shopId: string = 'default') => {
  switch (userRole) {
    case 'admin':
      return undefined // Admin sees everything
    case 'owner':
      return `shop_id=eq.${shopId}`
    case 'worker':
      return `shop_id=eq.${shopId}`
    case 'demo':
      return 'shop_id=eq.demo'
    default:
      return 'shop_id=eq.none' // No access
  }
}

export default supabase