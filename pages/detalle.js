import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from './styles/detalle.module.css';

export default function Detalle() {
  const router = useRouter();
  const { id, type } = router.query;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !type) return;
    setLoading(true);
    const fetchData = async () => {
      let url =
        type === 'manga'
          ? `https://api.jikan.moe/v4/manga/${id}`
          : `https://api.jikan.moe/v4/anime/${id}`;
      const res = await fetch(url);
      const data = await res.json();
      setItem(data.data);
      setLoading(false);
    };
    fetchData();
  }, [id, type]);

  if (loading) return (
    <main className={styles.main}>
      <div className={styles.spinnerContainer}>
        <span className={styles.spinner} />
        <span className={styles.loadingText}>Cargando...</span>
      </div>
    </main>
  );
  if (!item) return <main className={styles.main}><p>No encontrado.</p></main>;

  return (
    <main className={styles.main}>
      <img
        src={item.images?.jpg?.image_url || item.images?.webp?.image_url}
        alt={item.title}
        className={styles.img}
      />
      <h1 className={styles.title}>{item.title}</h1>
      <p className={styles.type}><b>Tipo:</b> {type === 'manga' ? 'Manga' : 'Anime'}</p>
      <p className={styles.rank}><b>Ranking:</b> #{item.rank}</p>
      {item.synopsis && <p className={styles.synopsis}><b>Sinopsis:</b> {item.synopsis}</p>}
      <button onClick={() => router.push('/otoindex')} className={styles.backBtn}>Regresar al inicio</button>
    </main>
  );
}
