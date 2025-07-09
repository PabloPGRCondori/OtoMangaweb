import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import useUser from "../lib/useUser";

// Lazy loading del Navbar
const Navbar = dynamic(() => import("@/components/Navbar"), {
  loading: () => <div style={{ height: '64px', background: 'linear-gradient(90deg, #b71c1c 0%, #eabf9f 100%)' }} />,
  ssr: true
});

// Cache global para APIs
const apiCache = new Map();
const cacheTimeout = 5 * 60 * 1000; // 5 minutos

// Función de fetch optimizada con cache y retry
export const fetchWithCache = async (url, options = {}, retries = 3) => {
  const cacheKey = `${url}${JSON.stringify(options)}`;
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < cacheTimeout) {
    return cached.data;
  }
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'User-Agent': 'OtoManga/1.0',
          ...options.headers
        },
        timeout: 10000 // 10 segundos timeout
      });
      
      if (!response.ok) {
        if (response.status >= 500 && attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      apiCache.set(cacheKey, { data, timestamp: Date.now() });
      
      // Limpiar cache viejo automáticamente
      if (apiCache.size > 100) {
        const oldKeys = Array.from(apiCache.keys()).slice(0, 20);
        oldKeys.forEach(key => apiCache.delete(key));
      }
      
      return data;
    } catch (error) {
      if (attempt === retries - 1) {
        console.error(`Fetch error after ${retries} attempts:`, error);
        // Retornar cache expirado si existe
        if (cached) {
          console.warn('Using expired cache for:', url);
          return cached.data;
        }
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
};

// Preload inteligente de datos críticos
const preloadCriticalData = async () => {
  try {
    // Solo precargar si el usuario está en WiFi o tiene conexión rápida
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    
    if (isSlowConnection) {
      console.log('Slow connection detected, skipping preload');
      return;
    }

    const promises = [
      fetchWithCache('https://api.jikan.moe/v4/top/anime?limit=8'),
      fetchWithCache('https://api.jikan.moe/v4/top/manga?limit=8'),
      fetchWithCache('https://api.jikan.moe/v4/top/characters?limit=8')
    ];
    
    // Ejecutar en paralelo sin await para no bloquear
    Promise.all(promises).catch(console.error);
  } catch (error) {
    console.error('Preload error:', error);
  }
};

// Cleanup de cache cuando se cierra la pestaña
const cleanupCache = () => {
  if (apiCache.size > 50) {
    apiCache.clear();
  }
};

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Cargar fuentes de forma asíncrona y optimizada
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Serif+JP:wght@400;700&display=swap";
    link.rel = "preload";
    link.as = "style";
    link.crossOrigin = "anonymous";
    link.onload = function() { 
      this.rel = "stylesheet";
      this.onload = null;
    };
    
    // Fallback para navegadores que no soportan preload
    setTimeout(() => {
      if (link.rel !== "stylesheet") {
        link.rel = "stylesheet";
      }
    }, 100);
    
    document.head.appendChild(link);
    
    // Preload de datos críticos con delay
    const preloadTimer = setTimeout(() => {
      preloadCriticalData();
    }, 100);
    
    // Cleanup de cache en beforeunload
    const handleBeforeUnload = () => cleanupCache();
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearTimeout(preloadTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Proteger rutas privadas solo cuando el usuario esté cargado
  useEffect(() => {
    const publicRoutes = ["/login", "/_error", "/"]; // puedes agregar más rutas públicas
    if (!loading) {
      const isLogged = !!user;
      if (!isLogged && !publicRoutes.includes(router.pathname)) {
        router.push('/login');
      }
      setChecking(false);
    }
  }, [router.pathname, router, user, loading]);

  return (
    <>
      <Navbar />
      <div>
        {(loading || checking)
          ? <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>Cargando sesión...</div>
          : <Component {...pageProps} />
        }
      </div>
    </>
  );
}
