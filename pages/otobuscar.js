import { useState, useEffect, useRef } from 'react';
import styles from './styles/otobuscar.module.css';
import { useRouter } from 'next/router';
import { getAgeRestriction } from '../lib/ageRestriction';

export default function OtoBuscar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tapeSpeed, setTapeSpeed] = useState(20); // px/s
  const [tapeInterval, setTapeInterval] = useState(null);
  const tapeRef = useRef(null);
  const [tapeItems, setTapeItems] = useState([]); // Para la cinta inicial
  const router = useRouter();

  // IDs de géneros eróticos (Jikan): hentai, erotica, ecchi, yaoi, yuri
  const forbiddenGenres = [12, 49, 9, 28, 27];
  const [ageRestriction, setAgeRestriction] = useState(true);

  useEffect(() => {
    setAgeRestriction(getAgeRestriction());
    
    // Escuchar cambios de restricción de edad desde la navbar
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

  // Cargar mangas populares para la cinta inicial
  useEffect(() => {
    const fetchTape = async () => {
      try {
        const url = 'https://api.jikan.moe/v4/top/manga?limit=25';
        const res = await fetch(url);
        const data = await res.json();
        // Filtrar contenido adulto si la restricción está activada
        const filterErotic = arr => (arr || []).filter(item => {
          if (!item.genres) return true;
          // Si la restricción está activada (true), filtrar contenido adulto
          if (ageRestriction) {
            return !item.genres.some(g => forbiddenGenres.includes(g.mal_id));
          }
          // Si la restricción está desactivada (false), mostrar todo
          return true;
        });
        setTapeItems(filterErotic(data.data || []));
      } catch {
        setTapeItems([]);
      }
    };
    fetchTape();
  }, [ageRestriction]);

  // Efecto para mover la cinta automáticamente
  useEffect(() => {
    if (!(results.length || tapeItems.length)) return;
    let pos = 0;
    if (tapeInterval) clearInterval(tapeInterval);
    const interval = setInterval(() => {
      if (tapeRef.current) {
        pos += tapeSpeed / 10;
        tapeRef.current.scrollLeft = pos;
        const maxScroll = tapeRef.current.scrollWidth - tapeRef.current.clientWidth;
        if (pos >= maxScroll) {
          pos = 0;
        }
      }
    }, 50);
    setTapeInterval(interval);
    return () => clearInterval(interval);
  }, [results, tapeItems, tapeSpeed]);

  // Buscar solo por palabra clave
  const handleSearch = async (e) => {
    e.preventDefault();
    setTapeSpeed(80); // Acelera
    setTimeout(() => setTapeSpeed(20), 1200); // Vuelve a normal
    setLoading(true);
    setError('');
    setResults([]);
    try {
      let url = `https://api.jikan.moe/v4/manga?limit=25&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      // Filtrar mangas "eróticos" si la restricción está activada
      const filterErotic = arr => (arr || []).filter(item => {
        if (!item.genres) return true;
        // Si la restricción está activada (true), filtrar contenido adulto
        if (ageRestriction) {
          return !item.genres.some(g => forbiddenGenres.includes(g.mal_id));
        }
        // Si la restricción está desactivada (false), mostrar todo
        return true;
      });
      const filtered = filterErotic(data.data || []);
      if (filtered.length) {
        setResults(filtered);
      } else {
        setResults([]);
        setError('No se encontraron mangas para esa búsqueda.');
      }
    } catch (err) {
      setError('Error al buscar mangas. Intenta de nuevo.');
    }
    setLoading(false);
  };

  // Cuando se escribe en el input, buscar automáticamente y acelerar la cinta
  useEffect(() => {
    if (!query) return;
    const fetchOnType = async () => {
      setTapeSpeed(80);
      setTimeout(() => setTapeSpeed(20), 1200);
      setLoading(true);
      setError('');
      setResults([]);
      try {
        let url = `https://api.jikan.moe/v4/manga?limit=25&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();
        // Filtrar mangas "eróticos" si la restricción está activada
        const filterErotic = arr => (arr || []).filter(item => {
          if (!item.genres) return true;
          // Si la restricción está activada (true), filtrar contenido adulto
          if (ageRestriction) {
            return !item.genres.some(g => forbiddenGenres.includes(g.mal_id));
          }
          // Si la restricción está desactivada (false), mostrar todo
          return true;
        });
        setResults(filterErotic(data.data || []));
      } catch {
        setResults([]);
      }
      setLoading(false);
    };
    fetchOnType();
  }, [query, ageRestriction]);

  return (
    <main className={styles.main} style={{ maxWidth: 1200, margin: '2rem auto', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '3px solid #eabf9f', background: 'linear-gradient(135deg, #fbeee6 0%, #f5d6c6 100%)' }}>
      <h1 className={styles.title}>OtoBuscar</h1>
      <p className={styles.subtitle}>Busca tus mangas favoritos aquí.</p>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', justifyContent: 'center', maxWidth: 900, width: '100%' }}>
        <input
          type="text"
          placeholder="Título o palabra clave"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #eabf9f', minWidth: 180, flex: 1 }}
        />
        <button type="submit" style={{ background: '#b71c1c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>Buscar</button>
      </form>
      {loading && <p>Cargando resultados...</p>}
      {error && <p style={{ color: '#b71c1c', fontWeight: 'bold' }}>{error}</p>}
      <div
        className={styles.cardsContainer}
        ref={tapeRef}
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          width: '100%',
          maxWidth: 1100,
          minHeight: 320,
          margin: '0 auto',
        }}
      >
        {(results.length ? results : tapeItems).map(item => (
          <div
            className={styles.card}
            key={item.mal_id}
            onClick={() => router.push(`/detalle?id=${item.mal_id}&type=manga`)}
            style={{ minWidth: 260, marginRight: 32 }}
          >
            <img src={item.images?.jpg?.image_url || item.images?.webp?.image_url} alt={item.title} />
            <h3>{item.title}</h3>
            <p>Manga</p>
          </div>
        ))}
      </div>
    </main>
  );
}
