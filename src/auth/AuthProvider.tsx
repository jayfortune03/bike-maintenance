import { useEffect, useSyncExternalStore, type PropsWithChildren } from 'react';
import { authSession } from './runtime';

export function AuthProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    void authSession.initialize();
  }, []);
  return children;
}

export function useAuthSnapshot() {
  return useSyncExternalStore(authSession.subscribe, authSession.getSnapshot, authSession.getSnapshot);
}
