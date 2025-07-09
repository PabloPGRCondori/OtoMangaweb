import { supabase } from './supabaseclient';

// Login con Google usando redirección a la IP de AWS
export async function loginWithGoogle() {
  const { user, session, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://3.21.127.251:3000' // Cambia aquí si tu IP cambia
    }
  });
  return { user, session, error };
}
