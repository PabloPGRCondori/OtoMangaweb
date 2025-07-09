import Link from 'next/link';
import styles from './Navbar.module.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseclient';
import { getAgeRestriction, setAgeRestriction } from '../lib/ageRestriction';
import useUser from '../lib/useUser';

export default function Navbar() {
  const { user, loading, logout } = useUser();
  const [ageRestriction, setAgeRestrictionState] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setAgeRestrictionState(getAgeRestriction());
  }, []);

  // Cambia el switch y guarda en localStorage
  const handleSwitch = (e) => {
    setAgeRestrictionState(e.target.checked);
    setAgeRestriction(e.target.checked);
    
    // Disparar evento personalizado para notificar a otros componentes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ageRestrictionChanged', { 
        detail: { enabled: e.target.checked } 
      }));
    }
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.left}>
            <Link href="/">
              <button className={styles.logoBtn} type="button" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/logo.svg" alt="Logo" style={{ width: 36, height: 36, marginRight: 4, verticalAlign: 'middle' }} />
                OtoManga
              </button>
            </Link>
          </div>
          <div className={styles.center}>
            <Link href="/">
              <button className={styles.navBtn} type="button">
                Inicio
              </button>
            </Link>
            <Link href="/top">
              <button className={styles.navBtn} type="button">
                Top / Rankings
              </button>
            </Link>
            <Link href="/temporada">
              <button className={styles.navBtn} type="button">
                Temporada/Calendario
              </button>
            </Link>
          </div>
          <div className={styles.right}>
            {user ? (
              <img
                src={user.user_metadata?.avatar_url || '/user.svg'}
                alt="Perfil"
                style={{ width: 52, height: 52, borderRadius: '50%', cursor: 'pointer', border: '2.5px solid #fff6e9', objectFit: 'cover', verticalAlign: 'middle', boxShadow: '0 2px 8px #b71c1c22' }}
                onClick={() => router.push('/perfil')}
                title={user.user_metadata?.name || user.email}
              />
            ) : (
              <Link href="/login">
                <span className={styles.activeLink} style={{ fontSize: '1.1rem', padding: '0.3rem 1.2rem' }}>Iniciar sesión</span>
              </Link>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff6e9', fontWeight: 600, cursor: 'pointer', fontSize: '1.05em', marginLeft: 18 }}>
              <span style={{ fontSize: 28 }}>🔞</span> 
              <span className={styles.switch} title="Activar/desactivar restricción de contenido para adultos">
                <input
                  type="checkbox"
                  checked={ageRestriction}
                  onChange={handleSwitch}
                />
                <span className={styles.slider}></span>
              </span>
            </label>
          </div>
        </div>
      </nav>
    </>
  );
}
