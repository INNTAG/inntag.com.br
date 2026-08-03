import { useState, useEffect } from 'react';

interface Background {
  page_key: string;
  section_key: string;
  image_url: string | null;
  fallback_url: string;
}

interface BackgroundsMap {
  [key: string]: string;
}

// Cache backgrounds to avoid repeated fetches
let backgroundsCache: BackgroundsMap | null = null;
let fetchPromise: Promise<BackgroundsMap> | null = null;

async function fetchBackgrounds(): Promise<BackgroundsMap> {
  if (backgroundsCache) return backgroundsCache;
  
  if (fetchPromise) return fetchPromise;
  
  fetchPromise = fetch('/api/public/backgrounds')
    .then(res => res.json())
    .then((data: Background[]) => {
      const map: BackgroundsMap = {};
      data.forEach(bg => {
        const key = `${bg.page_key}/${bg.section_key}`;
        map[key] = bg.image_url || bg.fallback_url;
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
