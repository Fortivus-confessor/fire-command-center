import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.vectorgrid';

interface VectorTileLayerProps {
  url: string;
  layerName: string;
}

export function VectorTileLayer({ url, layerName }: VectorTileLayerProps) {
  const map = useMap();

  useEffect(() => {
    const vectorTileOptions = {
      vectorTileLayerStyles: {
        [layerName]: {
          weight: 1,
          fillColor: '#ff4d4d',
          color: '#ff4d4d',
          fillOpacity: 0.8,
          radius: 5
        }
      },
      interactive: true,
    };

    // @ts-ignore
    const layer = L.vectorGrid.protobuf(url, vectorTileOptions).addTo(map);

    layer.on('click', (e: any) => {
      const properties = e.layer.properties;
      L.popup()
        .setContent(`
          <div style="padding: 5px;">
            <b>Foco de Calor (NASA)</b><br/>
            FRP: ${properties.frp} MW<br/>
            Confiança: ${properties.confidence}<br/>
            Satélite: ${properties.satellite}
          </div>
        `)
        .setLatLng(e.latlng)
        .openOn(map);
    });

    return () => {
      map.removeLayer(layer);
    };
  }, [map, url, layerName]);

  return null;
}
