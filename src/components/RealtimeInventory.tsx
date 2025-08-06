import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Progress } from './ui/progress'
import { 
  Package, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Edit, 
  Trash2,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  Bell,
  CheckCircle,
  XCircle
} from 'lucide-react'
import realtimeService from '../services/realtimeService'
import { useAuth } from '../contexts/AuthContext'
import { useRoleBasedAccess, FeatureGate } from './RoleBasedAccess'
import { REALTIME_EVENTS, RealtimePayload } from '../../supabase/config'
import { toast } from 'sonner'

interface InventoryItem {
  id: string
  part_name: string
  category: string
  quantity: number
  min_quantity: number
  max_quantity: number
  unit_price: number
  supplier: string
  location: string
  last_updated: string
  shop_id: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  usage_rate?: number // Items used per day
  reorder_point?: number
  last_restock_date?: string
}

interface InventoryAlert {
  id: string
  item_id: string
  item_name: string
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  created_at: string
  acknowledged: boolean
}

interface InventoryFilters {
  category: string
  status: string
  search: string
  sortBy: 'name' | 'quantity' | 'last_updated' | 'usage_rate'
  sortOrder: 'asc' | 'desc'
}

const RealtimeInventory: React.FC = () => {
  const { user } = useAuth()
  const { canAccessFeature, hasPermission } = useRoleBasedAccess()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<InventoryFilters>({
    category: '',
    status: '',
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showAlerts, setShowAlerts] = useState(true)

  // Initialize real-time inventory tracking
  useEffect(() => {
    if (user && canAccessFeature('inventory', 'view')) {
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
        loadInventoryData()
      })
      
      // Subscribe to real-time inventory updates
      subscribeToInventoryUpdates()
      
      // Load initial inventory data
      loadInventoryData()
    }
    
    return () => {
      realtimeService.cleanup()
    }
  }, [user, canAccessFeature])

  const subscribeToInventoryUpdates = useCallback(() => {
    realtimeService.subscribeToInventory((payload: RealtimePayload) => {
      console.log('Inventory update received:', payload)
      handleInventoryUpdate(payload)
    })
  }, [])

  const loadInventoryData = async () => {
    setIsLoading(true)
    try {
      // Generate mock inventory data based on user role
      const mockInventory = generateMockInventory(user?.role || 'demo')
      setInventory(mockInventory)
      
      // Generate alerts based on inventory
      const inventoryAlerts = generateInventoryAlerts(mockInventory)
      setAlerts(inventoryAlerts)
    } catch (error) {
      console.error('Failed to load inventory data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInventoryUpdate = (payload: RealtimePayload) => {
    const item = payload.new as InventoryItem
    const oldItem = payload.old as InventoryItem
    
    if (payload.eventType === 'INSERT') {
      setInventory(prev => [item, ...prev])
      
      // Show notification for new items
      if (canAccessFeature('inventory', 'receiveAlerts')) {
        toast.success('New Item Added', {
          description: `${item.part_name} has been added to inventory`,
        })
      }
    } else if (payload.eventType === 'UPDATE') {
      setInventory(prev => 
        prev.map(invItem => invItem.id === item.id ? item : invItem)
      )
      
      // Check for quantity changes and create alerts
      if (oldItem && item.quantity !== oldItem.quantity) {
        handleQuantityChange(item, oldItem)
      }
      
      // Update selected item if it's the one being updated
      if (selectedItem?.id === item.id) {
        setSelectedItem(item)
      }
    } else if (payload.eventType === 'DELETE') {
      const deletedId = payload.old?.id
      setInventory(prev => prev.filter(item => item.id !== deletedId))
      
      if (selectedItem?.id === deletedId) {
        setSelectedItem(null)
      }
    }
  }

  const handleQuantityChange = (newItem: InventoryItem, oldItem: InventoryItem) => {
    const quantityDiff = newItem.quantity - oldItem.quantity
    const isIncrease = quantityDiff > 0
    
    // Create activity log
    realtimeService.logActivity({
      action: isIncrease ? 'inventory_restocked' : 'inventory_used',
      description: `${newItem.part_name} quantity ${isIncrease ? 'increased' : 'decreased'} by ${Math.abs(quantityDiff)}`,
      metadata: {
        item_id: newItem.id,
        item_name: newItem.part_name,
        old_quantity: oldItem.quantity,
        new_quantity: newItem.quantity,
        change: quantityDiff,
      },
    })
    
    // Check for low stock alerts
    if (newItem.quantity <= newItem.min_quantity && canAccessFeature('inventory', 'receiveAlerts')) {
      const alertType = newItem.quantity === 0 ? 'out_of_stock' : 'low_stock'
      const severity = newItem.quantity === 0 ? 'critical' : 'high'
      
      const alert: InventoryAlert = {
        id: `alert-${newItem.id}-${Date.now()}`,
        item_id: newItem.id,
        item_name: newItem.part_name,
        type: alertType,
        severity,
        message: newItem.quantity === 0 
          ? `${newItem.part_name} is out of stock!`
          : `${newItem.part_name} is running low (${newItem.quantity} remaining)`,
        created_at: new Date().toISOString(),
        acknowledged: false,
      }
      
      setAlerts(prev => [alert, ...prev])
      
      // Show toast notification
      const toastFn = severity === 'critical' ? toast.error : toast.warning
      toastFn(alert.type === 'out_of_stock' ? 'Out of Stock!' : 'Low Stock Alert', {
        description: alert.message,
        duration: severity === 'critical' ? 10000 : 5000,
      })
      
      // Create system notification
      realtimeService.createNotification({
        title: alert.type === 'out_of_stock' ? 'Out of Stock Alert' : 'Low Stock Alert',
        message: alert.message,
        type: severity === 'critical' ? 'error' : 'warning',
        priority: severity === 'critical' ? 'urgent' : 'high',
        user_id: user?.id,
      })
    }
  }

  const generateMockInventory = (role: string): InventoryItem[] => {
    const baseItems: InventoryItem[] = [
      {
        id: '1',
        part_name: 'iPhone 12 Screen',
        category: 'Screens',
        quantity: 15,
        min_quantity: 5,
        max_quantity: 50,
        unit_price: 89.99,
        supplier: 'TechParts Inc',
        location: 'Shelf A1',
        last_updated: new Date().toISOString(),
        shop_id: user?.shopId || 'default',
        status: 'in_stock',
        usage_rate: 2.5,
        reorder_point: 8,
        last_restock_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        part_name: 'iPhone 13 Battery',
        category: 'Batteries',
        quantity: 3,
        min_quantity: 5,
        max_quantity: 30,
        unit_price: 45.99,
        supplier: 'PowerCell Co',
        location: 'Shelf B2',
        last_updated: new Date().toISOString(),
        shop_id: user?.shopId || 'default',
        status: 'low_stock',
        usage_rate: 1.8,
        reorder_point: 6,
        last_restock_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        part_name: 'Samsung S21 Screen',
        category: 'Screens',
        quantity: 0,
        min_quantity: 3,
        max_quantity: 25,
        unit_price: 95.99,
        supplier: 'Samsung Parts',
        location: 'Shelf A2',
        last_updated: new Date().toISOString(),
        shop_id: user?.shopId || 'default',
        status: 'out_of_stock',
        usage_rate: 1.2,
        reorder_point: 4,
        last_restock_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        part_name: 'Universal Charger Cable',
        category: 'Accessories',
        quantity: 25,
        min_quantity: 10,
        max_quantity: 100,
        unit_price: 12.99,
        supplier: 'Cable World',
        location: 'Shelf C1',
        last_updated: new Date().toISOString(),
        shop_id: user?.shopId || 'default',
        status: 'in_stock',
        usage_rate: 3.2,
        reorder_point: 15,
        last_restock_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        part_name: 'Phone Case - Clear',
        category: 'Accessories',
        quantity: 45,
        min_quantity: 20,
        max_quantity: 200,
        unit_price: 8.99,
        supplier: 'Case Masters',
        location: 'Shelf C2',
        last_updated: new Date().toISOString(),
        shop_id: user?.shopId || 'default',
        status: 'in_stock',
        usage_rate: 4.1,
        reorder_point: 25,
        last_restock_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
    
    // Filter items based on role
    if (role === 'demo') {
      return baseItems.slice(0, 3)
    }
    
    return baseItems
  }

  const generateInventoryAlerts = (items: InventoryItem[]): InventoryAlert[] => {
    const alerts: InventoryAlert[] = []
    
    items.forEach(item => {
      if (item.quantity === 0) {
        alerts.push({
          id: `alert-${item.id}-out`,
          item_id: item.id,
          item_name: item.part_name,
          type: 'out_of_stock',
          severity: 'critical',
          message: `${item.part_name} is completely out of stock!`,
          created_at: new Date().toISOString(),
          acknowledged: false,
        })
      } else if (item.quantity <= item.min_quantity) {
        alerts.push({
          id: `alert-${item.id}-low`,
          item_id: item.id,
          item_name: item.part_name,
          type: 'low_stock',
          severity: 'high',
          message: `${item.part_name} is running low (${item.quantity} remaining)`,
          created_at: new Date().toISOString(),
          acknowledged: false,
        })
      }
    })
    
    return alerts
  }

  const updateItemQuantity = async (itemId: string, change: number) => {
    if (!canAccessFeature('inventory', 'manage')) {
      toast.error('Access Denied', {
        description: 'You do not have permission to modify inventory',
      })
      return
    }
    
    try {
      setInventory(prev => 
        prev.map(item => {
          if (item.id === itemId) {
            const newQuantity = Math.max(0, item.quantity + change)
            return {
              ...item,
              quantity: newQuantity,
              last_updated: new Date().toISOString(),
              status: newQuantity === 0 ? 'out_of_stock' : 
                     newQuantity <= item.min_quantity ? 'low_stock' : 'in_stock'
            }
          }
          return item
        })
      )
      
      // In a real app, this would update the database
      console.log(`Updated item ${itemId} quantity by ${change}`)
    } catch (error) {
      console.error('Failed to update item quantity:', error)
      toast.error('Update Failed', {
        description: 'Failed to update item quantity',
      })
    }
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    )
  }

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-500'
      case 'low_stock':
        return 'bg-yellow-500'
      case 'out_of_stock':
        return 'bg-red-500'
      case 'discontinued':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50'
      case 'high':
        return 'border-orange-500 bg-orange-50'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50'
      case 'low':
        return 'border-blue-500 bg-blue-50'
      default:
        return 'border-gray-500 bg-gray-50'
    }
  }

  const filteredInventory = inventory.filter(item => {
    if (filters.search && !item.part_name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.category && item.category !== filters.category) {
      return false
    }
    if (filters.status && item.status !== filters.status) {
      return false
    }
    return true
  }).sort((a, b) => {
    const aValue = a[filters.sortBy] || ''
    const bValue = b[filters.sortBy] || ''
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return filters.sortOrder === 'asc' ? comparison : -comparison
  })

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged)
  const categories = [...new Set(inventory.map(item => item.category))]

  if (!canAccessFeature('inventory', 'view')) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            You don't have permission to view inventory data.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <Package className="h-8 w-8" />
            <span>Real-Time Inventory</span>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
          </h1>
          <p className="text-muted-foreground">
            Live inventory tracking with automated alerts
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={showAlerts ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-2" />
            Alerts
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedAlerts.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Alerts Panel */}
      {showAlerts && unacknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Active Alerts ({unacknowledgedAlerts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unacknowledgedAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 border-l-4 rounded ${getAlertSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="border rounded px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border rounded px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters(prev => ({ 
                  ...prev, 
                  sortBy: sortBy as any, 
                  sortOrder: sortOrder as any 
                }))
              }}
              className="border rounded px-3 py-2"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="quantity-asc">Quantity Low-High</option>
              <option value="quantity-desc">Quantity High-Low</option>
              <option value="last_updated-desc">Recently Updated</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInventory.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{item.part_name}</CardTitle>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
              </div>
              <Badge variant="outline" className="w-fit">
                {item.category}
              </Badge>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Quantity Display */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Quantity</span>
                    <span className={`text-lg font-bold ${
                      item.quantity === 0 ? 'text-red-500' :
                      item.quantity <= item.min_quantity ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {item.quantity}
                    </span>
                  </div>
                  <Progress 
                    value={(item.quantity / item.max_quantity) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Min: {item.min_quantity}</span>
                    <span>Max: {item.max_quantity}</span>
                  </div>
                </div>
                
                {/* Item Details */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium">${item.unit_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{item.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span>{item.supplier}</span>
                  </div>
                  {item.usage_rate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Usage Rate:</span>
                      <span>{item.usage_rate}/day</span>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <FeatureGate feature="inventory" action="manage">
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.id, -1)}
                        disabled={item.quantity === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </FeatureGate>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredInventory.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Items Found</h3>
            <p className="text-muted-foreground">
              {filters.search || filters.category || filters.status
                ? 'Try adjusting your filters'
                : 'No inventory items available'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RealtimeInventory