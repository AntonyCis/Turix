import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const locations = {
  'GAL-001': { coords: [-0.74, -90.31], region: 'Islas Galápagos', island: true },
  'QUI-001': { coords: [-0.18, -78.47], region: 'Quito · Sierra' },
  'MON-001': { coords: [-1.83, -80.75], region: 'Montañita · Costa' },
  'YAS-001': { coords: [-0.67, -76.4], region: 'Yasuní · Amazonía' },
  'CUE-001': { coords: [-2.9, -79.0], region: 'Cuenca · Sierra' },
  'BAN-001': { coords: [-1.4, -78.42], region: 'Baños · Sierra' },
  'OTA-001': { coords: [0.23, -78.26], region: 'Otavalo · Sierra' },
  'MAN-001': { coords: [-1.55, -80.81], region: 'Puerto López · Costa' }
};

function getLocation(trip) {
  const latitude = Number(trip.latitude);
  const longitude = Number(trip.longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { coords: [latitude, longitude], region: trip.destination, island: trip.code === 'GAL-001' };
  }
  return locations[trip.code];
}

function markerIcon(active) {
  return L.divIcon({
    className: 'turix-map-icon',
    html: `<span class="turix-map-marker ${active ? 'turix-map-marker--active' : ''}"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
}

function MapViewport({ trip }) {
  const map = useMap();
  useEffect(() => {
    const location = trip && getLocation(trip);
    if (location) map.flyTo(location.coords, location.island ? 7 : 7, { duration: 0.8 });
  }, [map, trip]);
  return null;
}

function EcuadorMap({ trips, activeTripId, onTripSelect }) {
  const mappedTrips = trips.filter(getLocation);
  const activeTrip = mappedTrips.find((trip) => trip.id === activeTripId) || mappedTrips[0];
  const galapagosTrip = mappedTrips.find((trip) => getLocation(trip)?.island);

  return (
    <section className="ecuador-map" aria-label="Mapa de experiencias en Ecuador">
      <div className="ecuador-map__heading">
        <div><p className="section-kicker">Explora por territorio</p><h2>Ecuador en el mapa.</h2></div>
        <p>Los marcadores usan coordenadas reales: haz zoom, mueve el mapa o selecciona un destino para explorar.</p>
      </div>
      <div className="ecuador-map__canvas">
        <MapContainer className="ecuador-leaflet" center={[-1.45, -78.45]} zoom={6} minZoom={5} scrollWheelZoom>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapViewport trip={activeTrip} />
          {mappedTrips.map((trip) => <Marker key={trip.id} position={getLocation(trip).coords} icon={markerIcon(trip.id === activeTrip?.id)} eventHandlers={{ click: () => onTripSelect(trip.id) }} />)}
        </MapContainer>
        {galapagosTrip && <button type="button" className={`galapagos-inset ${activeTrip?.id === galapagosTrip.id ? 'galapagos-inset--active' : ''}`} onClick={() => onTripSelect(galapagosTrip.id)}><span aria-hidden="true">◌</span><div><small>Océano Pacífico · 1.000 km</small><strong>Ver Islas Galápagos</strong></div></button>}
        {activeTrip && <div className="ecuador-map__card"><span>{getLocation(activeTrip)?.region}</span><strong>{activeTrip.name}</strong><small>{Number(activeTrip.is_bookable) === 1 ? `Desde $${Number(activeTrip.price).toLocaleString('es-EC')}` : `Explorar · Jerarquia ${activeTrip.hierarchy || 'N/D'}`}</small></div>}
      </div>
    </section>
  );
}

export default EcuadorMap;
