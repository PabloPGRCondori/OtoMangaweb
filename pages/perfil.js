import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseclient';
import styles from './styles/perfil.module.css';
import { useRouter } from 'next/router';
import useUser from '../lib/useUser';
import { addFavorite, removeFavorite, isFavorite, getFavorites } from '../lib/favorites';

export default function Perfil() {
  const { user, loading, updateUser, logout } = useUser();
  const [desc, setDesc] = useState('');
  const [edit, setEdit] = useState(false);
  const [msg, setMsg] = useState('');
  const [photo, setPhoto] = useState('');
  const [editPhoto, setEditPhoto] = useState(false);
  const [name, setName] = useState('');
  const [editName, setEditName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fav, setFav] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(true);
  const fileInputRef = useRef();
  const nameInputRef = useRef();
  const descInputRef = useRef();
  const router = useRouter();
  const { item_id, item_type, item_title, item_image } = router.query;

  // Sincronizar datos de usuario
  useEffect(() => {
    if (user) {
      setDesc(user?.user_metadata?.desc || '');
      setPhoto(user?.user_metadata?.avatar_url || '');
      setName(user?.user_metadata?.name || user?.email?.split('@')[0] || '');
    }
  }, [user]);

  // Guardar descripción (con sanitización básica)
  const handleSave = useCallback(async () => {
    if (!user) return;
    const cleanDesc = desc.replace(/<[^>]+>/g, '').slice(0, 300);
    const { error } = await updateUser({ desc: cleanDesc });
    setMsg(error ? 'Error al guardar.' : 'Descripción guardada.');
    setEdit(false);
  }, [user, desc, updateUser]);

  // Guardar foto
  const handlePhotoSave = useCallback(async () => {
    if (!user) return;
    const { error } = await updateUser({ avatar_url: photo });
    setMsg(error ? 'Error al actualizar foto.' : 'Foto de perfil actualizada.');
    setEditPhoto(false);
  }, [user, photo, updateUser]);

  // Guardar nombre (con sanitización básica)
  const handleNameSave = useCallback(async () => {
    if (!user) return;
    const cleanName = name.replace(/<[^>]+>/g, '').slice(0, 40);
    const { error } = await updateUser({ name: cleanName });
    setMsg(error ? 'Error al actualizar nombre.' : 'Nombre actualizado.');
    setEditName(false);
  }, [user, name, updateUser]);

  // Subir imagen a Supabase Storage (validación de tipo/tamaño)
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      setMsg('Solo se permiten imágenes.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB
      setMsg('La imagen es demasiado grande (máx 2MB).');
      return;
    }
    setUploading(true);
    const filePath = `avatars/${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      setMsg('Error al subir imagen: ' + uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setPhoto(data.publicUrl);
    setMsg('Imagen subida. Haz clic en Guardar para aplicar.');
    setUploading(false);
  }, [user]);

  // Cerrar sesión
  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/');
  }, [logout, router]);

  // Limpiar mensajes después de 3s
  useEffect(() => {
    if (msg) {
      const t = setTimeout(() => setMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [msg]);

  // Enfocar input al editar nombre o descripción
  useEffect(() => {
    if (editName && nameInputRef.current) nameInputRef.current.focus();
    if (edit && descInputRef.current) descInputRef.current.focus();
  }, [editName, edit]);

  // Verificar si es favorito al cargar
  useEffect(() => {
    if (user && item_id && item_type) {
      isFavorite({ user_id: user.id, item_id, item_type }).then(setFav);
    }
  }, [user, item_id, item_type]);

  // Obtener favoritos del usuario al cargar el perfil
  useEffect(() => {
    if (user) {
      setLoadingFavs(true);
      getFavorites(user.id).then(({ data }) => {
        setFavorites(data || []);
        setLoadingFavs(false);
      });
    }
  }, [user]);

  // Manejar agregar/quitar favorito
  const handleFav = async () => {
    if (!user) return;
    if (fav) {
      await removeFavorite({ user_id: user.id, item_id, item_type });
      setFav(false);
    } else {
      await addFavorite({ user_id: user.id, item_id, item_type, item_title, item_image });
      setFav(true);
    }
  };

  // Quitar favorito desde el perfil
  const handleRemoveFav = async (fav) => {
    await removeFavorite({ user_id: user.id, item_id: fav.item_id, item_type: fav.item_type });
    setFavorites(favorites.filter(f => f.id !== fav.id));
  };

  if (loading) return <main className={styles.main}><h2>Cargando usuario...</h2></main>;
  if (!user) return <main className={styles.main}><h2>No autenticado.</h2></main>;

  // Detectar si el usuario es de Google
  const isGoogle = user?.app_metadata?.provider === 'google';

  return (
    <main
      className={`${styles.main} ${styles.mainFull} perfil-anim-bg`}
      style={{
        backgroundImage: `linear-gradient(120deg, #fff6e9cc 0%, #fbeee6cc 100%), url('/fondo/bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        animation: 'perfilBgFadeIn 1.2s cubic-bezier(.4,0,.2,1) both',
      }}
    >
      <div className={`${styles.perfilRow} ${styles.perfilCard} perfil-anim-card`} style={{
        background: 'rgba(255,246,233,0.92)',
        boxShadow: '0 8px 40px #b71c1c33, 0 1.5px 0 #fff6e9',
        animation: 'perfilCardPop 1.1s cubic-bezier(.39,.575,.565,1) both',
        backdropFilter: 'blur(2.5px)',
      }}>
        {/* Imagen de perfil */}
        <div className={styles.avatarBox} style={{ animation: 'perfilAvatarIn 1.2s cubic-bezier(.39,.575,.565,1) both' }}>
          <div style={{ position: 'relative', marginBottom: 0 }}>
            <img
              src={photo || '/user.svg'}
              alt="Perfil"
              className={`${styles.avatarImg} perfil-anim-avatar`}
              style={{ boxShadow: '0 4px 32px #b71c1c33', animation: 'perfilAvatarPop 1.2s cubic-bezier(.39,.575,.565,1) both' }}
            />
            {/* Botón de editar foto solo si no es Google */}
            {!isGoogle && (
              <button
                onClick={() => setEditPhoto(true)}
                className={`${styles.actionBtn} ${styles.editPhotoBtn}`}
                title="Cambiar foto"
                disabled={uploading}
                style={{ animation: 'perfilBtnFadeIn 1.5s 0.5s both' }}
              >
                <span role="img" aria-label="cámara">📷</span>
              </button>
            )}
          </div>
          {/* Edición de foto */}
          {editPhoto && !isGoogle && (
            <div style={{ width: '100%', marginBottom: 0, textAlign: 'center' }}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={uploading}
                className={styles.editPhotoInput}
              />
              <div className={styles.editPhotoBtns}>
                <button
                  onClick={handlePhotoSave}
                  disabled={uploading}
                  className={`${styles.actionBtn} ${styles.saveBtn}`}
                >
                  {uploading ? <span className="loader-mini" /> : <span role="img" aria-label="guardar">💾</span>} Guardar
                </button>
                <button
                  onClick={() => setEditPhoto(false)}
                  disabled={uploading}
                  className={`${styles.actionBtn} ${styles.cancelBtn}`}
                >
                  <span role="img" aria-label="cancelar">✖️</span> Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Datos de usuario */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', animation: 'perfilFadeInRight 1.2s cubic-bezier(.39,.575,.565,1) both' }}>
          {/* Nombre */}
          <div style={{ width: '100%', marginBottom: 0, textAlign: 'left' }}>
            <b style={{ color: '#b71c1c', fontSize: 22, letterSpacing: 1 }}>{!isGoogle && editName ? (
              <>
                <input type="text" ref={nameInputRef} value={name} onChange={e => setName(e.target.value)} className={styles.inputName} />
                <button onClick={handleNameSave} className={`${styles.actionBtn} ${styles.saveBtn} ${styles.editNameBtn}`}><span role="img" aria-label="guardar">💾</span>Guardar</button>
                <button onClick={() => setEditName(false)} className={`${styles.actionBtn} ${styles.cancelBtn} ${styles.editNameBtn}`}><span role="img" aria-label="cancelar">✖️</span>Cancelar</button>
              </>
            ) : (
              <>
                <span>{name || 'Sin nombre'}</span>
                {!isGoogle && <button onClick={() => setEditName(true)} className={`${styles.actionBtn} ${styles.editBtn} ${styles.editNameBtn}`}><span role="img" aria-label="editar">✏️</span>Editar</button>}
                {isGoogle && <span className={styles.notEditable}>(No editable con Google)</span>}
              </>
            )}</b>
          </div>
          {/* Correo */}
          <div style={{ width: '100%', marginBottom: 0, textAlign: 'left' }}>
            <span style={{ color: '#7c4700', fontSize: 15, letterSpacing: 0.5 }}>{user.email}</span>
          </div>
          {/* Descripción */}
          <div style={{ width: '100%', marginBottom: 0, textAlign: 'left' }}>
            <b style={{ color: '#b71c1c' }}>Descripción:</b><br />
            {edit ? (
              <>
                <textarea ref={descInputRef} value={desc} onChange={e => setDesc(e.target.value)} rows={3} className={styles.inputDesc} />
                <div className={styles.descBtns}>
                  <button onClick={handleSave} className={`${styles.actionBtn} ${styles.saveBtn}`}>
                    {uploading ? <span className="loader-mini" /> : <span role="img" aria-label="guardar">💾</span>} Guardar
                  </button>
                  <button onClick={() => setEdit(false)} className={`${styles.actionBtn} ${styles.cancelBtn}`}><span role="img" aria-label="cancelar">✖️</span>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <span>{desc || 'Sin descripción'}</span>
                <button onClick={() => setEdit(true)} className={`${styles.actionBtn} ${styles.editBtn}`}><span role="img" aria-label="editar">✏️</span>Editar</button>
              </>
            )}
          </div>
          {/* Botón de favorito */}
          {item_id && item_type && (
            <div>
              <button
                onClick={handleFav}
                className={fav ? `${styles.actionBtn} ${styles.favBtn} ${styles.favBtnActive}` : `${styles.actionBtn} ${styles.favBtn}`}
              >
                <span role="img" aria-label={fav ? 'quitar favorito' : 'agregar favorito'}>{fav ? '❌' : '❤️'}</span>
                {fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              </button>
            </div>
          )}
          <button onClick={handleLogout} className={`${styles.actionBtn} ${styles.logoutBtn}`}><span role="img" aria-label="salir">🚪</span>Cerrar sesión</button>
          {msg && <p className={styles.msg}>{msg}</p>}
        </div>
      </div>

      {/* Imagen decorativa del perfil */}
      <div style={{ 
        position: 'fixed', 
        top: '50%',
        transform: 'translateY(-50%)',
        width: '100vw',
        height: '300px',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        {/* personaje-mitad.png - margen derecho */}
        <img 
          src="/costadoPerfil/personaje-mitad.png" 
          alt="Personaje mitad" 
          style={{
            position: 'absolute',
            right: '-45px',
            top: '50%',
            transform: 'translateY(-50%)',
            height: '300px',
            width: 'auto',
            objectFit: 'contain',
            zIndex: 2,
            opacity: 0.7
          }}
        />
      </div>

      {/* Favoritos del usuario */}
      <div className={styles.favsBox} style={{ animation: 'perfilFadeInUp 1.2s cubic-bezier(.39,.575,.565,1) both' }}>
        <h2 className={styles.favsTitle}>Mis favoritos</h2>
        {loadingFavs ? <p>Cargando favoritos...</p> : (
          favorites.length === 0 ? <p className={styles.favsEmpty}>No tienes favoritos aún.</p> :
          <div className={styles.favsList}>
            {favorites.map(fav => (
              <div key={fav.id} className={styles.favCard} style={{ animation: 'perfilCardFadeIn 0.7s cubic-bezier(.39,.575,.565,1) both' }}>
                <img src={fav.item_image} alt={fav.item_title} className={styles.favImg} />
                <div className={styles.favTitle}>{fav.item_title}</div>
                <div className={styles.favType}>{fav.item_type}</div>
                <button onClick={() => handleRemoveFav(fav)} className={`${styles.actionBtn} ${styles.favRemoveBtn}`}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes perfilBgFadeIn {
          0% { opacity: 0; filter: blur(8px); }
          100% { opacity: 1; filter: none; }
        }
        @keyframes perfilCardPop {
          0% { opacity: 0; transform: scale(0.92) translateY(40px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes perfilAvatarPop {
          0% { opacity: 0; transform: scale(0.7) rotate(-10deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes perfilAvatarIn {
          0% { opacity: 0; transform: translateX(-60px); }
          100% { opacity: 1; transform: none; }
        }
        @keyframes perfilFadeInRight {
          0% { opacity: 0; transform: translateX(60px); }
          100% { opacity: 1; transform: none; }
        }
        @keyframes perfilFadeInUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: none; }
        }
        @keyframes perfilBtnFadeIn {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes perfilCardFadeIn {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: none; }
        }
        
        /* Clases globales para animaciones */
        .perfil-anim-bg {
          animation: perfilFadeInBg 1.2s cubic-bezier(.4,0,.2,1);
          background: linear-gradient(120deg, #fff6e9cc 0%, #fbeee6cc 100%), url('/fondo/bg.jpg') !important;
          background-size: cover !important;
          background-position: center !important;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        .perfil-anim-card {
          animation: perfilCardPop 0.9s cubic-bezier(.4,0,.2,1);
          background: rgba(255,246,233,0.92);
          box-shadow: 0 8px 40px #b71c1c33, 0 1.5px 0 #fff6e9;
          border-radius: 32px;
          border: 3.5px solid #eabf9f;
          backdrop-filter: blur(6px) saturate(1.2);
          transition: box-shadow 0.4s cubic-bezier(.4,0,.2,1), transform 0.4s cubic-bezier(.4,0,.2,1);
        }

        .perfil-anim-avatar {
          transition: box-shadow 0.35s cubic-bezier(.4,0,.2,1), transform 0.35s cubic-bezier(.4,0,.2,1);
          will-change: box-shadow, transform;
          box-shadow: 0 4px 32px #b71c1c33;
          border: 5px solid #fff6e9;
          background: #fff6e9;
        }

        .perfil-anim-avatar:hover {
          box-shadow: 0 8px 48px #b71c1c55;
          border: 5px solid #eabf9f;
          transform: scale(1.04) rotate(-2deg);
        }

        .perfil-anim-card button, .perfil-anim-card .actionBtn {
          transition: background 0.22s, color 0.22s, box-shadow 0.22s, transform 0.22s;
          will-change: background, color, box-shadow, transform;
        }

        .perfil-anim-card button:hover:not(:disabled),
        .perfil-anim-card .actionBtn:hover:not(:disabled) {
          background: #eabf9f;
          color: #b71c1c;
          box-shadow: 0 4px 16px #b71c1c33;
          transform: translateY(-2px) scale(1.04);
        }

        .loader-mini {
          display: inline-block;
          width: 1.1em;
          height: 1.1em;
          border: 2.5px solid #fff6e9;
          border-top: 2.5px solid #b71c1c;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 4px;
          vertical-align: middle;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes perfilFadeInBg {
          from { opacity: 0; filter: blur(8px); }
          to { opacity: 1; filter: blur(0); }
        }
        
        /* Estilos para inputs y textareas */
        input[type="text"] {
          transition: border 0.22s, box-shadow 0.22s, background 0.22s;
        }
        input[type="text"]:focus {
          border: 2px solid #b71c1c;
          background: #fff6e9;
          box-shadow: 0 2px 8px #eabf9f55;
          outline: none;
        }
        textarea {
          transition: border 0.22s, box-shadow 0.22s, background 0.22s;
        }
        textarea:focus {
          border: 2px solid #b71c1c;
          background: #fff6e9;
          box-shadow: 0 2px 8px #eabf9f55;
          outline: none;
        }
        input[type="file"] {
          transition: border 0.22s, box-shadow 0.22s, background 0.22s;
        }
      `}</style>
    </main>
  );
}