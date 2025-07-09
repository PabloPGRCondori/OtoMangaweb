import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import Navbar from "@/components/Navbar";
import useUser from "../lib/useUser";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Serif+JP:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
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
