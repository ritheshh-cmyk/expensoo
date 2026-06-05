import { io, Socket } from 'socket.io-client'

// Real-time events configuration
export const REALTIME_EVENTS = {
  TRANSACTION_CREATED: 'transaction:created',
  TRANSACTION_UPDATED: 'transaction:updated',
  TRANSACTION_DELETED: 'transaction:deleted',
  BILL_CREATED: 'bill:created',
  BILL_UPDATED: 'bill:updated',
  NOTIFICATION_CREATED: 'notification:created',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  ACTIVITY_LOGGED: 'activity:logged',
  DASHBOARD_UPDATED: 'dashboard:updated'
};

export interface RealtimePayload<T = any> {
  eventType: string;
  data: T;
  timestamp: string;
  userId?: number;
  shopId?: string;
}

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  user_id?: number;
  created_at: string;
  read: boolean;
}

export interface ActivityLogPayload {
  id: string;
  user_id: number;
  action: string;
  description: string;
  metadata?: any;
  created_at: string;
}

class RealtimeService {
  private socket: Socket | null = null
  private isConnected = false
  private userRole: string = 'demo'
  private userId: number | null = null
  private shopId: string = 'default'
  private eventListeners: Map<string, Set<Function>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor() {
    this.initializeWebSocket()
  }

  // Initialize WebSocket connection to Digital Ocean backend
  private initializeWebSocket() {
    try {
      // Use the working Digital Ocean backend URL
      const backendUrl = 'https://expensoo-app-gu3wg.ondigitalocean.app';
      
      console.log('🔌 Real-time Service: Connecting to Digital Ocean backend');
      console.log('🔌 Backend URL:', backendUrl);
      
      this.socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false,
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
          'origin': window.location.origin
        }
      })

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected to Digital Ocean backend')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connection:established')
        
        // Join rooms based on user context
        if (this.userId) {
          this.socket?.emit('join:user', { 
            userId: this.userId, 
            userRole: this.userRole, 
            shopId: this.shopId 
          })
        }
      })

      this.socket.on('disconnect', (reason) => {
        console.log('⚠️ WebSocket disconnected:', reason)
        this.isConnected = false
        this.emit('connection:lost', { reason })
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error)
        this.reconnectAttempts++
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('💥 Max reconnection attempts reached')
          this.emit('connection:failed', { error, attempts: this.reconnectAttempts })
        }
      })

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connection:restored', { attemptNumber })
        this.resubscribeAll()
      })

      // Listen for real-time events from backend
      Object.values(REALTIME_EVENTS).forEach(event => {
        this.socket?.on(event, (data: RealtimePayload) => {
          console.log(`📡 Real-time event received: ${event}`, data)
          this.emit(event, data)
        })
      })

      // Handle real-time dashboard updates
      this.socket.on('dashboard:metrics', (data) => {
        console.log('📊 Real-time dashboard metrics:', data)
        this.emit('dashboard:metrics', data)
      })

    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error)
      this.emit('connection:failed', { error })
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

  // Subscribe to real-time events
  subscribeToEvent(eventType: string, callback: Function) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    this.eventListeners.get(eventType)?.add(callback)
    
    console.log(`📡 Subscribed to event: ${eventType}`)
    return () => this.unsubscribeFromEvent(eventType, callback)
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

  // Subscribe to transactions with real-time updates
  subscribeToTransactions(callback: (payload: RealtimePayload) => void) {
    return this.subscribeToEvent(REALTIME_EVENTS.TRANSACTION_CREATED, callback)
  }

  // Subscribe to notifications
  subscribeToNotifications(callback: (payload: RealtimePayload<NotificationPayload>) => void) {
    return this.subscribeToEvent(REALTIME_EVENTS.NOTIFICATION_CREATED, callback)
  }

  // Subscribe to activity log
  subscribeToActivityLog(callback: (payload: RealtimePayload<ActivityLogPayload>) => void) {
    return this.subscribeToEvent(REALTIME_EVENTS.ACTIVITY_LOGGED, callback)
  }

  // Subscribe to bills
  subscribeToBills(callback: (payload: RealtimePayload) => void) {
    return this.subscribeToEvent(REALTIME_EVENTS.BILL_CREATED, callback)
  }

  // Subscribe to dashboard updates
  subscribeToDashboard(callback: (payload: RealtimePayload) => void) {
    return this.subscribeToEvent(REALTIME_EVENTS.DASHBOARD_UPDATED, callback)
  }

  // Subscribe to real-time dashboard metrics
  subscribeToDashboardMetrics(callback: (data: any) => void) {
    return this.subscribeToEvent('dashboard:metrics', callback)
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
    // Re-establish user context
    if (this.userId) {
      this.socket?.emit('join:user', { 
        userId: this.userId, 
        userRole: this.userRole, 
        shopId: this.shopId 
      })
    }
    
    console.log('🔄 Resubscribed to all real-time events')
  }

  // Get connection status
  getConnectionStatus() {
    return {
      websocket: this.isConnected,
      subscriptions: this.eventListeners.size,
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId,
      userRole: this.userRole
    }
  }

  // Cleanup on component unmount
  cleanup() {
    this.setUserOffline()
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.eventListeners.clear()
  }

  // Get real-time metrics for dashboard
  async getRealtimeMetrics() {
    try {
      // Request real-time metrics from backend
      if (this.socket && this.isConnected) {
        this.socket.emit('request:metrics')
      }
      
      return {
        activeUsers: 0,
        totalTransactions: 0,
        revenueToday: 0,
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
