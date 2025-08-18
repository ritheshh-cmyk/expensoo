import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Activity, DollarSign, Package, Users, AlertTriangle, TrendingUp, Bell, Wifi, WifiOff } from 'lucide-react'
import realtimeService from '../services/realtimeService'
import { useAuth } from '../contexts/AuthContext'
import { REALTIME_EVENTS, RealtimePayload } from '../../supabase/config'

interface DashboardMetrics {
  totalRevenue: number
  todayRevenue: number
  totalProfit: number
  todayProfit: number
  totalTransactions: number
  todayTransactions: number
  inventoryItems: number
  lowStockItems: number
  activeUsers: number
  pendingOrders: number
  revenueGrowth: number
  transactionGrowth: number
  profitGrowth: number
}

interface ChartData {
  name: string
  value: number
  revenue?: number
  transactions?: number
  timestamp?: string
}

const RealtimeDashboard: React.FC = () => {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    todayRevenue: 0,
    totalProfit: 0,
    todayProfit: 0,
    totalTransactions: 0,
    todayTransactions: 0,
    inventoryItems: 0,
    lowStockItems: 0,
    activeUsers: 0,
    pendingOrders: 0,
    revenueGrowth: 0,
    transactionGrowth: 0,
    profitGrowth: 0,
  })
  
  const [revenueData, setRevenueData] = useState<ChartData[]>([])
  const [transactionData, setTransactionData] = useState<ChartData[]>([])
  const [categoryData, setCategoryData] = useState<ChartData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [notifications, setNotifications] = useState<any[]>([])

  // Initialize real-time connections
  useEffect(() => {
    if (user) {
      // Set user context for role-based filtering
      realtimeService.setUserContext(user.id, user.role, user.shopId || 'default')
      
      // Subscribe to connection status
      realtimeService.subscribeToEvent('connection:established', () => {
        setIsConnected(true)
        console.log('Dashboard: Real-time connection established')
      })
      
      realtimeService.subscribeToEvent('connection:lost', () => {
        setIsConnected(false)
        console.log('Dashboard: Real-time connection lost')
      })
      
      realtimeService.subscribeToEvent('connection:restored', () => {
        setIsConnected(true)
        console.log('Dashboard: Real-time connection restored')
      })
      
      // Subscribe to real-time data updates
      subscribeToRealtimeUpdates()
      
      // Load initial data
      loadInitialData()
      
      // Set user as online
      realtimeService.setUserOnline()
    }
    
    return () => {
      realtimeService.cleanup()
    }
  }, [user])

  const subscribeToRealtimeUpdates = useCallback(() => {
    // Subscribe to transactions
    realtimeService.subscribeToTransactions((payload: RealtimePayload) => {
      console.log('Transaction update:', payload)
      handleTransactionUpdate(payload)
    })
    
    // Subscribe to inventory updates
    realtimeService.subscribeToInventory((payload: RealtimePayload) => {
      console.log('Inventory update:', payload)
      handleInventoryUpdate(payload)
    })
    
    // Subscribe to notifications
    realtimeService.subscribeToNotifications((payload: RealtimePayload) => {
      console.log('Notification update:', payload)
      handleNotificationUpdate(payload)
    })
    
    // Subscribe to activity log
    realtimeService.subscribeToActivityLog((payload: RealtimePayload) => {
      console.log('Activity update:', payload)
      handleActivityUpdate(payload)
    })
  }, [])

  const loadInitialData = async () => {
    try {
      // Generate mock data based on user role
      const mockMetrics = generateMockMetrics(user?.role || 'demo')
      setMetrics(mockMetrics)
      
      // Generate mock chart data
      setRevenueData(generateRevenueData())
      setTransactionData(generateTransactionData())
      setCategoryData(generateCategoryData())
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  const handleTransactionUpdate = (payload: RealtimePayload) => {
    const transaction = payload.new
    
    if (payload.eventType === 'INSERT') {
      // Calculate profit for the new transaction
      const revenue = transaction.amount_given || 0
      const profit = transaction.profit || 0
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        todayTransactions: prev.todayTransactions + 1,
        totalRevenue: prev.totalRevenue + revenue,
        todayRevenue: prev.todayRevenue + revenue,
        totalProfit: prev.totalProfit + profit,
        todayProfit: prev.todayProfit + profit,
      }))
      
      // Update chart data
      const now = new Date()
      const timeLabel = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
      
      setRevenueData(prev => [
        ...prev.slice(-23), // Keep last 24 hours
        {
          name: timeLabel,
          value: transaction.repair_cost || 0,
          timestamp: now.toISOString(),
        }
      ])
      
      // Create notification for high-value transactions
      if (transaction.repair_cost > 1000) {
        realtimeService.createNotification({
          title: 'High-Value Transaction',
          message: `New transaction of $${transaction.repair_cost} completed`,
          type: 'success',
          priority: 'high',
          user_id: user?.id,
        })
      }
    }
    
    setLastUpdate(new Date())
  }

  const handleInventoryUpdate = (payload: RealtimePayload) => {
    const item = payload.new
    
    if (payload.eventType === 'UPDATE' && item.quantity <= 5) {
      // Low stock alert
      setMetrics(prev => ({
        ...prev,
        lowStockItems: prev.lowStockItems + 1,
      }))
      
      realtimeService.createNotification({
        title: 'Low Stock Alert',
        message: `${item.part_name} is running low (${item.quantity} remaining)`,
        type: 'warning',
        priority: 'high',
        user_id: user?.id,
      })
    }
    
    setLastUpdate(new Date())
  }

  const handleNotificationUpdate = (payload: RealtimePayload) => {
    if (payload.eventType === 'INSERT') {
      setNotifications(prev => [payload.new, ...prev.slice(0, 4)])
    }
  }

  const handleActivityUpdate = (payload: RealtimePayload) => {
    // Log activity for admin users
    if (user?.role === 'admin') {
      console.log('Activity logged:', payload.new)
    }
  }

  const generateMockMetrics = (role: string): DashboardMetrics => {
    const baseMetrics = {
      totalRevenue: Math.floor(Math.random() * 50000) + 10000,
      todayRevenue: Math.floor(Math.random() * 2000) + 500,
      totalTransactions: Math.floor(Math.random() * 1000) + 200,
      todayTransactions: Math.floor(Math.random() * 50) + 10,
      inventoryItems: Math.floor(Math.random() * 200) + 50,
      lowStockItems: Math.floor(Math.random() * 10) + 2,
      activeUsers: Math.floor(Math.random() * 20) + 5,
      pendingOrders: Math.floor(Math.random() * 15) + 3,
      revenueGrowth: Math.floor(Math.random() * 30) + 5,
      transactionGrowth: Math.floor(Math.random() * 25) + 3,
    }
    
    // Adjust metrics based on role
    if (role === 'demo') {
      return {
        ...baseMetrics,
        totalRevenue: 25000,
        todayRevenue: 1200,
        totalTransactions: 450,
        todayTransactions: 25,
      }
    }
    
    return baseMetrics
  }

  const generateRevenueData = (): ChartData[] => {
    const data = []
    const now = new Date()
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      data.push({
        name: `${time.getHours()}:00`,
        value: Math.floor(Math.random() * 500) + 100,
        timestamp: time.toISOString(),
      })
    }
    
    return data
  }

  const generateTransactionData = (): ChartData[] => {
    const data = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        transactions: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 2000) + 500,
      })
    }
    
    return data
  }

  const generateCategoryData = (): ChartData[] => {
    return [
      { name: 'Screen Repair', value: 45 },
      { name: 'Battery Replace', value: 25 },
      { name: 'Water Damage', value: 15 },
      { name: 'Software Issue', value: 10 },
      { name: 'Other', value: 5 },
    ]
  }

  const getVisibleMetrics = () => {
    const role = user?.role || 'demo'
    
    switch (role) {
      case 'admin':
        return ['revenue', 'transactions', 'inventory', 'users', 'orders', 'alerts']
      case 'owner':
        return ['revenue', 'transactions', 'inventory', 'orders']
      case 'worker':
        return ['transactions', 'inventory', 'orders']
      case 'demo':
        return ['revenue', 'transactions']
      default:
        return ['transactions']
    }
  }

  const visibleMetrics = getVisibleMetrics()
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Dashboard</h1>
          <p className="text-muted-foreground">
            Live business metrics and analytics for {user?.role || 'demo'} users
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? 'default' : 'destructive'} className="flex items-center space-x-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {visibleMetrics.includes('revenue') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${typeof metrics.totalRevenue === 'number' ? metrics.totalRevenue.toLocaleString() : '0'}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{metrics.revenueGrowth || 0}%</span> from last month
              </p>
              <div className="text-sm text-muted-foreground mt-1">
                Today: ${typeof metrics.todayRevenue === 'number' ? metrics.todayRevenue.toLocaleString() : '0'}
              </div>
            </CardContent>
          </Card>
        )}

        {visibleMetrics.includes('transactions') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{typeof metrics.totalTransactions === 'number' ? metrics.totalTransactions.toLocaleString() : '0'}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{metrics.transactionGrowth}%</span> from last month
              </p>
              <div className="text-sm text-muted-foreground mt-1">
                Today: {metrics.todayTransactions}
              </div>
            </CardContent>
          </Card>
        )}

        {visibleMetrics.includes('inventory') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.inventoryItems}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">{metrics.lowStockItems}</span> low stock items
              </p>
              <Progress value={(metrics.inventoryItems - metrics.lowStockItems) / metrics.inventoryItems * 100} className="mt-2" />
            </CardContent>
          </Card>
        )}

        {visibleMetrics.includes('users') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                Online now
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Chart */}
        {visibleMetrics.includes('revenue') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Revenue Trend (24h)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Transaction Chart */}
        {visibleMetrics.includes('transactions') && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="transactions" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Category Distribution and Notifications */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Category Distribution */}
        {(visibleMetrics.includes('revenue') || visibleMetrics.includes('transactions')) && (
          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Recent Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-4 w-4 mt-1 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent notifications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RealtimeDashboard