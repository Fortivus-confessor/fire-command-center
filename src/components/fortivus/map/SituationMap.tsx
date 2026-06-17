import { lazy, Suspense, useEffect, useState } from 'react';

// Lazy-load the actual map to avoid SSR issues with Leaflet (which requires `window`)
const LeafletMap = lazy(() => import('./SituationMapClient'));

interface Props {
  selectedId?: string;
  onSelect?: (id: string) => void;
  onClickMap?: (lat: number, lng: number) => void;
  activePin?: { lat: number; lng: number } | null;
}

export function SituationMap(props: Props) {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (!isBrowser) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-secondary/40 grid place-items-center">
        <div className="glass rounded-lg px-4 py-3 text-xs mono text-muted-foreground animate-pulse">
          Carregando mapa situacional…
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-secondary/40 grid place-items-center">
          <div className="glass rounded-lg px-4 py-3 text-xs mono text-muted-foreground animate-pulse">
            Inicializando Leaflet…
          </div>
        </div>
      }
    >
      <LeafletMap {...props} />
    </Suspense>
  );
}
