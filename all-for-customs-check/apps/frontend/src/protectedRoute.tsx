// ProtectedRoute component for authenticated access
import { useEffect, useState } from 'react';
import { isAuthenticated, login } from './auth';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    isAuthenticated().then(setAuth);
  }, []);

  if (auth === null) return <div>Loading...</div>;
  if (!auth) {
    login();
    return <div>Redirecting to login...</div>;
  }
  return children;
}
