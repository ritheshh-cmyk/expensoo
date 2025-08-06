import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'
import realtimeService from '../services/realtimeService'
import { useAuth } from '../contexts/AuthContext'
import { REALTIME_EVENTS, RealtimePayload } from '../../supabase/config'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  user_id: string
  shop_id?: string
  read: boolean
  created_at: string
  expires_at?: string
  action_url?: string
  metadata?: Record<string, any>
}

interface NotificationFilters {
  type: string[]
  priority: string[]
  read: boolean | null
}

const RealtimeNotifications: React.FC = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<NotificationFilters>({
    type: [],
    priority: [],
    read: null,
  })
  const [isConnected, setIsConnected] = useState(false)

  // Initialize real-time notifications
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
      
      // Subscribe to real-time notifications
      subscribeToNotifications()
      
      // Load initial notifications
      loadInitialNotifications()
    }
    
    return () => {
      realtimeService.cleanup()
    }
  }, [user])

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  const subscribeToNotifications = useCallback(() => {
    realtimeService.subscribeToNotifications((payload: RealtimePayload) => {
      console.log('Notification received:', payload)
      
      if (payload.eventType === 'INSERT') {
        const newNotification = payload.new as Notification
        
        // Check if notification is for current user or role
        if (isNotificationForUser(newNotification)) {
          setNotifications(prev => [newNotification, ...prev])
          
          // Show toast notification for high priority items
          if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
            showToastNotification(newNotification)
          }
          
          // Play notification sound for urgent items
          if (newNotification.priority === 'urgent') {
            playNotificationSound()
          }
        }
      } else if (payload.eventType === 'UPDATE') {
        const updatedNotification = payload.new as Notification
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        )
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old?.id
        setNotifications(prev => prev.filter(n => n.id !== deletedId))
      }
    })
  }, [user])

  const loadInitialNotifications = async () => {
    try {
      // Generate mock notifications based on user role
      const mockNotifications = generateMockNotifications(user?.role || 'demo')
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const isNotificationForUser = (notification: Notification): boolean => {
    // Check if notification is for current user
    if (notification.user_id === user?.id) return true
    
    // Check if notification is for user's shop
    if (notification.shop_id === user?.shopId) return true
    
    // Check role-based notifications
    const userRole = user?.role || 'demo'
    const notificationMetadata = notification.metadata || {}
    
    if (notificationMetadata.roles && Array.isArray(notificationMetadata.roles)) {
      return notificationMetadata.roles.includes(userRole)
    }
    
    return false
  }

  const showToastNotification = (notification: Notification) => {
    const toastOptions = {
      duration: notification.priority === 'urgent' ? 10000 : 5000,
    }
    
    switch (notification.type) {
      case 'success':
        toast.success(notification.title, {
          description: notification.message,
          ...toastOptions,
        })
        break
      case 'warning':
        toast.warning(notification.title, {
          description: notification.message,
          ...toastOptions,
        })
        break
      case 'error':
        toast.error(notification.title, {
          description: notification.message,
          ...toastOptions,
        })
        break
      default:
        toast.info(notification.title, {
          description: notification.message,
          ...toastOptions,
        })
    }
  }

  const playNotificationSound = () => {
    // Create a simple notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      
      // In a real app, this would update the database
      console.log('Marking notification as read:', notificationId)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      console.log('Marking all notifications as read')
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      console.log('Deleting notification:', notificationId)
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const generateMockNotifications = (role: string): Notification[] => {
    const baseNotifications: Notification[] = [
      {
        id: '1',
        title: 'New Transaction Completed',
        message: 'iPhone 12 screen repair completed successfully',
        type: 'success',
        priority: 'medium',
        user_id: user?.id || '',
        read: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        title: 'Low Stock Alert',
        message: 'iPhone 13 screens are running low (3 remaining)',
        type: 'warning',
        priority: 'high',
        user_id: user?.id || '',
        read: false,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        title: 'Daily Report Ready',
        message: 'Your daily sales report is now available',
        type: 'info',
        priority: 'low',
        user_id: user?.id || '',
        read: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ]
    
    // Add role-specific notifications
    if (role === 'admin') {
      baseNotifications.unshift({
        id: '4',
        title: 'System Backup Completed',
        message: 'Daily system backup completed successfully',
        type: 'success',
        priority: 'low',
        user_id: user?.id || '',
        read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        metadata: { roles: ['admin'] },
      })
    }
    
    if (role === 'owner' || role === 'admin') {
      baseNotifications.unshift({
        id: '5',
        title: 'Monthly Revenue Target',
        message: 'You\'ve reached 85% of your monthly revenue target',
        type: 'info',
        priority: 'medium',
        user_id: user?.id || '',
        read: false,
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        metadata: { roles: ['owner', 'admin'] },
      })
    }
    
    return baseNotifications
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filters.type.length > 0 && !filters.type.includes(notification.type)) {
      return false
    }
    if (filters.priority.length > 0 && !filters.priority.includes(notification.priority)) {
      return false
    }
    if (filters.read !== null && notification.read !== filters.read) {
      return false
    }
    return true
  })

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={`h-5 w-5 ${isConnected ? 'text-foreground' : 'text-muted-foreground'}`} />
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 shadow-lg border z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
                {!isConnected && (
                  <Badge variant="outline" className="text-xs">
                    Offline
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Quick Filters */}
            <div className="flex items-center space-x-2 text-xs">
              <Filter className="h-3 w-3" />
              <Button
                variant={filters.read === false ? 'default' : 'ghost'}
                size="sm"
                className="h-6 text-xs"
                onClick={() => setFilters(prev => ({ ...prev, read: prev.read === false ? null : false }))}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filters.priority.includes('high') || filters.priority.includes('urgent') ? 'default' : 'ghost'}
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  const hasHighPriority = filters.priority.includes('high') || filters.priority.includes('urgent')
                  setFilters(prev => ({
                    ...prev,
                    priority: hasHighPriority ? [] : ['high', 'urgent']
                  }))
                }}
              >
                High Priority
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {filteredNotifications.length > 0 ? (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className={`text-sm font-medium truncate ${
                              !notification.read ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </p>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(notification.created_at).toLocaleTimeString()}
                            </span>
                            
                            <div className="flex items-center space-x-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                  <p className="text-xs mt-1">
                    {filters.read !== null || filters.type.length > 0 || filters.priority.length > 0
                      ? 'Try adjusting your filters'
                      : 'You\'re all caught up!'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RealtimeNotifications