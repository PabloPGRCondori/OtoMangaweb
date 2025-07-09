import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseclient';

// Hook centralizado para obtener y actualizar el usuario actual de Supabase
function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtiene el usuario y escucha cambios de sesión
  useEffect(() => {
    let timeout;
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
    if (!user) {
      timeout = setTimeout(getUser, 1200);
    }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription?.unsubscribe?.();
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line
  }, []);

  // Actualiza los metadatos del usuario
  const updateUser = useCallback(async (data) => {
    return await supabase.auth.updateUser({ data });
  }, []);

  // Cierra sesión
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('otomanga_logged');
    }
  }, []);

  return { user, loading, updateUser, logout };
}

export default useUser;
