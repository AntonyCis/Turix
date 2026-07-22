import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const pin = L.divIcon({ className: 'turix-map-icon', html: '<span class="turix-map-marker turix-map-marker--active"></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
const defaultPosition = [-1.45, -78.45];

function PickerEvents({ position, onChange }) {
  const map = useMap();
  useMapEvents({ click: (event) => onChange(event.latlng) });
  useEffect(() => { map.setView(position, Math.max(map.getZoom(), 7), { animate: true }); }, [map, position]);
  const markerRef = useRef(null);
  return <Marker position={position} icon={pin} draggable eventHandlers={{ dragend: () => onChange(markerRef.current.getLatLng()) }} ref={markerRef} />;
}

function LocationPicker({ latitude, longitude, onChange }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const position = Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : defaultPosition;
  return (
    <div className="location-picker">
      <p>Haz clic en el mapa o arrastra el marcador para definir la ubicación exacta.</p>
      <MapContainer className="location-picker__map" center={position} zoom={6} scrollWheelZoom>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <PickerEvents position={position} onChange={(point) => onChange({ latitude: point.lat.toFixed(7), longitude: point.lng.toFixed(7) })} />
      </MapContainer>
    </div>
  );
}

export default LocationPicker;
