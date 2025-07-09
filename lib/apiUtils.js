// Utilidades centralizadas para APIs optimizadas
import { useState, useEffect, useCallback } from 'react';
import { fetchWithCache } from '../pages/_app';

// URLs base de la API de Jikan
const JIKAN_BASE = 'https://api.jikan.moe/v4';

// Endpoints comunes
export const API_ENDPOINTS = {
  topAnime: (limit = 8, filter = 'bypopularity', year = new Date().getFullYear()) => 
    `${JIKAN_BASE}/top/anime?filter=${filter}&limit=${limit}&year=${year}`,
  topManga: (limit = 8, filter = 'bypopularity') => 
    `${JIKAN_BASE}/top/manga?filter=${filter}&limit=${limit}`,
  topCharacters: (limit = 8) => 
    `${JIKAN_BASE}/top/characters?limit=${limit}`,
  searchAnime: (query, limit = 8) => 
    `${JIKAN_BASE}/anime?limit=${limit}&q=${encodeURIComponent(query)}`,
  searchManga: (query, limit = 8) => 
    `${JIKAN_BASE}/manga?limit=${limit}&q=${encodeURIComponent(query)}`,
  searchCharacters: (query, limit = 8) => 
    `${JIKAN_BASE}/characters?limit=${limit}&q=${encodeURIComponent(query)}`
};

// Hook personalizado para cargar datos de API
export const useApiData = (endpoint, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchWithCache(endpoint);
      setData(result.data || result);
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para búsqueda con debounce
export const useSearch = (query, searchType = 'all', debounceMs = 300) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce del query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Búsqueda cuando cambia el query con debounce
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const searchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const promises = [];
        
        if (searchType === 'all' || searchType === 'anime') {
          promises.push(
            fetchWithCache(API_ENDPOINTS.searchAnime(debouncedQuery))
              .then(data => (data.data || []).map(item => ({ ...item, _type: 'anime' })))
          );
        }
        
        if (searchType === 'all' || searchType === 'manga') {
          promises.push(
            fetchWithCache(API_ENDPOINTS.searchManga(debouncedQuery))
              .then(data => (data.data || []).map(item => ({ ...item, _type: 'manga' })))
          );
        }
        
        if (searchType === 'all' || searchType === 'character') {
          promises.push(
            fetchWithCache(API_ENDPOINTS.searchCharacters(debouncedQuery))
              .then(data => (data.data || []).map(item => ({ ...item, _type: 'character' })))
          );
        }

        const results = await Promise.all(promises);
        const combinedResults = results.flat();
        setResults(combinedResults);
      } catch (err) {
        setError(err.message);
        console.error('Search Error:', err);
      } finally {
        setLoading(false);
      }
    };

    searchData();
  }, [debouncedQuery, searchType]);

  return { results, loading, error };
};

// Endpoints comunes
export const ENDPOINTS = {
  TOP_ANIME: 'https://api.jikan.moe/v4/top/anime',
  TOP_MANGA: 'https://api.jikan.moe/v4/top/manga',
  TOP_CHARACTERS: 'https://api.jikan.moe/v4/top/characters',
  ANIME_SEARCH: 'https://api.jikan.moe/v4/anime',
  MANGA_SEARCH: 'https://api.jikan.moe/v4/manga',
  CHARACTER_SEARCH: 'https://api.jikan.moe/v4/characters',
  ANIME_DETAILS: 'https://api.jikan.moe/v4/anime',
  MANGA_DETAILS: 'https://api.jikan.moe/v4/manga',
  CHARACTER_DETAILS: 'https://api.jikan.moe/v4/characters',
  ANIME_SEASON: 'https://api.jikan.moe/v4/seasons'
};

// Función para construir URLs con parámetros
export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
};

// Función optimizada para múltiples requests paralelos
export const fetchMultiple = async (requests) => {
  try {
    const promises = requests.map(request => 
      fetchWithCache(typeof request === 'string' ? request : request.url)
    );
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Error in fetchMultiple:', error);
    return requests.map(() => ({ data: [] }));
  }
};

// Función específica para top content
export const fetchTopContent = async (type = 'anime', limit = 10, filter = 'bypopularity') => {
  const endpoint = type === 'anime' ? ENDPOINTS.TOP_ANIME : 
                  type === 'manga' ? ENDPOINTS.TOP_MANGA : 
                  ENDPOINTS.TOP_CHARACTERS;
  
  const url = buildUrl(endpoint, { limit, filter });
  const data = await fetchWithCache(url);
  return Array.isArray(data.data) ? data.data : [];
};

// Función específica para búsquedas
export const searchContent = async (query, type = 'anime', limit = 10) => {
  const endpoint = type === 'anime' ? ENDPOINTS.ANIME_SEARCH : 
                  type === 'manga' ? ENDPOINTS.MANGA_SEARCH : 
                  ENDPOINTS.CHARACTER_SEARCH;
  
  const url = buildUrl(endpoint, { q: query, limit });
  const data = await fetchWithCache(url);
  return Array.isArray(data.data) ? data.data : [];
};

// Función para buscar en múltiples tipos
export const searchMultipleTypes = async (query, limit = 8) => {
  const requests = [
    searchContent(query, 'anime', limit),
    searchContent(query, 'manga', limit),
    searchContent(query, 'characters', limit)
  ];
  
  const [animes, mangas, characters] = await Promise.all(requests);
  return { animes, mangas, characters };
};

// Función para obtener detalles de un item
export const getItemDetails = async (id, type) => {
  const endpoint = type === 'anime' ? ENDPOINTS.ANIME_DETAILS : 
                  type === 'manga' ? ENDPOINTS.MANGA_DETAILS : 
                  ENDPOINTS.CHARACTER_DETAILS;
  
  const url = `${endpoint}/${id}`;
  const data = await fetchWithCache(url);
  return data.data;
};

// Función para temporadas
export const getSeasonContent = async (year, season) => {
  const url = `${ENDPOINTS.ANIME_SEASON}/${year}/${season}`;
  const data = await fetchWithCache(url);
  return Array.isArray(data.data) ? data.data : [];
};

// Hook para múltiples requests con loading
export const useMultipleApiData = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFunction();
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, loading, error };
};
