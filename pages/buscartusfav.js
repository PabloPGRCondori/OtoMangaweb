import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './styles/buscartusfav.module.css';
import { useRouter } from 'next/router';
import { getAgeRestriction } from '../lib/ageRestriction';
import { fetchWithCache } from './_app';

// Debounce hook para optimizar búsquedas
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

const typeInfo = {
  manga: { color: '#b71c1c', label: 'Manga', icon: '📚' },
  anime: { color: '#1976d2', label: 'Anime', icon: '🎬' },
  character: { color: '#43a047', label: 'Personaje', icon: '🧑‍🎤' },
};

// IDs de géneros eróticos (Jikan): hentai, erotica, ecchi, yaoi, yuri
const FORBIDDEN_GENRES = [12, 49, 9, 28, 27];

export default function BuscarTUSFAV() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tapeItems, setTapeItems] = useState([]);
  const [ageRestriction, setAgeRestriction] = useState(true);
  const tapeRef = useRef(null);
  const router = useRouter();
  
  // Debounce para la búsqueda
  const debouncedQuery = useDebounce(query, 300);

  // Función para filtrar contenido erótico
  const filterEroticContent = useCallback((items) => {
    return (items || []).filter(item => {
      if (!item.genres) return true;
      // Si la restricción está activada (true), filtrar contenido adulto
      if (ageRestriction) {
        return !item.genres.some(g => FORBIDDEN_GENRES.includes(g.mal_id));
      }
      // Si la restricción está desactivada (false), mostrar todo
      return true;
    });
  }, [ageRestriction]);

  // Función optimizada para obtener datos de la API
  const fetchApiData = useCallback(async (endpoint) => {
    try {
      const data = await fetchWithCache(endpoint);
      return data.data || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  }, []);

  // Función optimizada para cargar contenido popular inicial
  const loadPopularContent = useCallback(async () => {
    try {
      const [mangaData, animeData, charData] = await Promise.all([
        fetchApiData('https://api.jikan.moe/v4/top/manga?limit=8'),
        fetchApiData('https://api.jikan.moe/v4/top/anime?limit=8'),
        fetchApiData('https://api.jikan.moe/v4/top/characters?limit=8')
      ]);

      const combinedItems = [
        ...filterEroticContent(mangaData).map(i => ({ ...i, _type: 'manga' })),
        ...filterEroticContent(animeData).map(i => ({ ...i, _type: 'anime' })),
        ...charData.map(i => ({ ...i, _type: 'character' })),
      ];

      setTapeItems(combinedItems);
    } catch (error) {
      console.error('Error loading popular content:', error);
      setError('Error al cargar contenido popular');
    }
  }, [fetchApiData, filterEroticContent]);

  // Función optimizada para buscar contenido
  const searchContent = useCallback(async (searchQuery) => {
    if (!searchQuery) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const [mangaData, animeData, charData] = await Promise.all([
        fetchApiData(`https://api.jikan.moe/v4/manga?limit=8&q=${encodeURIComponent(searchQuery)}`),
        fetchApiData(`https://api.jikan.moe/v4/anime?limit=8&q=${encodeURIComponent(searchQuery)}`),
        fetchApiData(`https://api.jikan.moe/v4/characters?limit=8&q=${encodeURIComponent(searchQuery)}`)
      ]);

      const searchResults = [
        ...filterEroticContent(mangaData).map(i => ({ ...i, _type: 'manga' })),
        ...filterEroticContent(animeData).map(i => ({ ...i, _type: 'anime' })),
        ...charData.map(i => ({ ...i, _type: 'character' })),
      ];

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setError('Error al buscar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [fetchApiData, filterEroticContent]);

  // Función para manejar navegación a detalles
  const handleItemClick = (item) => {
    router.push(`/info?id=${item.mal_id}&type=${item._type}`);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  // Función para el auto-scroll de la cinta
  const setupAutoScroll = (items) => {
    if (!items.length) return;
    
    let pos = 0;
    const interval = setInterval(() => {
      if (tapeRef.current) {
        pos += 2;
        tapeRef.current.scrollLeft = pos;
        const maxScroll = tapeRef.current.scrollWidth - tapeRef.current.clientWidth;
        if (pos >= maxScroll) {
          pos = 0;
        }
      }
    }, 50);
    
    return () => clearInterval(interval);
  };

  // Efecto para configurar restricción de edad
  useEffect(() => {
    setAgeRestriction(getAgeRestriction());
    
    const handleAgeRestrictionChange = (event) => {
      setAgeRestriction(event.detail.enabled);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('ageRestrictionChanged', handleAgeRestrictionChange);
      return () => {
        window.removeEventListener('ageRestrictionChanged', handleAgeRestrictionChange);
      };
    }
  }, []);

  // Efecto para cargar contenido popular inicial
  useEffect(() => {
    loadPopularContent();
  }, [loadPopularContent, ageRestriction]);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    searchContent(debouncedQuery);
  }, [searchContent, debouncedQuery, ageRestriction]);

  // Efecto para auto-scroll
  useEffect(() => {
    const items = query ? results : tapeItems;
    return setupAutoScroll(items);
  }, [results, tapeItems, query]);

  const itemsToShow = query ? results : tapeItems;

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>BuscarTUSFAV</h1>
      <p className={styles.subtitle}>Busca tus mangas, animes y personajes favoritos aquí.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', justifyContent: 'center', maxWidth: 900, width: '100%' }}>
        <input
          type="text"
          placeholder="Título, personaje o palabra clave"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #eabf9f', minWidth: 180, flex: 1 }}
        />
      </form>

      {loading && <p>Cargando resultados...</p>}
      {error && <p style={{ color: '#b71c1c', fontWeight: 'bold' }}>{error}</p>}

      <div className={styles.cardsContainer} ref={tapeRef}>
        {itemsToShow.map((item, idx) => {
          const info = typeInfo[item._type] || {};
          return (
            <div
              className={styles.card}
              key={item.mal_id}
              onClick={() => handleItemClick(item)}
              style={{
                border: `2px solid ${info.color || '#b71c1c'}`,
                animation: `fadeIn 0.5s ${idx * 0.07}s both`
              }}
            >
              <div className={styles.cardIconRow}>
                <span className={styles.cardIcon}>{info.icon}</span>
                <span className={styles.cardLabel} style={{ background: info.color }}>{info.label}</span>
              </div>
              <img 
                src={item.images?.jpg?.image_url || item.images?.webp?.image_url} 
                alt={item.title || item.name} 
                className={styles.cardImg} 
              />
              <h3 className={styles.cardTitle}>{item.title || item.name}</h3>
              {item._type === 'character' && item.name_kanji && (
                <p className={styles.cardKanji}>{item.name_kanji}</p>
              )}
              {item._type !== 'character' && item.synopsis && (
                <p className={styles.cardSynopsis}>{item.synopsis}</p>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </main>
  );
}
