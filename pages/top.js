import { useState, useEffect, useCallback } from 'react';
import styles from './styles/top.module.css';
import tabsStyles from './styles/tabs.module.css';
import { useRouter } from 'next/router';
import { fetchWithCache } from './_app';

const TYPE_OPTIONS = [
  { value: 'anime', label: 'Anime' },
  { value: 'manga', label: 'Manga' },
  { value: 'characters', label: 'Personajes' }
];
const ORDER_OPTIONS = [
  { value: 'all', label: 'General' },
  { value: 'airing', label: 'En emisión' },
  { value: 'upcoming', label: 'Próximos' },
  { value: 'tv', label: 'TV' },
  { value: 'movie', label: 'Película' },
  { value: 'ova', label: 'OVA' },
  { value: 'special', label: 'Especial' },
  { value: 'bypopularity', label: 'Popularidad' },
  { value: 'favorite', label: 'Favoritos' }
];
const MANGA_ORDER_OPTIONS = [
  { value: 'all', label: 'General' },
  { value: 'manga', label: 'Manga' },
  { value: 'novels', label: 'Novela' },
  { value: 'oneshots', label: 'One-shot' },
  { value: 'doujin', label: 'Doujin' },
  { value: 'manhwa', label: 'Manhwa' },
  { value: 'manhua', label: 'Manhua' },
  { value: 'bypopularity', label: 'Popularidad' },
  { value: 'favorite', label: 'Favoritos' }
];

export default function Top() {
  const [type, setType] = useState('anime');
  const [order, setOrder] = useState('all');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastPage, setLastPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    let url = '';
    if (type === 'anime') url = `https://api.jikan.moe/v4/top/anime?page=${page}&type=${order !== 'all' ? order : ''}`;
    else if (type === 'manga') url = `https://api.jikan.moe/v4/top/manga?page=${page}&type=${order !== 'all' ? order : ''}`;
    else if (type === 'characters') url = `https://api.jikan.moe/v4/top/characters?page=${page}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setResults(Array.isArray(data.data) ? data.data : []);
        setLastPage(data.pagination?.last_visible_page || 1);
      })
      .finally(() => setLoading(false));
  }, [type, order, page]);

  // Animación para las cards
  const cardAnimation = {
    animation: 'fadeInUp 0.7s cubic-bezier(.39,.575,.565,1) both'
  };

  return (
    <main
      className={styles.main}
      style={{
        backgroundImage: `linear-gradient(120deg, #fff6e9cc 0%, #fbeee6cc 30%), url('/fondo/bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '30vh',
      }}
    >
      <h2 style={{ color: '#b71c1c', marginBottom: 18, fontWeight: 900, fontSize: 36, letterSpacing: 1 }}>Top Anime, Manga y Personajes</h2>
      <div className={tabsStyles.tabs} style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 18 }}>
        <select
          value={type}
          onChange={e => { setType(e.target.value); setOrder('all'); setPage(1); }}
          className={tabsStyles.tabBtn}
          style={{
            appearance: 'none',
            background: '#fff6e9',
            border: '2px solid #eabf9f',
            borderRadius: 12,
            padding: '0.6rem 2.2rem 0.6rem 1rem',
            fontSize: 18,
            fontWeight: 600,
            color: '#b71c1c',
            boxShadow: '0 2px 8px #b71c1c11',
            outline: 'none',
            transition: 'border 0.2s',
            cursor: 'pointer',
            minWidth: 120,
            height: 48,
          }}
        >
          <option value="anime">Anime</option>
          <option value="manga">Manga</option>
          <option value="characters">Personajes</option>
        </select>
        <select
          value={order}
          onChange={e => { setOrder(e.target.value); setPage(1); }}
          className={tabsStyles.tabBtn}
          style={{
            appearance: 'none',
            background: '#fff6e9',
            border: '2px solid #eabf9f',
            borderRadius: 12,
            padding: '0.6rem 2.2rem 0.6rem 1rem',
            fontSize: 18,
            fontWeight: 600,
            color: '#b71c1c',
            boxShadow: '0 2px 8px #b71c1c11',
            outline: 'none',
            transition: 'border 0.2s',
            cursor: 'pointer',
            minWidth: 120,
            height: 48,
          }}
        >
          <option value="all">General</option>
          <option value="tv">TV</option>
          <option value="movie">Película</option>
          <option value="ova">OVA</option>
          <option value="special">Especial</option>
        </select>
      </div>
      {loading ? (
        <div className={styles.spinnerContainer}>
          <span className={styles.spinner} />
          <span className={styles.loadingText}>Cargando...</span>
        </div>
      ) : (
        <div className={styles.cardsContainer}>
          {results.map((item, idx) => (
            <div
              className={styles.card}
              key={item.mal_id}
              onClick={() => router.push(`/info?id=${item.mal_id}&type=${type === 'characters' ? 'character' : type}`)}
              style={{ ...cardAnimation, animationDelay: `${idx * 0.04}s` }}
            >
              <img src={item.images?.jpg?.image_url || item.images?.webp?.image_url} alt={item.title || item.name} />
              <h3>{item.title || item.name}</h3>
              {type !== 'characters' && <p>⭐ {item.score || 'N/A'} | #{item.rank}</p>}
              {type === 'characters' && <p>Favoritos: {item.favorites || 0}</p>}
            </div>
          ))}
        </div>
      )}
      <div className={styles.pagination}>
        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className={styles.pageBtn}>Anterior</button>
        <span className={styles.pageInfo}>
          Página {page} de {lastPage}
        </span>
        <button disabled={page >= lastPage} onClick={() => setPage(p => Math.min(lastPage, p + 1))} className={styles.pageBtn}>Siguiente</button>
      </div>
      <style jsx global>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translate3d(0, 40px, 0);
          }
          100% {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
