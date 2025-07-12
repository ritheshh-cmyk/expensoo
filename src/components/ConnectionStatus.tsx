import React from 'react';
import { useConnection } from '@/contexts/ConnectionContext';

export default function ConnectionStatus() {
  const { isOnline } = useConnection();

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          marginRight: 8,
          background: isOnline ? '#4caf50' : '#f44336',
        }}
      />
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
} 