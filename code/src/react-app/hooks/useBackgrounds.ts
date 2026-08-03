import { useState, useEffect } from 'react';

interface BackgroundsMap {
  [key: string]: string;
}

// Cache backgrounds to avoid repeated fetches
let backgroundsCache: BackgroundsMap | null = null;
let fetchPromise: Promise<BackgroundsMap> | null = null;

async function fetchBackgrounds(): Promise<BackgroundsMap> {
  if (backgroundsCache) return backgroundsCache;
  
  if (fetchPromise) return fetchPromise;
  
  fetchPromise = fetch('/api/public/backgrounds', { cache: 'no-store' })
    .then(res => res.json())
    .then((data: Record<string, string>) => {
      // A API devolve um objeto plano { "home_hero": url, ... }.
      // getBackground(page, section) usa a chave "page/section", então convertemos
      // o primeiro "_" em "/" (ex.: "home_hero" -> "home/hero").
      const map: BackgroundsMap = {};
      Object.entries(data || {}).forEach(([k, v]) => {
        const i = k.indexOf('_');
        const key = i > 0 ? `${k.slice(0, i)}/${k.slice(i + 1)}` : k;
        if (v) map[key] = v;
      });
      backgroundsCache = map;
      return map;
    })
    .catch(() => {
      // Return empty map on error
      return {};
    });
  
  return fetchPromise;
}

export function useBackgrounds() {
  const [backgrounds, setBackgrounds] = useState<BackgroundsMap>(backgroundsCache || {});
  const [loading, setLoading] = useState(!backgroundsCache);

  useEffect(() => {
    if (backgroundsCache) {
      setBackgrounds(backgroundsCache);
      setLoading(false);
      return;
    }

    fetchBackgrounds().then(map => {
      setBackgrounds(map);
      setLoading(false);
    });
  }, []);

  const getBackground = (page: string, section: string, fallback?: string): string => {
    const key = `${page}/${section}`;
    return backgrounds[key] || fallback || '';
  };

  return { backgrounds, loading, getBackground };
}

// Preload backgrounds on app start
export function preloadBackgrounds() {
  fetchBackgrounds();
}
