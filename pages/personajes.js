import { useEffect, useState } from 'react';
import styles from './styles/otoindex.module.css';
import { useRouter } from 'next/router';

export default function Personajes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const url = 'https://api.jikan.moe/v4/top/characters?limit=25';
        const res = await fetch(url);
        const data = await res.json();
        setItems(Array.isArray(data.data) && data.data.length ? data.data : []);
      } catch (error) {
        setItems([]);
      }
      setLoading(false);
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
