import { useEffect, useState } from "react";

export interface Coords {
  lat: number;
  lng: number;
}

// Madrid centro como fallback
const FALLBACK: Coords = { lat: 40.4168, lng: -3.7038 };

export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setCoords(FALLBACK);
      setError("Geolocalización no disponible");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setCoords(FALLBACK);
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  return { coords: coords ?? FALLBACK, error, loading, isFallback: !coords };
}
