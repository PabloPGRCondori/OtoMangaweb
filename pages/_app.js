import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import Navbar from "@/components/Navbar";
import useUser from "../lib/useUser";

// Cache global para APIs
const apiCache = new Map();
const cacheTimeout = 5 * 60 * 1000; // 5 minutos

// Función de fetch optimizada con cache
export const fetchWithCache = async (url, options = {}) => {
  const cacheKey = `${url}${JSON.stringify(options)}`;
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < cacheTimeout) {
    return cached.data;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutos
        ...options.headers
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    // Retornar cache expirado si existe
    if (cached) return cached.data;
    throw error;
  }
};

// Preload de datos críticos
const preloadCriticalData = async () => {
  try {
    const promises = [
      fetchWithCache('https://api.jikan.moe/v4/top/anime?limit=10'),
      fetchWithCache('https://api.jikan.moe/v4/top/manga?limit=10'),
      fetchWithCache('https://api.jikan.moe/v4/top/characters?limit=10')
    ];
    
    // Ejecutar en paralelo sin await para no bloquear
    Promise.all(promises).catch(console.error);
  } catch (error) {
    console.error('Preload error:', error);
  }
};

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Cargar fuentes de forma asíncrona
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Serif+JP:wght@400;700&display=swap";
    link.rel = "stylesheet";
    link.rel = "preload";
    link.as = "style";
    link.onload = function() { this.rel = "stylesheet"; };
    document.head.appendChild(link);
    
    // Preload de datos críticos
    preloadCriticalData();
    
    return () => {
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
  }, [router.pathname, user, loading]);

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
