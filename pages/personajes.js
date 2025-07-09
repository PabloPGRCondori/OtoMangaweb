import { useEffect, useState } from 'react';
import styles from './styles/otoindex.module.css';
import { useRouter } from 'next/router';
import { fetchWithCache } from './_app';

export default function Personajes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const data = await fetchWithCache('https://api.jikan.moe/v4/top/characters?limit=25');
        setItems(Array.isArray(data.data) && data.data.length ? data.data : []);
      } catch (error) {
        console.error('Error loading characters:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className={styles.main}>
      {loading ? <p>Cargando...</p> : (
        <div className={styles.cardsContainer}>
          {items.map((item) => (
            <div
              className={styles.card}
              key={item.mal_id}
              onClick={() => router.push(`/info?id=${item.mal_id}&type=character`)}
            >
              <img src={item.images?.jpg?.image_url || item.images?.webp?.image_url} alt={item.name} />
              <h3>{item.name}</h3>
              <p>{item.name_kanji}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
