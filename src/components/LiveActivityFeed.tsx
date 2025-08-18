import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  Activity, 
  DollarSign, 
  Package, 
  User, 
  ShoppingCart, 
  Wrench, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import realtimeService from '../services/realtimeService'
import { useAuth } from '../contexts/AuthContext'
import { REALTIME_EVENTS, RealtimePayload } from '../../supabase/config'

interface ActivityItem {
  id: string
  type: 'transaction' | 'inventory' | 'user' | 'system' | 'order' | 'payment'
  action: string
  description: string
  user_id: string
  user_name: string
  user_role: string
  shop_id?: string
  timestamp: string
  metadata?: {
    amount?: number
    item_name?: string
    quantity?: number
    status?: string
    priority?: 'low' | 'medium' | 'high'
    [key: string]: any
  }
}

interface ActivityFilters {
  type: string[]
  timeRange: '1h' | '6h' | '24h' | '7d' | 'all'
  users: string[]
}

const LiveActivityFeed: React.FC = () => {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<ActivityFilters>({
    type: [],
    timeRange: '24h',
    users: [],
  })
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Initialize real-time activity feed
  useEffect(() => {
    if (user) {
      // Set user context for role-based filtering
      realtimeService.setUserContext(user.id, user.role, user.shopId || 'default')
      
      // Subscribe to connection status
      realtimeService.subscribeToEvent('connection:established', () => {
        setIsConnected(true)
      })
      
      realtimeService.subscribeToEvent('connection:lost', () => {
        setIsConnected(false)
      })
      
      realtimeService.subscribeToEvent('connection:restored', () => {
        setIsConnected(true)
        if (autoRefresh) {
          loadInitialActivities()
        }
      })
      
      // Subscribe to real-time updates
      subscribeToActivityUpdates()
      
      // Load initial activities
      loadInitialActivities()
    }
    
    return () => {
      realtimeService.cleanup()
    }
  }, [user])

  // Auto-refresh activities
  useEffect(() => {
    if (autoRefresh && isConnected) {
      const interval = setInterval(() => {
        // In a real app, this would fetch latest activities
        console.log('Auto-refreshing activities...')
      }, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, isConnected])

  const subscribeToActivityUpdates = useCallback(() => {
    // Subscribe to transactions
    realtimeService.subscribeToTransactions((payload: RealtimePayload) => {
      handleTransactionActivity(payload)
    })
    
    // Subscribe to inventory updates
    realtimeService.subscribeToInventory((payload: RealtimePayload) => {
      handleInventoryActivity(payload)
    })
    
    // Subscribe to activity log
    realtimeService.subscribeToActivityLog((payload: RealtimePayload) => {
      handleActivityLogUpdate(payload)
    })
    
    // Subscribe to bills/orders
    realtimeService.subscribeToBills((payload: RealtimePayload) => {
      handleOrderActivity(payload)
    })
    
    // Subscribe to purchase orders
    realtimeService.subscribeToPurchaseOrders((payload: RealtimePayload) => {
      handlePurchaseOrderActivity(payload)
    })
  }, [])

  const loadInitialActivities = async () => {
    setIsLoading(true)
    try {
      // Generate mock activities based on user role
      const mockActivities = generateMockActivities(user?.role || 'demo')
      setActivities(mockActivities)
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransactionActivity = (payload: RealtimePayload) => {
    if (payload.eventType === 'INSERT') {
      const transaction = payload.new
      const activity: ActivityItem = {
        id: `transaction-${transaction.id}`,
        type: 'transaction',
        action: 'completed',
        description: `Completed ${transaction.device_type} ${transaction.repair_type}`,
        user_id: transaction.user_id || 'system',
        user_name: transaction.customer_name || 'Customer',
        user_role: 'customer',
        shop_id: transaction.shop_id,
        timestamp: new Date().toISOString(),
        metadata: {
          amount: transaction.repair_cost,
          status: transaction.status,
          priority: transaction.repair_cost > 500 ? 'high' : 'medium',
        },
      }
      
      if (isActivityForUser(activity)) {
        setActivities(prev => [activity, ...prev.slice(0, 49)]) // Keep last 50 activities
        
        // Log activity
        realtimeService.logActivity({
          action: 'transaction_completed',
          description: activity.description,
          metadata: activity.metadata,
        })
      }
    }
  }

  const handleInventoryActivity = (payload: RealtimePayload) => {
    if (payload.eventType === 'UPDATE') {
      const item = payload.new
      const oldItem = payload.old
      
      if (item.quantity !== oldItem?.quantity) {
        const activity: ActivityItem = {
          id: `inventory-${item.id}-${Date.now()}`,
          type: 'inventory',
          action: item.quantity > (oldItem?.quantity || 0) ? 'restocked' : 'used',
          description: `${item.part_name} quantity ${item.quantity > (oldItem?.quantity || 0) ? 'increased' : 'decreased'} to ${item.quantity}`,
          user_id: user?.id || 'system',
          user_name: user?.name || 'System',
          user_role: user?.role || 'system',
          shop_id: item.shop_id,
          timestamp: new Date().toISOString(),
          metadata: {
            item_name: item.part_name,
            quantity: item.quantity,
            priority: item.quantity <= 5 ? 'high' : 'low',
          },
        }
        
        if (isActivityForUser(activity)) {
          setActivities(prev => [activity, ...prev.slice(0, 49)])
        }
      }
    }
  }

  const handleActivityLogUpdate = (payload: RealtimePayload) => {
    if (payload.eventType === 'INSERT') {
      const logEntry = payload.new
      const activity: ActivityItem = {
        id: `activity-${logEntry.id}`,
        type: 'system',
        action: logEntry.action,
        description: logEntry.description,
        user_id: logEntry.user_id,
        user_name: logEntry.user_name || 'Unknown User',
        user_role: logEntry.user_role || 'user',
        shop_id: logEntry.shop_id,
        timestamp: logEntry.created_at,
        metadata: logEntry.metadata,
      }
      
      if (isActivityForUser(activity)) {
        setActivities(prev => [activity, ...prev.slice(0, 49)])
      }
    }
  }

  const handleOrderActivity = (payload: RealtimePayload) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const order = payload.new
      const activity: ActivityItem = {
        id: `order-${order.id}-${Date.now()}`,
        type: 'order',
        action: payload.eventType === 'INSERT' ? 'created' : 'updated',
        description: `Order #${order.id} ${payload.eventType === 'INSERT' ? 'created' : 'updated'}`,
        user_id: order.user_id || 'system',
        user_name: order.customer_name || 'Customer',
        user_role: 'customer',
        shop_id: order.shop_id,
        timestamp: new Date().toISOString(),
        metadata: {
          amount: order.total_amount,
          status: order.status,
          priority: 'medium',
        },
      }
      
      if (isActivityForUser(activity)) {
        setActivities(prev => [activity, ...prev.slice(0, 49)])
      }
    }
  }

  const handlePurchaseOrderActivity = (payload: RealtimePayload) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const po = payload.new
      const activity: ActivityItem = {
        id: `po-${po.id}-${Date.now()}`,
        type: 'order',
        action: payload.eventType === 'INSERT' ? 'purchase_created' : 'purchase_updated',
        description: `Purchase order #${po.id} ${payload.eventType === 'INSERT' ? 'created' : 'updated'}`,
        user_id: po.created_by || user?.id || 'system',
        user_name: user?.name || 'Staff',
        user_role: user?.role || 'staff',
        shop_id: po.shop_id,
        timestamp: new Date().toISOString(),
        metadata: {
          amount: po.total_amount,
          status: po.status,
          priority: 'medium',
        },
      }
      
      if (isActivityForUser(activity)) {
        setActivities(prev => [activity, ...prev.slice(0, 49)])
      }
    }
  }

  const isActivityForUser = (activity: ActivityItem): boolean => {
    const userRole = user?.role || 'demo'
    const userShopId = user?.shopId
    
    // Admin can see all activities
    if (userRole === 'admin') return true
    
    // Owner can see activities in their shop
    if (userRole === 'owner' && activity.shop_id === userShopId) return true
    
    // Worker can see activities in their shop (limited)
    if (userRole === 'worker' && activity.shop_id === userShopId) {
      return ['transaction', 'inventory', 'order'].includes(activity.type)
    }
    
    // Demo user sees limited activities
    if (userRole === 'demo') {
      return ['transaction', 'order'].includes(activity.type)
    }
    
    return false
  }

  const generateMockActivities = (role: string): ActivityItem[] => {
    const now = new Date()
    const activities: ActivityItem[] = []
    
    // Generate activities for the last 24 hours
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000) // Every 30 minutes
      
      const activityTypes = ['transaction', 'inventory', 'order', 'system']
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)] as ActivityItem['type']
      
      let activity: ActivityItem
      
      switch (type) {
        case 'transaction':
          activity = {
            id: `mock-transaction-${i}`,
            type: 'transaction',
            action: 'completed',
            description: `Completed iPhone ${12 + (i % 3)} screen repair`,
            user_id: `user-${i % 3}`,
            user_name: ['John Doe', 'Jane Smith', 'Mike Johnson'][i % 3],
            user_role: 'customer',
            timestamp: timestamp.toISOString(),
            metadata: {
              amount: 150 + (i * 25),
              status: 'completed',
              priority: i % 4 === 0 ? 'high' : 'medium',
            },
          }
          break
        
        case 'inventory':
          activity = {
            id: `mock-inventory-${i}`,
            type: 'inventory',
            action: i % 3 === 0 ? 'restocked' : 'used',
            description: `${['iPhone 12 Screen', 'iPhone 13 Battery', 'Samsung S21 Screen'][i % 3]} ${i % 3 === 0 ? 'restocked' : 'used'}`,
            user_id: user?.id || 'system',
            user_name: user?.name || 'System',
            user_role: user?.role || 'system',
            timestamp: timestamp.toISOString(),
            metadata: {
              item_name: ['iPhone 12 Screen', 'iPhone 13 Battery', 'Samsung S21 Screen'][i % 3],
              quantity: i % 3 === 0 ? 10 + i : Math.max(1, 15 - i),
              priority: (15 - i) <= 5 ? 'high' : 'low',
            },
          }
          break
        
        case 'order':
          activity = {
            id: `mock-order-${i}`,
            type: 'order',
            action: i % 2 === 0 ? 'created' : 'updated',
            description: `Order #${1000 + i} ${i % 2 === 0 ? 'created' : 'status updated'}`,
            user_id: `customer-${i % 4}`,
            user_name: ['Alice Brown', 'Bob Wilson', 'Carol Davis', 'David Lee'][i % 4],
            user_role: 'customer',
            timestamp: timestamp.toISOString(),
            metadata: {
              amount: 200 + (i * 30),
              status: ['pending', 'in_progress', 'completed'][i % 3],
              priority: 'medium',
            },
          }
          break
        
        default:
          activity = {
            id: `mock-system-${i}`,
            type: 'system',
            action: 'backup',
            description: 'System backup completed successfully',
            user_id: 'system',
            user_name: 'System',
            user_role: 'system',
            timestamp: timestamp.toISOString(),
            metadata: {
              priority: 'low',
            },
          }
      }
      
      if (isActivityForUser(activity)) {
        activities.push(activity)
      }
    }
    
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const getActivityIcon = (type: string, action: string) => {
    switch (type) {
      case 'transaction':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'inventory':
        return action === 'restocked' 
          ? <Package className="h-4 w-4 text-blue-600" />
          : <Package className="h-4 w-4 text-orange-600" />
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-purple-600" />
      case 'user':
        return <User className="h-4 w-4 text-indigo-600" />
      case 'system':
        return <Wrench className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityColor = (type: string, priority?: string) => {
    if (priority === 'high') return 'border-l-red-500'
    if (priority === 'medium') return 'border-l-yellow-500'
    
    switch (type) {
      case 'transaction':
        return 'border-l-green-500'
      case 'inventory':
        return 'border-l-blue-500'
      case 'order':
        return 'border-l-purple-500'
      case 'user':
        return 'border-l-indigo-500'
      default:
        return 'border-l-gray-500'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const filteredActivities = activities.filter(activity => {
    // Filter by type
    if (filters.type.length > 0 && !filters.type.includes(activity.type)) {
      return false
    }
    
    // Filter by time range
    const now = new Date()
    const activityTime = new Date(activity.timestamp)
    const diffHours = (now.getTime() - activityTime.getTime()) / (1000 * 60 * 60)
    
    switch (filters.timeRange) {
      case '1h':
        if (diffHours > 1) return false
        break
      case '6h':
        if (diffHours > 6) return false
        break
      case '24h':
        if (diffHours > 24) return false
        break
      case '7d':
        if (diffHours > 168) return false
        break
    }
    
    return true
  })

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Live Activity Feed</span>
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'text-green-600' : 'text-muted-foreground'}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={loadInitialActivities}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="h-3 w-3" />
          
          {/* Time Range Filter */}
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
          
          {/* Type Filters */}
          {['transaction', 'inventory', 'order', 'system'].map(type => (
            <Button
              key={type}
              variant={filters.type.includes(type) ? 'default' : 'ghost'}
              size="sm"
              className="h-6 text-xs capitalize"
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  type: prev.type.includes(type)
                    ? prev.type.filter(t => t !== type)
                    : [...prev.type, type]
                }))
              }}
            >
              {type}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {filteredActivities.length > 0 ? (
            <div className="space-y-1">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-3 border-l-4 hover:bg-muted/50 transition-colors ${
                    getActivityColor(activity.type, activity.metadata?.priority)
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type, activity.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">
                          {activity.description}
                        </p>
                        {activity.metadata?.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">
                            High Priority
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-xs">
                            {activity.user_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {activity.user_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {activity.user_role}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                        
                        {activity.metadata?.amount && (
                          <span className="text-xs font-medium text-green-600">
                            ${activity.metadata.amount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-xs mt-1">
                {!isConnected ? 'Waiting for connection...' : 'Activities will appear here in real-time'}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default LiveActivityFeed