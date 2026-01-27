import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth.store";

export function useAuth() {
  const { user, token, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage or validate token
    setLoading(false);
  }, []);

  return { user, token, setAuth, logout, loading };
}
