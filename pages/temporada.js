import { useState, useEffect, useCallback } from 'react';
import styles from './styles/temporada.module.css';
import tabsStyles from './styles/tabs.module.css';
import { useRouter } from 'next/router';

const SEASON_OPTIONS = [
  { value: 'winter', label: 'Invierno' },
  { value: 'spring', label: 'Primavera' },
  { value: 'summer', label: 'Verano' },
  { value: 'fall', label: 'Otoño' }
];

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return 'winter';
  if (month <= 6) return 'spring';
  if (month <= 9) return 'summer';
  return 'fall';
}

export default function TemporadaCalendario() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [season, setSeason] = useState(getCurrentSeason());
  const [seasonResults, setSeasonResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch temporada en el primer render y cuando cambian año o temporada
  const fetchData = useCallback(async () => {
    setLoading(true);
    const seasonUrl = `https://api.jikan.moe/v4/seasons/${year}/${season}`;
    try {
      const seasonRes = await fetch(seasonUrl);
      const seasonData = await seasonRes.json();
      setSeasonResults(Array.isArray(seasonData.data) ? seasonData.data : []);
    } catch (e) {
      setSeasonResults([]);
    } finally {
      setLoading(false);
    }
  }, [year, season]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Animación para las cards
  const cardAnimation = {
    animation: 'fadeInUp 0.7s cubic-bezier(.39,.575,.565,1) both'
  };

  return (
    <main
      className={styles.main}
      style={{
        backgroundImage: `linear-gradient(120deg, #fff6e9cc 0%, #fbeee6cc 100%), url('/fondo/bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
      }}
    >
      <h2 style={{ color: '#b71c1c', marginBottom: 18, fontWeight: 900, fontSize: 36, letterSpacing: 1 }}>Temporada & Calendario</h2>
      <div className={tabsStyles.tabs} style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 18 }}>
        <select
          value={season}
          onChange={e => setSeason(e.target.value)}
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
          {SEASON_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
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
          {Array.from({ length: 17 }, (_, i) => 2010 + i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <h3 className={styles.sectionTitle} style={{marginTop: 0}}>
        En emisión: {SEASON_OPTIONS.find(s => s.value === season)?.label} {year}
      </h3>
      {loading ? (
        <div className={styles.spinnerContainer}>
          <span className={styles.spinner} />
          <span className={styles.loadingText}>Cargando...</span>
        </div>
      ) : (
        <div className={styles.cardsContainer}>
          {seasonResults.map((item, idx) => (
            <div
              className={styles.card}
              key={item.mal_id}
              onClick={() => router.push(`/info?id=${item.mal_id}&type=anime`)}
              style={{ ...cardAnimation, animationDelay: `${idx * 0.04}s` }}
            >
              <img src={item.images?.jpg?.image_url || item.images?.webp?.image_url} alt={item.title} />
              <h3>{item.title}</h3>
              <p>⭐ {item.score || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
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
