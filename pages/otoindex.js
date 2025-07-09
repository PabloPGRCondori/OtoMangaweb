import { useEffect, useState, useRef } from 'react';
import styles from './styles/otoindex.module.css';
import { useRouter } from 'next/router';

// Configuración para despliegue en AWS
export const AWS_IP = '3.21.127.251';
// Si necesitas usar la IP en fetch o para recursos, puedes hacer:
// fetch(`http://${AWS_IP}:puerto/endpoint`)
// O para recursos estáticos:
// const STATIC_URL = `http://${AWS_IP}/ruta/archivo.png`;

// Modularización de imágenes
const BACKGROUND_IMAGE = '/fondo/bg.jpg'; // Usa si existe

const CAROUSEL_IMAGES = [
  '/carrusel/carrusel1.jpg',
  '/carrusel/carrusel2.jpg',
  '/carrusel/carrusel3.jpg',
  '/carrusel/carrusel4.jpg',
  '/carrusel/carrusel5.jpg',
  '/carrusel/carrusel6.jpg',
  '/carrusel/carrusel7.jpg',
  '/carrusel/carrusel8.jpg',
  '/carrusel/carrusel9.jpg',
  '/carrusel/carrusel10.jpg',
];

export default function OtoIndex() {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const router = useRouter();
  const intervalRef = useRef();

  // Carrusel automático
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCarouselIndex(idx => (idx + 1) % CAROUSEL_IMAGES.length);
    }, 3500);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Cargar animes más vistos del año actual
  useEffect(() => {
    setLoading(true);
    const year = new Date().getFullYear();
    fetch(`https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=8&year=${year}`)
      .then(res => res.json())
      .then(data => setAnimes(Array.isArray(data.data) ? data.data : []))
      .finally(() => setLoading(false));
  }, []);

  // Mostrar 3 imágenes a la vez, centrando la actual
  const getVisibleImages = () => {
    if (CAROUSEL_IMAGES.length <= 3) return CAROUSEL_IMAGES;
    const prev = (carouselIndex - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length;
    const next = (carouselIndex + 1) % CAROUSEL_IMAGES.length;
    return [CAROUSEL_IMAGES[prev], CAROUSEL_IMAGES[carouselIndex], CAROUSEL_IMAGES[next]];
  };

  // Animación para las cards
  const cardAnimation = {
    animation: 'fadeInUp 0.7s cubic-bezier(.39,.575,.565,1) both'
  };

  // --- Carrusel de animes más vistos ---
  const animeListRef = useRef();
  const [animeScrollIndex, setAnimeScrollIndex] = useState(0);
  const animeVisibleCount = 4; // Número de animes visibles a la vez

  // Auto-scroll para el carrusel de animes
  useEffect(() => {
    if (!animes.length) return;
    const animeInterval = setInterval(() => {
      setAnimeScrollIndex(idx => (idx + 1) % Math.max(animes.length - animeVisibleCount + 1, 1));
    }, 4000);
    return () => clearInterval(animeInterval);
  }, [animes]);

  // Scroll animado al cambiar el índice
  useEffect(() => {
    if (animeListRef.current) {
      animeListRef.current.scrollTo({
        left: animeScrollIndex * 252, // 220px card + 32px gap
        behavior: 'smooth',
      });
    }
  }, [animeScrollIndex]);

  // Navegación manual (flechas)
  const handleAnimeNav = dir => {
    setAnimeScrollIndex(idx => {
      const maxIdx = Math.max(animes.length - animeVisibleCount, 0);
      if (dir === 'left') return Math.max(idx - 1, 0);
      if (dir === 'right') return Math.min(idx + 1, maxIdx);
      return idx;
    });
  };

  // Swipe en móvil
  let touchStartX = null;
  const handleTouchStart = e => {
    touchStartX = e.touches[0].clientX;
  };
  const handleTouchEnd = e => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 50) handleAnimeNav('left');
    if (diff < -50) handleAnimeNav('right');
    touchStartX = null;
  };

  // --- Carrusel de mangas más leídos ---
  const [mangas, setMangas] = useState([]);
  const [loadingMangas, setLoadingMangas] = useState(true);
  const mangaListRef = useRef();
  const [mangaScrollIndex, setMangaScrollIndex] = useState(0);
  const mangaVisibleCount = 4;

  // Cargar mangas más leídos
  useEffect(() => {
    setLoadingMangas(true);
    fetch('https://api.jikan.moe/v4/top/manga?filter=bypopularity&limit=8')
      .then(res => res.json())
      .then(data => setMangas(Array.isArray(data.data) ? data.data : []))
      .finally(() => setLoadingMangas(false));
  }, []);

  // Auto-scroll mangas
  useEffect(() => {
    if (!mangas.length) return;
    const mangaInterval = setInterval(() => {
      setMangaScrollIndex(idx => (idx + 1) % Math.max(mangas.length - mangaVisibleCount + 1, 1));
    }, 4000);
    return () => clearInterval(mangaInterval);
  }, [mangas]);

  // Scroll animado mangas
  useEffect(() => {
    if (mangaListRef.current) {
      mangaListRef.current.scrollTo({
        left: mangaScrollIndex * 252,
        behavior: 'smooth',
      });
    }
  }, [mangaScrollIndex]);

  // Navegación manual mangas
  const handleMangaNav = dir => {
    setMangaScrollIndex(idx => {
      const maxIdx = Math.max(mangas.length - mangaVisibleCount, 0);
      if (dir === 'left') return Math.max(idx - 1, 0);
      if (dir === 'right') return Math.min(idx + 1, maxIdx);
      return idx;
    });
  };

  // Swipe mangas
  let mangaTouchStartX = null;
  const handleMangaTouchStart = e => {
    mangaTouchStartX = e.touches[0].clientX;
  };
  const handleMangaTouchEnd = e => {
    if (mangaTouchStartX === null) return;
    const diff = e.changedTouches[0].clientX - mangaTouchStartX;
    if (diff > 50) handleMangaNav('left');
    if (diff < -50) handleMangaNav('right');
    mangaTouchStartX = null;
  };

  // Estado de carga global para ambos carruseles
  const [loadingBoth, setLoadingBoth] = useState(true);

  // Cargar ambos en paralelo y mostrar ambos juntos
  useEffect(() => {
    setLoadingBoth(loading || loadingMangas);
  }, [loading, loadingMangas]);

  // --- NUEVO: Cargar animes y mangas en paralelo y mostrar ambos juntos ---
  useEffect(() => {
    setLoading(true);
    setLoadingMangas(true);
    const year = new Date().getFullYear();
    Promise.all([
      fetch(`https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=8&year=${year}`).then(res => res.json()),
      fetch('https://api.jikan.moe/v4/top/manga?filter=bypopularity&limit=8').then(res => res.json())
    ]).then(([animeData, mangaData]) => {
      setAnimes(Array.isArray(animeData.data) ? animeData.data : []);
      setMangas(Array.isArray(mangaData.data) ? mangaData.data : []);
    }).finally(() => {
      setLoading(false);
      setLoadingMangas(false);
    });
  }, []);

  // Combina animes y mangas en una sola lista para mostrar en un solo carrusel
  const combinedList = [
    ...animes.map(a => ({ ...a, _type: 'anime' })),
    ...mangas.map(m => ({ ...m, _type: 'manga' }))
  ];

  // Estado y lógica para el carrusel combinado
  const combinedListRef = useRef();
  const [combinedScrollIndex, setCombinedScrollIndex] = useState(0);
  const combinedVisibleCount = 4;

  // Esperar a que ambos terminen de cargar antes de mostrar el carrusel
  const combinedLoading = loading || loadingMangas;

  // Auto-scroll para el carrusel combinado
  useEffect(() => {
    if (!combinedList.length) return;
    let timeoutId;
    let intervalId;
    // Espera 2 segundos antes de iniciar el auto-scroll
    timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setCombinedScrollIndex(idx => (idx + 1) % Math.max(combinedList.length - combinedVisibleCount + 1, 1));
      }, 4000);
    }, 2000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [combinedList.length]);

  // Scroll animado al cambiar el índice
  useEffect(() => {
    if (combinedListRef.current) {
      combinedListRef.current.scrollTo({
        left: combinedScrollIndex * 252,
        behavior: 'smooth',
      });
    }
  }, [combinedScrollIndex]);

  // Navegación manual (flechas)
  const handleCombinedNav = dir => {
    setCombinedScrollIndex(idx => {
      const maxIdx = Math.max(combinedList.length - combinedVisibleCount, 0);
      if (dir === 'left') return Math.max(idx - 1, 0);
      if (dir === 'right') return Math.min(idx + 1, maxIdx);
      return idx;
    });
  };

  // Swipe en móvil
  let combinedTouchStartX = null;
  const handleCombinedTouchStart = e => {
    combinedTouchStartX = e.touches[0].clientX;
  };
  const handleCombinedTouchEnd = e => {
    if (combinedTouchStartX === null) return;
    const diff = e.changedTouches[0].clientX - combinedTouchStartX;
    if (diff > 50) handleCombinedNav('left');
    if (diff < -50) handleCombinedNav('right');
    combinedTouchStartX = null;
  };

  return (
    <main className={styles.main}>
      {/* Carrusel horizontal animado de imágenes principales (restaurado y más grande, horizontal) */}
      <div className={styles.carouselMain}>
        <div className={styles.carouselMainRow}>
          {getVisibleImages().map((src, idx) => (
            <img
              key={src}
              src={src}
              alt={`Carrusel ${idx}`}
              className={
                idx === 1
                  ? `${styles.carouselImgMain} ${styles.carouselImgMainActive}`
                  : styles.carouselImgMain
              }
              onClick={() => setCarouselIndex((carouselIndex + (idx - 1) + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length)}
            />
          ))}
        </div>
        <div className={styles.carouselDotsMain}>
          {CAROUSEL_IMAGES.map((_, idx) => (
            <span
              key={idx}
              className={idx === carouselIndex ? `${styles.dotMain} ${styles.activeDotMain}` : styles.dotMain}
              onClick={() => setCarouselIndex(idx)}
            />
          ))}
        </div>
      </div>

      {/* Imágenes decorativas del costado perfil */}
      <div style={{ 
        position: 'fixed', 
        top: '50%',
        transform: 'translateY(-50%)',
        width: '100vw',
        height: '200px',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        {/* noragami.png - margen derecho */}
        <img 
          src="/costadoPerfil/noragami.png" 
          alt="Noragami" 
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%) scaleX(-1)',
            height: '200px',
            width: 'auto',
            objectFit: 'contain',
            zIndex: 2,
            opacity: 0.8
          }}
        />
        
        {/* parederecha.png - margen izquierdo */}
        <img 
          src="/costadoPerfil/parederecha.png" 
          alt="Pared derecha" 
          style={{
            position: 'absolute',
            left: '-45px',
            top: '50%',
            transform: 'translateY(-50%) scaleX(-1)',
            height: '250px',
            width: 'auto',
            objectFit: 'contain',
            zIndex: 1,
            opacity: 0.8
          }}
        />
      </div>

      {/* ¿Qué ofrecemos? */}
      <section style={{ margin: '4rem 0', maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto', padding: '0 2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '3rem',
          background: 'linear-gradient(135deg, #fff6e9 0%, #fbeee6 100%)',
          borderRadius: 20,
          padding: '2.5rem',
          border: '3px solid #eabf9f',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '0 0 200px', textAlign: 'center' }}>
            <img 
              src="/carrusel/carrusel1.jpg" 
              alt="¿Qué ofrecemos?" 
              style={{ 
                width: '100%', 
                height: 200, 
                objectFit: 'cover', 
                borderRadius: 15,
                border: '3px solid #eabf9f',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }} 
            />
          </div>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h2 style={{ color: '#b71c1c', fontSize: 28, marginBottom: '1rem', fontWeight: 700 }}>¿Qué ofrecemos?</h2>
            <p style={{ color: '#7c4700', fontSize: 16, lineHeight: 1.6, marginBottom: 0 }}>
              En OtoManga te ofrecemos una experiencia completa para descubrir y explorar el mundo del anime y manga. 
              Desde rankings actualizados, información detallada de personajes, hasta calendarios de temporadas. 
              Todo lo que necesitas para estar al día con tus series favoritas y descubrir nuevas historias increíbles.
            </p>
          </div>
        </div>
      </section>

      {/* Nuestras redes */}
      <section style={{ margin: '4rem 0', maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto', padding: '0 2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '3rem',
          background: 'linear-gradient(135deg, #fbeee6 0%, #fff6e9 100%)',
          borderRadius: 20,
          padding: '2.5rem',
          border: '3px solid #eabf9f',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h2 style={{ color: '#b71c1c', fontSize: 28, marginBottom: '1rem', fontWeight: 700 }}>Nuestras redes</h2>
            <p style={{ color: '#7c4700', fontSize: 16, lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Síguenos en nuestras redes sociales para no perderte ninguna novedad, actualizaciones y contenido exclusivo sobre anime y manga.
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <a href="https://www.instagram.com/otoma_nga/" target="_blank" rel="noopener noreferrer" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: '#b71c1c',
                color: '#fff',
                padding: '0.75rem 1.5rem',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'transform 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                📷 Instagram
              </a>
              <a href="https://www.facebook.com/profile.php?id=61568360135055" target="_blank" rel="noopener noreferrer" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: '#1976d2',
                color: '#fff',
                padding: '0.75rem 1.5rem',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'transform 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                📘 Facebook
              </a>
            </div>
          </div>
          <div style={{ flex: '0 0 200px', textAlign: 'center' }}>
            <img 
              src="/carrusel/carrusel2.jpg" 
              alt="Nuestras redes" 
              style={{ 
                width: '100%', 
                height: 200, 
                objectFit: 'cover', 
                borderRadius: 15,
                border: '3px solid #eabf9f',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }} 
            />
          </div>
        </div>
      </section>

      {/* Quiénes somos */}
      <section className={styles.aboutSection}>
        <h2 className={styles.aboutTitle}>¿Quiénes somos?</h2>
        <p className={styles.aboutText}>
          OtoManga es una plataforma informativa y visual para fans del anime y manga. Aquí puedes explorar temporadas, rankings, fichas de personajes y mucho más, explora nuestra WEB!!.
        </p>
      </section>
    </main>
  );
}
