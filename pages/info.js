import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from './styles/detalle.module.css';
import tabsStyles from './styles/tabs.module.css';
import useUser from '../lib/useUser';
import { addFavorite, removeFavorite, isFavorite } from '../lib/favorites';
import VideoPlayer from '../components/VideoPlayer';

export default function Info() {
  const router = useRouter();
  const { id, type } = router.query;
  const { user } = useUser();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');
  // Datos de tabs
  const [episodes, setEpisodes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [openVideo, setOpenVideo] = useState(null);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!id || !type) return;
    setLoading(true);
    const controller = new AbortController();
    const fetchData = async () => {
      let url = '';
      if (type === 'manga') url = `https://api.jikan.moe/v4/manga/${id}`;
      else if (type === 'anime') url = `https://api.jikan.moe/v4/anime/${id}`;
      else if (type === 'character') url = `https://api.jikan.moe/v4/characters/${id}`;
      if (!url) return;
      try {
        const res = await fetch(url, { signal: controller.signal, cache: 'force-cache' });
        const data = await res.json();
        setItem(data.data);
      } catch (e) {
        if (e.name !== 'AbortError') setItem(null);
      }
      setLoading(false);
    };
    fetchData();
    return () => controller.abort();
  }, [id, type]);

  // Verificar si es favorito
  useEffect(() => {
    if (user && id && type) {
      isFavorite({ user_id: user.id, item_id: id, item_type: type }).then(setFav);
    }
  }, [user, id, type]);

  // Manejar agregar/quitar favorito
  const handleFav = async () => {
    if (!user || !item) return;
    if (fav) {
      await removeFavorite({ user_id: user.id, item_id: id, item_type: type });
      setFav(false);
    } else {
      await addFavorite({
        user_id: user.id,
        item_id: id,
        item_type: type,
        item_title: item.title || item.name,
        item_image: item.images?.jpg?.image_url || item.images?.webp?.image_url || ''
      });
      setFav(true);
    }
  };

  // Carga dinámica de datos de cada tab
  useEffect(() => {
    if (!id || !type || tab === 'info' || tabLoading) return;
    setTabLoading(true);
    const controller = new AbortController();
    const fetchTab = async () => {
      try {
        let res, data;
        if (tab === 'episodes' && type === 'anime') {
          res = await fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`, { signal: controller.signal, cache: 'force-cache' });
          data = await res.json();
          setEpisodes(data.data || []);
        } else if (tab === 'videos' && type === 'anime') {
          res = await fetch(`https://api.jikan.moe/v4/anime/${id}/videos`, { signal: controller.signal, cache: 'force-cache' });
          data = await res.json();
          setVideos(data.data || {});
        } else if (tab === 'characters') {
          res = await fetch(`https://api.jikan.moe/v4/${type}/${id}/characters`, { signal: controller.signal, cache: 'force-cache' });
          data = await res.json();
          setCharacters(data.data || []);
        } else if (tab === 'recommendations') {
          res = await fetch(`https://api.jikan.moe/v4/${type}/${id}/recommendations`, { signal: controller.signal, cache: 'force-cache' });
          data = await res.json();
          setRecommendations(data.data || []);
        } else if ((tab === 'openings' || tab === 'endings') && type === 'anime') {
          setOpenings(item?.theme?.openings || []);
          setEndings(item?.theme?.endings || []);
        } else if (tab === 'authors' && type === 'manga') {
          setAuthors(item?.authors || []);
        } else if (tab === 'adaptations') {
          setAdaptations(item?.relations || []);
        }
      } catch {}
      setTabLoading(false);
    };
    fetchTab();
    return () => controller.abort();
    // eslint-disable-next-line
  }, [tab, id, type]);

  if (loading) return (
    <main className={styles.main}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2.5rem 0' }}>
        <span style={{
          display: 'inline-block',
          width: 32,
          height: 32,
          border: '4px solid #eabf9f',
          borderTop: '4px solid #b71c1c',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: 12
        }} />
        <span style={{ color: '#b71c1c', fontWeight: 600, fontSize: 18, letterSpacing: 1 }}>Cargando...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  );
  if (!item) return <main className={styles.main}><p>No encontrado.</p></main>;

  // Tabs disponibles
  const tabs = [
    { key: 'info', label: 'Info' },
    ...(type === 'anime' ? [
      { key: 'videos', label: 'Videos' },
    ] : []),
    { key: 'characters', label: 'Personajes' },
    { key: 'recommendations', label: 'Recomendaciones' },
    ...(type === 'manga' ? [
    ] : [])
  ];

  // Si es personaje, solo mostrar la ficha de personaje y el botón de regresar
  if (type === 'character' && item) {
    return (
      <main className={styles.main}>
        <button onClick={() => router.back()} className={styles.backBtn}>Regresar</button>
        <div className={tabsStyles.tabPanel}>
          <img src={item.images?.jpg?.image_url || item.images?.webp?.image_url} alt={item.name} className={styles.img} />
          <h1 className={styles.title}>{item.name}</h1>
          {item.name_kanji && <p><b>Kanji:</b> {item.name_kanji}</p>}
          {item.nicknames && item.nicknames.length > 0 && <p><b>Apodos:</b> {item.nicknames.join(', ')}</p>}
          {item.about && <p className={styles.synopsis}><b>Descripción:</b> {item.about}</p>}
          <p><b>Popularidad:</b> #{item.popularity || 'N/A'} | <b>Favoritos:</b> {item.favorites || 0}</p>
          {/* Apariciones */}
          {item.anime && item.anime.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <b style={{ color: '#b71c1c' }}>Apariciones en Anime:</b>
              <ul style={{ paddingLeft: 0 }}>
                {item.anime.map(a => (
                  <li key={a.anime.mal_id} style={{ marginBottom: 6 }}>
                    <img src={a.anime.images?.jpg?.image_url} alt={a.anime.title} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', marginRight: 8, verticalAlign: 'middle' }} />
                    <b>{a.anime.title}</b> <span style={{ color: '#7c4700', fontSize: 13 }}>({a.role})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.manga && item.manga.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <b style={{ color: '#b71c1c' }}>Apariciones en Manga:</b>
              <ul style={{ paddingLeft: 0 }}>
                {item.manga.map(m => (
                  <li key={m.manga.mal_id} style={{ marginBottom: 6 }}>
                    <img src={m.manga.images?.jpg?.image_url} alt={m.manga.title} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', marginRight: 8, verticalAlign: 'middle' }} />
                    <b>{m.manga.title}</b> <span style={{ color: '#7c4700', fontSize: 13 }}>({m.role})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Seiyuus */}
          {item.voices && item.voices.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <b style={{ color: '#b71c1c' }}>Seiyuus:</b>
              <ul style={{ paddingLeft: 0 }}>
                {item.voices.map(v => (
                  <li key={v.person.mal_id} style={{ marginBottom: 6 }}>
                    <img src={v.person.images?.jpg?.image_url} alt={v.person.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 8, verticalAlign: 'middle' }} />
                    <b>{v.person.name}</b> <span style={{ color: '#7c4700', fontSize: 13 }}>({v.language})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div style={{
        maxWidth: 1200,
        margin: '2rem auto',
        borderRadius: 18,
        boxShadow: '0 4px 24px rgba(183,28,28,0.08)',
        background: 'linear-gradient(120deg, #fff6e9 0%, #fbeee6 100%)',
        border: '3px solid #eabf9f',
        fontFamily: `'Noto Sans JP', 'Noto Serif JP', 'Yu Mincho', serif`,
        padding: 0,
        position: 'relative',
        width: '100%'
      }}>
        {/* Pestañas */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          overflow: 'hidden',
          background: 'transparent',
          borderBottom: '2px solid #eabf9f',
        }}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={tabsStyles.tabBtn + (tab === t.key ? ' ' + tabsStyles.active : '')}
              onClick={() => setTab(t.key)}
              tabIndex={0}
              aria-selected={tab === t.key}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 0,
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? '#b71c1c' : '#7c4700',
                fontWeight: tab === t.key ? 700 : 500,
                fontSize: 18,
                padding: '1.1rem 0',
                cursor: 'pointer',
                borderBottom: tab === t.key ? 'none' : '2px solid #eabf9f',
                transition: 'background 0.18s, color 0.18s',
                outline: 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Contenido */}
        <div style={{
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          background: '#fff',
          padding: '2.2rem 2rem',
          width: '100%',
          maxWidth: '90%',
          margin: '0 auto',
          minHeight: 300,
        }}>
          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <img src={item.images?.jpg?.image_url || item.images?.webp?.image_url} alt={item.title || item.name} className={styles.img} style={{ marginBottom: 18 }} />
              <h1 className={styles.title} style={{ marginBottom: 10, textAlign: 'center' }}>{item.title || item.name}</h1>
              {/* Botón de favoritos */}
              {user && (
                <button
                  onClick={handleFav}
                  style={{ background: fav ? '#d32f2f' : '#b71c1c', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 16, padding: '8px 24px', marginBottom: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span role="img" aria-label={fav ? 'quitar favorito' : 'agregar favorito'}>{fav ? '❌' : '❤️'}</span>
                  {fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                </button>
              )}
              {type === 'anime' && <p className={styles.type}><b>Tipo:</b> Anime</p>}
              {type === 'manga' && <p className={styles.type}><b>Tipo:</b> Manga</p>}
              {item.rank && <p className={styles.rank}><b>Ranking:</b> #{item.rank}</p>}
              {item.synopsis && <p className={styles.synopsis}><b>Sinopsis:</b> {item.synopsis}</p>}
              {type === 'manga' && item.volumes && <p><b>Volúmenes:</b> {item.volumes}</p>}
              {type === 'anime' && item.episodes && <p><b>Episodios:</b> {item.episodes}</p>}
              {item.status && <p><b>Estado:</b> {item.status}</p>}
              {item.aired?.string && <p><b>Emitido:</b> {item.aired.string}</p>}
              {item.published?.string && <p><b>Publicado:</b> {item.published.string}</p>}
              {item.genres && item.genres.length > 0 && <p><b>Géneros:</b> {item.genres.map(g => g.name).join(', ')}</p>}
            </div>
          )}
          {tab === 'videos' && (
            tabLoading ? <p>Cargando videos...</p> : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', width: '100%' }}>
                {videos.promo && videos.promo.length > 0 ? 
                  videos.promo.map((video, index) => (
                    <VideoPlayer 
                      key={index}
                      video={video}
                      index={index}
                      openVideo={openVideo}
                      setOpenVideo={setOpenVideo}
                    />
                  ))
                  : <p>No hay videos promocionales.</p>
                }
              </div>
            )
          )}
          {tab === 'characters' && (
            tabLoading ? <p>Cargando personajes...</p> : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', maxWidth: 900, margin: '0 auto', alignItems: 'stretch' }}>
                {characters.length === 0 ? <p>No hay personajes.</p> : characters.map(c => (
                  <div key={c.character.mal_id} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #b71c1c22', padding: 18, minWidth: 220, maxWidth: 260, flex: '1 1 220px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', border: '2px solid #eabf9f', transition: 'box-shadow 0.2s', margin: '16px', boxSizing: 'border-box', height: '100%' }}
                    onClick={() => router.push(`/info?id=${c.character.mal_id}&type=character`)}
                    title="Ver ficha de personaje"
                  >
                    <img src={c.character.images?.jpg?.image_url} alt={c.character.name} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, boxShadow: '0 2px 8px #b71c1c22', border: '3px solid #eabf9f' }} />
                    <b style={{ fontSize: 17, color: '#b71c1c', textAlign: 'center' }}>{c.character.name}</b>
                    {c.role && <span style={{ color: '#7c4700', fontSize: 14, margin: '4px 0' }}>({c.role})</span>}
                    {c.voice_actors && c.voice_actors.length > 0 && (
                      <span style={{ color: '#1976d2', fontSize: 13, marginTop: 4, textAlign: 'center' }}>Seiyuu: {c.voice_actors[0].name}</span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
          {tab === 'recommendations' && (
            tabLoading ? <p>Cargando recomendaciones...</p> : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', maxWidth: 1200, margin: '0 auto' }}>
                {recommendations.length === 0 ? <p>No hay recomendaciones.</p> : recommendations.map(r => (
                  <div key={r.entry.mal_id} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #b71c1c22', padding: 18, minWidth: 220, maxWidth: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px solid #eabf9f', marginBottom: 12 }}>
                    <img src={r.entry.images?.jpg?.image_url} alt={r.entry.title} style={{ width: 100, height: 140, borderRadius: 12, objectFit: 'cover', marginBottom: 12, boxShadow: '0 2px 8px #b71c1c22', border: '2px solid #eabf9f' }} />
                    <b style={{ fontSize: 17, color: '#b71c1c', textAlign: 'center', marginBottom: 6 }}>{r.entry.title}</b>
                    <span style={{ color: '#7c4700', fontSize: 14, marginBottom: 4 }}>{r.votes} votos</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
