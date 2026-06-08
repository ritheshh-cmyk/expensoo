import { supabase, REALTIME_EVENTS, RealtimePayload, NotificationPayload, ActivityLogPayload, getRoleBasedFilter } from '../../supabase/config'
import { io, Socket } from 'socket.io-client'

class RealtimeService {
  private socket: Socket | null = null
  private subscriptions: Map<string, any> = new Map()
  private isConnected = false
  private userRole: string = 'demo'
  private userId: number | null = null
  private shopId: string = 'default'
  private eventListeners: Map<string, Set<Function>> = new Map()

  constructor() {
    this.initializeWebSocket()
  }

  // Initialize WebSocket connection
  private initializeWebSocket() {
    try {
      // Get backend URL based on environment
      const backendUrl = import.meta.env.MODE === 'production' 
        ? (import.meta.env.VITE_PRODUCTION_WEBSOCKET_URL || import.meta.env.VITE_PRODUCTION_BACKEND_URL || 'https://backendmobile-4swg.onrender.com')
        : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000');
      
      console.log('🔌 Connecting to WebSocket:', backendUrl);
      this.socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false,
      })

      this.socket.on('connect', () => {
        console.log('WebSocket connected')
        this.isConnected = true
        this.emit('connection:established')
      })

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected')
        this.isConnected = false
        this.emit('connection:lost')
      })

      this.socket.on('reconnect', () => {
        console.log('WebSocket reconnected')
        this.isConnected = true
        this.emit('connection:restored')
        this.resubscribeAll()
      })

      // Listen for real-time events from backend
      Object.values(REALTIME_EVENTS).forEach(event => {
        this.socket?.on(event, (data: any) => {
          this.emit(event, data)
        })
      })

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
    }
  }

  // Set user context for role-based filtering
  setUserContext(userId: number, userRole: string, shopId: string = 'default') {
    this.userId = userId
    this.userRole = userRole
    this.shopId = shopId
    
    // Join user-specific room
    if (this.socket) {
      this.socket.emit('join:user', { userId, userRole, shopId })
    }
  }

  // Subscribe to real-time table changes
  subscribeToTable(tableName: string, callback: (payload: RealtimePayload) => void) {
    const filter = getRoleBasedFilter(this.userRole, this.shopId)
    
    const subscription = supabase
      .channel(`public:${tableName}:${this.userRole}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: filter,
        },
        (payload: RealtimePayload) => {
          console.log(`Real-time update for ${tableName}:`, payload)
          callback(payload)
          
          // Emit to local event system
          this.emit(`table:${tableName}`, payload)
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${tableName}:`, status)
      })

    this.subscriptions.set(tableName, subscription)
    return subscription
  }

  // Subscribe to specific real-time events
  subscribeToEvent(eventType: string, callback: Function) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    this.eventListeners.get(eventType)?.add(callback)
  }

  // Unsubscribe from events
  unsubscribeFromEvent(eventType: string, callback: Function) {
    this.eventListeners.get(eventType)?.delete(callback)
  }

  // Emit events to listeners
  private emit(eventType: string, data?: any) {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error)
        }
      })
    }
  }

  // Subscribe to transactions with role-based filtering
  subscribeToTransactions(callback: (payload: RealtimePayload) => void) {
    return this.subscribeToTable('transactions', callback)
  }

  // Subscribe to inventory updates
  subscribeToInventory(callback: (payload: RealtimePayload) => void) {
    return this.subscribeToTable('inventory_items', callback)
  }

  // Subscribe to notifications
  subscribeToNotifications(callback: (payload: RealtimePayload<NotificationPayload>) => void) {
    return this.subscribeToTable('notifications', (payload) => {
      // Filter notifications by user_id or role
      const notification = payload.new as NotificationPayload
      if (!notification.user_id || notification.user_id === this.userId) {
        callback(payload)
      }
    })
  }

  // Subscribe to activity log
  subscribeToActivityLog(callback: (payload: RealtimePayload<ActivityLogPayload>) => void) {
    return this.subscribeToTable('activity_log', callback)
  }

  // Subscribe to bills
  subscribeToBills(callback: (payload: RealtimePayload) => void) {
    return this.subscribeToTable('bills', callback)
  }

  // Subscribe to purchase orders
  subscribeToPurchaseOrders(callback: (payload: RealtimePayload) => void) {
    return this.subscribeToTable('purchase_orders', callback)
  }

  // Send real-time message via WebSocket
  sendMessage(eventType: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventType, {
        ...data,
        userId: this.userId,
        userRole: this.userRole,
        shopId: this.shopId,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Create real-time notification
  createNotification(notification: Omit<NotificationPayload, 'id' | 'created_at'>) {
    this.sendMessage(REALTIME_EVENTS.NOTIFICATION_CREATED, notification)
  }

  // Log activity in real-time
  logActivity(activity: Omit<ActivityLogPayload, 'id' | 'created_at'>) {
    this.sendMessage(REALTIME_EVENTS.ACTIVITY_LOGGED, {
      ...activity,
      user_id: this.userId,
    })
  }

  // Broadcast user online status
  setUserOnline() {
    this.sendMessage(REALTIME_EVENTS.USER_ONLINE, {
      userId: this.userId,
      userRole: this.userRole,
    })
  }

  // Broadcast user offline status
  setUserOffline() {
    this.sendMessage(REALTIME_EVENTS.USER_OFFLINE, {
      userId: this.userId,
      userRole: this.userRole,
    })
  }

  // Resubscribe to all active subscriptions
  private resubscribeAll() {
    const tableNames = Array.from(this.subscriptions.keys())
    this.subscriptions.clear()
    
    // Re-establish subscriptions
    tableNames.forEach(tableName => {
      // Note: This would need the original callbacks to be stored
      console.log(`Resubscribing to ${tableName}`)
    })
  }

  // Unsubscribe from table
  unsubscribeFromTable(tableName: string) {
    const subscription = this.subscriptions.get(tableName)
    if (subscription) {
      supabase.removeChannel(subscription)
      this.subscriptions.delete(tableName)
    }
  }

  // Unsubscribe from all tables
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, tableName) => {
      supabase.removeChannel(subscription)
    })
    this.subscriptions.clear()
  }

  // Get connection status
  getConnectionStatus() {
    return {
      websocket: this.isConnected,
      supabase: supabase.realtime.isConnected(),
      subscriptions: this.subscriptions.size,
    }
  }

  // Cleanup on component unmount
  cleanup() {
    this.setUserOffline()
    this.unsubscribeAll()
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.eventListeners.clear()
  }

  // Get real-time metrics for dashboard
  async getRealtimeMetrics() {
    try {
      // This would typically fetch from your analytics service
      return {
        activeUsers: 0,
        totalTransactions: 0,
        revenueToday: 0,
        inventoryAlerts: 0,
        pendingOrders: 0,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error)
      return null
    }
  }
}

// Create singleton instance
const realtimeService = new RealtimeService()

export default realtimeService
export { RealtimeService }