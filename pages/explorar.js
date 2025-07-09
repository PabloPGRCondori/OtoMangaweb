import { useState, useEffect } from 'react';
import styles from './styles/otoindex.module.css';
import { useRouter } from 'next/router';
import { getAgeRestriction } from '../lib/ageRestriction';

const TYPE_OPTIONS = [
  { value: 'anime', label: 'Anime' },
  { value: 'manga', label: 'Manga' }
];
const ORDER_OPTIONS = [
  { value: 'popularity', label: 'Popularidad' },
  { value: 'score', label: 'Puntaje' },
  { value: 'favorites', label: 'Favoritos' }
];
const ANIME_SUBTYPES = [
  '', 'tv', 'movie', 'ova', 'special', 'ona', 'music'
];
const MANGA_SUBTYPES = [
  '', 'manga', 'novel', 'lightnovel', 'one_shot', 'doujin', 'manhwa', 'manhua'
];

export default function Explorar() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('anime');
  const [order, setOrder] = useState('popularity');
  const [subtype, setSubtype] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastPage, setLastPage] = useState(1);
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

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError('');
    let url = `https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(query)}&order_by=${order}&sort=desc&page=${page}&limit=12`;
    if (subtype) url += `&type=${subtype}`;
    if (year) url += `&start_date=${year}-01-01`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
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
        setResults(filterErotic(data.data || []));
        setLastPage(data.pagination?.last_visible_page || 1);
      })
      .catch(() => setError('Error al buscar.'))
      .finally(() => setLoading(false));
  }, [query, type, order, subtype, year, page, ageRestriction]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setResults([]);
    setError('');
    if (query.trim()) {
      setQuery(query.trim());
    }
  };

  return (
    <main className={styles.main}>
      <h2 style={{ color: '#b71c1c', marginBottom: 18 }}>Explorar animes y mangas</h2>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por título..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1.5px solid #eabf9f', minWidth: 180 }}
        />
        <select value={type} onChange={e => { setType(e.target.value); setSubtype(''); }} style={{ padding: 8, borderRadius: 8, border: '1.5px solid #eabf9f' }}>
          {TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={subtype} onChange={e => setSubtype(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1.5px solid #eabf9f' }}>
          <option value="">Todos</option>
          {(type === 'anime' ? ANIME_SUBTYPES : MANGA_SUBTYPES).filter(Boolean).map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
        </select>
        <select value={order} onChange={e => setOrder(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1.5px solid #eabf9f' }}>
          {ORDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <input
          type="number"
          placeholder="Año"
          value={year}
          onChange={e => setYear(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1.5px solid #eabf9f', width: 90 }}
          min={1950}
          max={2100}
        />
        <button type="submit" style={{ background: '#b71c1c', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Buscar</button>
      </form>
      {loading ? <p>Cargando...</p> : error ? <p style={{ color: '#b71c1c' }}>{error}</p> : (
        <>
          <div className={styles.cardsContainer}>
            {results.map(item => (
              <div
                className={styles.card}
                key={item.mal_id}
                onClick={() => router.push(`/info?id=${item.mal_id}&type=${type}`)}
                style={{ cursor: 'pointer' }}
              >
                <img src={item.images?.jpg?.image_url || item.images?.webp?.image_url} alt={item.title} />
                <h3>{item.title}</h3>
                <p style={{ margin: 0 }}>{type === 'anime' ? 'Anime' : 'Manga'} | ⭐ {item.score || 'N/A'}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 18 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ background: '#eabf9f', color: '#b71c1c', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
            <span style={{ alignSelf: 'center', color: '#b71c1c', fontWeight: 600 }}>Página {page} de {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage(p => Math.min(lastPage, p + 1))} style={{ background: '#eabf9f', color: '#b71c1c', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: page >= lastPage ? 'not-allowed' : 'pointer' }}>Siguiente</button>
          </div>
        </>
      )}
    </main>
  );
}
