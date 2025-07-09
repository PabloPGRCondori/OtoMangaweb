import { supabase } from './supabaseclient';

// Agregar favorito
export async function addFavorite({ user_id, item_id, item_type, item_title, item_image }) {
  return await supabase.from('favorites').insert([
    { user_id, item_id, item_type, item_title, item_image }
  ]);
}

// Quitar favorito
export async function removeFavorite({ user_id, item_id, item_type }) {
  return await supabase.from('favorites')
    .delete()
    .eq('user_id', user_id)
    .eq('item_id', item_id)
    .eq('item_type', item_type);
}

// Obtener favoritos del usuario
export async function getFavorites(user_id) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  return { data, error };
}

// Verificar si un item es favorito
export async function isFavorite({ user_id, item_id, item_type }) {
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user_id)
    .eq('item_id', item_id)
    .eq('item_type', item_type)
    .maybeSingle();
  return !!data;
}
