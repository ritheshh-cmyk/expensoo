import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import realtimeService, { REALTIME_EVENTS, RealtimePayload } from '../services/realtimeService';

interface RealtimeOptions {
  enableNotifications?: boolean;
  enableActivityLog?: boolean;
  enableDashboardUpdates?: boolean;
  onConnectionChange?: (isConnected: boolean) => void;
}

interface RealtimeState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastActivity: Date | null;
  connectionStatus: string;
}

/**
 * Real-time integration hook for connecting frontend components to backend WebSocket
 * Provides live updates for transactions, dashboard metrics, and notifications
 */
export const useRealtime = (options: RealtimeOptions = {}) => {
  const {
    enableNotifications = true,
    enableActivityLog = false,
    enableDashboardUpdates = true,
    onConnectionChange
  } = options;

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    reconnectAttempts: 0,
    lastActivity: null,
    connectionStatus: 'connecting'
  });

  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);

  // Handle connection state changes
  const handleConnectionEstablished = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: true,
      connectionStatus: 'connected',
      lastActivity: new Date()
    }));
    
    if (enableNotifications) {
      toast.success('🔄 Real-time connection established');
    }
    
    onConnectionChange?.(true);
  }, [enableNotifications, onConnectionChange]);

  const handleConnectionLost = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionStatus: 'disconnected'
    }));
    
    if (enableNotifications) {
      toast.warning('⚠️ Real-time connection lost');
    }
    
    onConnectionChange?.(false);
  }, [enableNotifications, onConnectionChange]);

  const handleConnectionRestored = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: true,
      connectionStatus: 'connected',
      lastActivity: new Date()
    }));
    
    if (enableNotifications) {
      toast.success('✅ Real-time connection restored');
    }
    
    onConnectionChange?.(true);
  }, [enableNotifications, onConnectionChange]);

  // Handle real-time transaction updates
  const handleTransactionUpdate = useCallback((payload: RealtimePayload) => {
    setState(prev => ({
      ...prev,
      lastActivity: new Date()
    }));
    
    if (enableNotifications) {
      const action = payload.eventType.split(':')[1]; // 'created', 'updated', 'deleted'
      toast.success(`📱 Transaction ${action}`, {
        description: `Customer: ${payload.data?.customerName || 'Unknown'}`
      });
    }
  }, [enableNotifications]);

  // Handle real-time dashboard updates
  const handleDashboardUpdate = useCallback((payload: RealtimePayload) => {
    if (enableDashboardUpdates) {
      setDashboardMetrics(payload.data);
      setState(prev => ({
        ...prev,
        lastActivity: new Date()
      }));
    }
  }, [enableDashboardUpdates]);

  // Handle dashboard metrics specifically
  const handleDashboardMetrics = useCallback((data: any) => {
    if (enableDashboardUpdates) {
      setDashboardMetrics(data);
      setState(prev => ({
        ...prev,
        lastActivity: new Date()
      }));
      
      console.log('📊 Real-time dashboard metrics updated:', data);
    }
  }, [enableDashboardUpdates]);

  // Handle notifications
  const handleNotification = useCallback((payload: RealtimePayload) => {
    if (enableNotifications) {
      setNotifications(prev => [payload.data, ...prev.slice(0, 49)]); // Keep last 50
      
      // Show toast notification
      const { title, message, type } = payload.data;
      const toastType = type === 'error' ? 'error' : 
                       type === 'warning' ? 'warning' : 
                       type === 'success' ? 'success' : 'info';
      
      toast[toastType](title, {
        description: message,
        duration: type === 'error' ? 10000 : 5000
      });
    }
  }, [enableNotifications]);

  // Handle activity log
  const handleActivityLog = useCallback((payload: RealtimePayload) => {
    if (enableActivityLog) {
      setActivityLog(prev => [payload.data, ...prev.slice(0, 99)]); // Keep last 100
      setState(prev => ({
        ...prev,
        lastActivity: new Date()
      }));
    }
  }, [enableActivityLog]);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('🔌 Setting up real-time subscriptions...');

    // Connection events
    const unsubscribeConnected = realtimeService.subscribeToEvent('connection:established', handleConnectionEstablished);
    const unsubscribeDisconnected = realtimeService.subscribeToEvent('connection:lost', handleConnectionLost);
    const unsubscribeRestored = realtimeService.subscribeToEvent('connection:restored', handleConnectionRestored);

    // Business logic events
    const unsubscribeTransactions = realtimeService.subscribeToEvent(REALTIME_EVENTS.TRANSACTION_CREATED, handleTransactionUpdate);
    const unsubscribeTransactionUpdated = realtimeService.subscribeToEvent(REALTIME_EVENTS.TRANSACTION_UPDATED, handleTransactionUpdate);
    const unsubscribeTransactionDeleted = realtimeService.subscribeToEvent(REALTIME_EVENTS.TRANSACTION_DELETED, handleTransactionUpdate);
    
    // Dashboard updates
    let unsubscribeDashboard, unsubscribeDashboardMetrics;
    if (enableDashboardUpdates) {
      unsubscribeDashboard = realtimeService.subscribeToEvent(REALTIME_EVENTS.DASHBOARD_UPDATED, handleDashboardUpdate);
      unsubscribeDashboardMetrics = realtimeService.subscribeToEvent('dashboard:metrics', handleDashboardMetrics);
    }
    
    // Notifications
    let unsubscribeNotifications;
    if (enableNotifications) {
      unsubscribeNotifications = realtimeService.subscribeToEvent(REALTIME_EVENTS.NOTIFICATION_CREATED, handleNotification);
    }
    
    // Activity log
    let unsubscribeActivityLog;
    if (enableActivityLog) {
      unsubscribeActivityLog = realtimeService.subscribeToEvent(REALTIME_EVENTS.ACTIVITY_LOGGED, handleActivityLog);
    }

    // Set initial connection status
    const status = realtimeService.getConnectionStatus();
    setState(prev => ({
      ...prev,
      isConnected: status.websocket,
      reconnectAttempts: status.reconnectAttempts,
      connectionStatus: status.websocket ? 'connected' : 'connecting'
    }));

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions...');
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeRestored();
      unsubscribeTransactions();
      unsubscribeTransactionUpdated();
      unsubscribeTransactionDeleted();
      
      if (unsubscribeDashboard) unsubscribeDashboard();
      if (unsubscribeDashboardMetrics) unsubscribeDashboardMetrics();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeActivityLog) unsubscribeActivityLog();
    };
  }, [
    enableNotifications, 
    enableActivityLog, 
    enableDashboardUpdates,
    handleConnectionEstablished,
    handleConnectionLost,
    handleConnectionRestored,
    handleTransactionUpdate,
    handleDashboardUpdate,
    handleDashboardMetrics,
    handleNotification,
    handleActivityLog
  ]);

  // Methods for components to interact with real-time service
  const sendNotification = useCallback((notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }) => {
    realtimeService.createNotification({
      ...notification,
      read: false
    });
  }, []);

  const logActivity = useCallback((activity: {
    action: string;
    description: string;
    metadata?: any;
  }) => {
    realtimeService.logActivity({
      ...activity,
      user_id: 0 // Will be set by the service with actual user ID
    });
  }, []);

  const setUserContext = useCallback((userId: number, userRole: string, shopId?: string) => {
    realtimeService.setUserContext(userId, userRole, shopId);
  }, []);

  const requestMetrics = useCallback(() => {
    realtimeService.getRealtimeMetrics();
  }, []);

  return {
    // State
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    lastActivity: state.lastActivity,
    reconnectAttempts: state.reconnectAttempts,
    
    // Data
    dashboardMetrics,
    notifications,
    activityLog,
    
    // Methods
    sendNotification,
    logActivity,
    setUserContext,
    requestMetrics,
    
    // Connection info
    connectionInfo: realtimeService.getConnectionStatus()
  };
};

export default useRealtime;
