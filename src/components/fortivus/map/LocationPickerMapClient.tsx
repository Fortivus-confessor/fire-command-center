import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  LayersControl,
  GeoJSON,
} from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import "leaflet/dist/leaflet.css";

interface LocationPickerMapClientProps {
  initialPosition?: [number, number];
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
}

export default function LocationPickerMapClient({
  initialPosition = [-15.601, -56.097],
  onLocationSelect,
  height = "300px",
}: LocationPickerMapClientProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/brazil-states.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch(console.error);
  }, []);

  const actionPinHtml = renderToStaticMarkup(
    <div className="relative -top-4 -left-3 text-fire drop-shadow-md">
      <MapPin className="h-8 w-8" fill="currentColor" />
    </div>,
  );

  const dispatchPinHtml = renderToStaticMarkup(
    <div className="relative -top-4 -left-3 text-command drop-shadow-md">
      <MapPin className="h-8 w-8" fill="currentColor" />
    </div>,
  );

  const actionIcon = L.divIcon({
    html: actionPinHtml,
    className: "custom-pin-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  const dispatchIcon = L.divIcon({
    html: dispatchPinHtml,
    className: "custom-pin-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  function MapEvents() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        if (onLocationSelect) {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
      },
    });
    return null;
  }

  function MapInvalidator() {
    const map = useMapEvents({});
    useEffect(() => {
      const timer = setTimeout(() => {
        try {
          if (map) map.invalidateSize();
        } catch (e) {
          console.warn("Leaflet invalidateSize error ignored");
        }
      }, 200);
      return () => clearTimeout(timer);
    }, [map]);
    return null;
  }

  const brazilStyle = {
    color: "#f97316",
    weight: 2,
    opacity: 0.7,
    fillColor: "#f97316",
    fillOpacity: 0.05,
    dashArray: "6 3",
  };

  return (
    <div
      style={{
        height,
        width: "100%",
        borderRadius: "0.5rem",
        overflow: "hidden",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <MapContainer
        center={initialPosition}
        zoom={12}
        style={{ height: "100%", width: "100%", background: "#0d1117" }}
        scrollWheelZoom={true}
      >
        <MapInvalidator />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="🛰️ Google Satellite">
            <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" maxZoom={20} />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ Google Streets">
            <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" maxZoom={20} />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🌍 OpenStreetMap">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🌑 CartoDB Dark">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="🇧🇷 Contorno Brasil">
            {geoData && <GeoJSON key="brazil" data={geoData} style={brazilStyle} />}
          </LayersControl.Overlay>
        </LayersControl>

        <MapEvents />

        {/* Fixed Dispatch Pin */}
        {initialPosition && <Marker position={initialPosition} icon={dispatchIcon} />}

        {/* Action/Selected Pin */}
        {position && <Marker position={position} icon={actionIcon} />}
      </MapContainer>
    </div>
  );
}
