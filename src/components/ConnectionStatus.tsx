import { useConnection } from '@/contexts/ConnectionContext';

export function ConnectionStatus() {
  const { isOnline } = useConnection();
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
} 