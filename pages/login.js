import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from './styles/login.module.css';
import { supabase } from '../lib/supabaseclient';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Completa todos los campos.');
      return;
    }
    try {
      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }
      if (result.error) throw result.error;
      if (typeof window !== 'undefined') {
        localStorage.setItem('otomanga_logged', 'true');
      }
      router.push('/');
    } catch (err) {
      setError(err.message || 'Error de autenticación');
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      // Redirección automática por Supabase, pero puedes forzar router.push('/') si usas redirectTo
    } catch (err) {
      setError('No se pudo iniciar sesión con Google');
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.box}>
        <h2>{isLogin ? 'Iniciar sesión' : 'Registrarse'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit">{isLogin ? 'Entrar' : 'Registrarse'}</button>
        </form>
        <button className={styles.googleBtn} onClick={handleGoogle}>
          <img src="/google.svg" alt="Google" className={styles.googleIcon} />
          Iniciar sesión con Google
        </button>
        <p className={styles.switchText}>
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <span className={styles.link} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </span>
        </p>
      </div>
    </main>
  );
}
