import { lazy, Suspense } from 'react';

const MapClient = lazy(() => import('./LocationPickerMapClient'));

interface LocationPickerMapProps {
  initialPosition?: [number, number];
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
}

export function LocationPickerMap(props: LocationPickerMapProps) {
  // Verificação para rodar apenas no client-side (no build)
  if (typeof window === 'undefined') {
    return <div style={{ height: props.height || '300px' }} className="w-full bg-secondary/20 border border-border rounded-lg animate-pulse" />;
  }

  return (
    <Suspense fallback={<div style={{ height: props.height || '300px' }} className="w-full bg-secondary/20 border border-border rounded-lg animate-pulse flex items-center justify-center"><p className="text-muted-foreground text-sm">Carregando mapa...</p></div>}>
      <MapClient {...props} />
    </Suspense>
  );
}
