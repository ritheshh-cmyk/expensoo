import { supabase, REALTIME_EVENTS, RealtimePayload, NotificationPayload, ActivityLogPayload, getRoleBasedFilter } from '../../supabase/config'
import { io, Socket } from 'socket.io-client'
import supabaseAuthService, { AuthUser } from './supabaseAuthService'

class SupabaseRealtimeService {
  private socket: Socket | null = null
  private supabaseSubscriptions: Map<string, any> = new Map()
  private isSocketConnected = false
  private isSupabaseConnected = false
  private currentUser: AuthUser | null = null
  private eventListeners: Map<string, Set<Function>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor() {
    this.initializeServices()
  }

  // Initialize both WebSocket and Supabase Realtime
  private async initializeServices() {
    try {
      // Initialize WebSocket connection
      await this.initializeWebSocket()
      
      // Initialize Supabase Realtime
      await this.initializeSupabaseRealtime()
      
      // Listen for auth changes
      this.setupAuthListener()
      
    } catch (error) {
      console.error('❌ Failed to initialize realtime services:', error)
    }
  }

  // Initialize WebSocket connection with Supabase Auth
  private async initializeWebSocket() {
    try {
      // Get backend URL based on environment
      const backendUrl = import.meta.env.MODE === 'production' 
        ? (import.meta.env.VITE_PRODUCTION_WEBSOCKET_URL || import.meta.env.VITE_PRODUCTION_BACKEND_URL || 'https://expensoo-app-gu3wg.ondigitalocean.app')
        : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000');
      
      console.log('🔌 Connecting to WebSocket with Supabase Auth:', backendUrl);
      
      this.socket = io(backendUrl, {
        transports: ['polling', 'websocket'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false,
      })

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected')
        this.isSocketConnected = true
        this.emit('connection:established')
        this.authenticateSocket()
      })

      this.socket.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected')
        this.isSocketConnected = false
        this.emit('connection:lost')
      })

      this.socket.on('reconnect', () => {
        console.log('🔄 WebSocket reconnected')
        this.isSocketConnected = true
        this.emit('connection:restored')
        this.authenticateSocket()
        this.resubscribeAll()
        this.reconnectAttempts = 0
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error)
        this.reconnectAttempts++
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached')
          this.emit('connection:failed')
        }
      })

      // Handle authentication responses
      this.socket.on('authenticated', (data) => {
        console.log('✅ Socket authenticated:', data.user.username)
        this.emit('socket:authenticated', data)
      })

      this.socket.on('auth_error', (error) => {
        console.error('❌ Socket authentication error:', error)
        this.emit('socket:auth_error', error)
      })

      // Listen for real-time events from backend
      this.setupSocketEventListeners()

    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error)
    }
  }

  // Authenticate socket connection with Supabase token
  private async authenticateSocket() {
    if (!this.socket || !this.isSocketConnected) {
      return
    }

    const token = supabaseAuthService.getAccessToken()
    
    if (token) {
      console.log('🔐 Authenticating socket with Supabase token...')
      this.socket.emit('authenticate', { token })
    } else {
      console.warn('⚠️ No Supabase token available for socket authentication')
    }
  }

  // Initialize Supabase Realtime subscriptions
  private async initializeSupabaseRealtime() {
    try {
      console.log('🔄 Initializing Supabase Realtime...')
      
      // Check if user is authenticated
      this.currentUser = supabaseAuthService.getCurrentUser()
      
      if (this.currentUser) {
        await this.setupSupabaseSubscriptions(this.currentUser)
      }
      
      this.isSupabaseConnected = true
      console.log('✅ Supabase Realtime initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Supabase Realtime:', error)
    }
  }

  // Setup auth state listener
  private setupAuthListener() {
    supabaseAuthService.onAuthStateChange(async (user) => {
      this.currentUser = user
      
      if (user) {
        console.log('👤 User authenticated, setting up realtime subscriptions:', user.username)
        await this.setupSupabaseSubscriptions(user)
        this.authenticateSocket()
      } else {
        console.log('👤 User logged out, cleaning up subscriptions')
        this.cleanupSupabaseSubscriptions()
      }
    })
  }

  // Setup Supabase realtime subscriptions based on user role
  private async setupSupabaseSubscriptions(user: AuthUser) {
    try {
      // Clean up existing subscriptions first
      this.cleanupSupabaseSubscriptions()

      const filter = getRoleBasedFilter(user.role, user.shop_id?.toString() || 'default')
      
      // Subscribe to tables based on user role
      const tablesToSubscribe = this.getTablesForRole(user.role)
      
      for (const tableName of tablesToSubscribe) {
        await this.subscribeToSupabaseTable(tableName, filter, user)
      }

      console.log(`✅ Set up ${tablesToSubscribe.length} Supabase subscriptions for ${user.role}`)
      
    } catch (error) {
      console.error('❌ Failed to setup Supabase subscriptions:', error)
    }
  }

  // Subscribe to a specific Supabase table
  private async subscribeToSupabaseTable(tableName: string, filter: string, user: AuthUser) {
    const channelName = `public:${tableName}:${user.id}`
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: filter,
        },
        (payload: RealtimePayload) => {
          console.log(`📡 Supabase update for ${tableName}:`, payload)
          this.emit(`supabase:${tableName}`, payload)
          this.emit(`table:${tableName}`, payload)
        }
      )
      .subscribe((status) => {
        console.log(`📡 Supabase subscription status for ${tableName}:`, status)
        if (status === 'SUBSCRIBED') {
          this.emit('supabase:subscribed', { table: tableName })
        }
      })

    this.supabaseSubscriptions.set(channelName, subscription)
  }

  // Setup Socket.IO event listeners
  private setupSocketEventListeners() {
    if (!this.socket) return

    // Business metrics updates
    this.socket.on('metrics_update', (data) => {
      console.log('📊 Metrics update:', data)
      this.emit('metrics:update', data)
    })

    // Activity feed updates
    this.socket.on('activity_feed', (data) => {
      console.log('📋 Activity feed:', data)
      this.emit('activity:feed', data)
    })

    // Inventory alerts
    this.socket.on('inventory_alerts', (data) => {
      console.log('📦 Inventory alerts:', data)
      this.emit('inventory:alerts', data)
    })

    // Notifications
    this.socket.on('new_notification', (notification) => {
      console.log('🔔 New notification:', notification)
      this.emit('notification:new', notification)
    })

    // User status updates
    this.socket.on('user_status_update', (data) => {
      console.log('👤 User status update:', data)
      this.emit('user:status', data)
    })

    // Active users count
    this.socket.on('active_users_update', (data) => {
      console.log('👥 Active users update:', data)
      this.emit('users:active', data)
    })

    // Transaction updates
    this.socket.on('transaction_update', (data) => {
      console.log('💰 Transaction update:', data)
      this.emit('transaction:update', data)
    })

    // Admin-specific events
    this.socket.on('admin_data', (data) => {
      console.log('🔑 Admin data:', data)
      this.emit('admin:data', data)
    })

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
      this.emit('socket:error', error)
    })

    // Pong response for health checks
    this.socket.on('pong', (data) => {
      this.emit('socket:pong', data)
    })
  }

  // Get tables to subscribe to based on user role
  private getTablesForRole(role: string): string[] {
    const baseTables = ['notifications']
    
    switch (role) {
      case 'admin':
        return [...baseTables, 'transactions', 'inventory_items', 'activity_log', 'bills', 'purchase_orders', 'grouped_expenditures', 'supplier_payments', 'expenditures', 'settings', 'user_profiles']
      case 'owner':
        return [...baseTables, 'transactions', 'inventory_items', 'activity_log', 'bills', 'purchase_orders', 'grouped_expenditures', 'supplier_payments', 'expenditures']
      case 'worker':
        return [...baseTables, 'transactions', 'inventory_items', 'bills']
      default:
        return baseTables
    }
  }

  // Public methods for subscribing to events
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  // Request data from backend
  requestMetrics() {
    if (this.socket && this.isSocketConnected) {
      this.socket.emit('request_metrics')
    }
  }

  requestActivityFeed(limit: number = 20, offset: number = 0) {
    if (this.socket && this.isSocketConnected) {
      this.socket.emit('request_activity_feed', { limit, offset })
    }
  }

  subscribeToInventoryAlerts() {
    if (this.socket && this.isSocketConnected) {
      this.socket.emit('subscribe_inventory_alerts')
    }
  }

  subscribeToNotifications() {
    if (this.socket && this.isSocketConnected) {
      this.socket.emit('subscribe_notifications')
    }
  }

  subscribeToTransactions() {
    if (this.socket && this.isSocketConnected) {
      this.socket.emit('subscribe_transactions')
    }
  }

  updateUserStatus(status: 'online' | 'away' | 'busy') {
    if (this.socket && this.isSocketConnected) {
      this.socket.emit('update_status', status)
    }
  }

  // Health check
  ping() {
    if (this.socket && this.isSocketConnected) {
      this.socket.emit('ping')
    }
  }

  // Resubscribe to all subscriptions after reconnection
  private async resubscribeAll() {
    if (this.currentUser) {
      await this.setupSupabaseSubscriptions(this.currentUser)
    }
    
    // Re-authenticate socket
    this.authenticateSocket()
    
    // Re-subscribe to notifications and other services
    this.subscribeToNotifications()
    this.subscribeToInventoryAlerts()
  }

  // Clean up Supabase subscriptions
  private cleanupSupabaseSubscriptions() {
    for (const [channelName, subscription] of this.supabaseSubscriptions) {
      supabase.removeChannel(subscription)
      console.log(`🧹 Cleaned up Supabase subscription: ${channelName}`)
    }
    this.supabaseSubscriptions.clear()
  }

  // Connection status
  isConnected() {
    return {
      socket: this.isSocketConnected,
      supabase: this.isSupabaseConnected,
      overall: this.isSocketConnected && this.isSupabaseConnected
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser
  }

  // Disconnect and cleanup
  disconnect() {
    console.log('🔌 Disconnecting realtime services...')
    
    // Clean up Supabase subscriptions
    this.cleanupSupabaseSubscriptions()
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    // Clear event listeners
    this.eventListeners.clear()
    
    this.isSocketConnected = false
    this.isSupabaseConnected = false
    
    console.log('✅ Realtime services disconnected')
  }
}

// Create singleton instance
export const supabaseRealtimeService = new SupabaseRealtimeService()
export default supabaseRealtimeService
