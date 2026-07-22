import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTravelPlanner } from '../context/TravelPlannerContext';

function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { toggleSaved, isSaved } = useTravelPlanner();
  const [trip, setTrip] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get(`/trips/${id}`).then(async (res) => {
      if (!mounted) return;
      const currentTrip = res.data.trip;
      setTrip(currentTrip);
      try {
        const related = await api.get('/trips', { params: { category: currentTrip.category_id, province: currentTrip.province, limit: 4 } });
        if (mounted) setRecommendations(related.data.trips.filter((item) => item.id !== currentTrip.id).slice(0, 3));
      } catch { /* Related places do not block the detail page. */ }
    }).catch(() => navigate('/')).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id, navigate]);

  const handleAddToCart = () => {
    addItem(trip, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="spinner"><div className="spinner__circle" /></div>;
  if (!trip) return null;

  const isBookable = trip.is_bookable === true || Number(trip.is_bookable) === 1;
  const imageUrl = trip.image_url || `https://picsum.photos/seed/${trip.code}/1200/800`;
  const availability = trip.available_slots === 0 ? 'Sin cupos' : trip.available_slots <= 5 ? `Ultimos ${trip.available_slots} cupos` : `${trip.available_slots} cupos disponibles`;
  const facts = [
    ['Provincia', trip.province],
    ['Canton', trip.canton],
    ['Parroquia', trip.parish],
    ['Tipo', trip.attraction_type],
    ['Subtipo', trip.attraction_subtype],
    ['Jerarquia turistica', trip.hierarchy]
  ].filter(([, value]) => value);

  return (
    <div className="experience-page fade-in">
      <div className="container">
        <Link to="/" className="experience-back">Volver a explorar</Link>
        <div className="trip-detail trip-detail--experience">
          <section className="experience-main">
            <div className="experience-visual"><img src={imageUrl} alt={trip.name} className="trip-detail__image" /><span className="experience-visual__shade" /><span className="experience-visual__tag">{trip.category_icon} {trip.category_name}</span></div>
            <header className="experience-heading">
              <p className="section-kicker">{isBookable ? 'Experiencia Turix' : 'Ficha turistica georreferenciada'}</p>
              <h1>{trip.name}</h1>
              <p className="trip-detail__destination">{trip.destination}</p>
              <p>{trip.description}</p>
            </header>
            {isBookable ? <section className="experience-highlights">
              <div><span>Duracion</span><strong>{trip.duration_days} {trip.duration_days === 1 ? 'dia' : 'dias'}</strong></div>
              <div><span>Grupo</span><strong>Maximo 12 personas</strong></div>
              <div><span>Nivel</span><strong>Todos los niveles</strong></div>
              <div><span>Idioma</span><strong>Espanol e ingles</strong></div>
            </section> : <section className="experience-section">
              <div className="experience-section__title"><p className="section-kicker">Datos del atractivo</p><h2>Ubicalo, conocelo, visitarlo.</h2></div>
              <div className="included-grid">{facts.map(([label, value]) => <div key={label}><h3>{label}</h3><p>{value}</p></div>)}</div>
            </section>}
            {!isBookable && <section className="experience-section experience-section--included"><div className="experience-section__title"><p className="section-kicker">Antes de ir</p><h2>Planifica con informacion local.</h2></div><div className="included-grid"><div><h3>Coordenadas</h3><p>{trip.latitude && trip.longitude ? `${Number(trip.latitude).toFixed(6)}, ${Number(trip.longitude).toFixed(6)}` : 'Ubicacion por confirmar'}</p></div><div><h3>Importante</h3><p>Esta ficha sirve para explorar el destino. Verifica horarios, accesos y servicios locales antes de tu visita.</p></div></div></section>}
          </section>
          <aside className="trip-detail__sidebar experience-booking">
            <button type="button" className={`save-trip ${isSaved(trip.id) ? 'save-trip--active' : ''}`} onClick={() => toggleSaved(trip)}>{isSaved(trip.id) ? 'Guardado' : 'Guardar atractivo'}</button>
            {isBookable ? <>
              <p className="experience-booking__label">Desde</p><div className="trip-detail__price">${Number(trip.price).toLocaleString('es-EC', { minimumFractionDigits: 2 })}<small> / persona</small></div>
              <p className={`availability ${trip.available_slots <= 5 ? 'availability--low' : ''}`}><span /> {availability}</p>
              <div className="quantity-selector"><span>Cantidad</span><button className="quantity-selector__btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Reducir cantidad">-</button><span className="quantity-selector__value">{quantity}</span><button className="quantity-selector__btn" onClick={() => setQuantity(Math.min(trip.available_slots, quantity + 1))} aria-label="Aumentar cantidad" disabled={trip.available_slots === 0}>+</button></div>
              {isAuthenticated ? <button className="btn btn--primary btn--full btn--lg" onClick={handleAddToCart} disabled={trip.available_slots === 0}>{trip.available_slots === 0 ? 'Sin cupos disponibles' : added ? 'Agregado al carrito' : 'Reservar esta experiencia'}</button> : <button className="btn btn--primary btn--full btn--lg" onClick={() => navigate('/login')}>Inicia sesion para reservar</button>}
            </> : <>
              <p className="experience-booking__label">Explora el territorio</p><div className="trip-detail__price">Jerarquia {trip.hierarchy || 'N/D'}</div>
              <p className="availability"><span /> Ubicacion registrada en el mapa</p>
              <Link className="btn btn--primary btn--full btn--lg" to={`/?search=${encodeURIComponent(trip.name)}`}>Ver en el catalogo</Link>
              <p className="experience-booking__note">Informacion oficial del inventario turistico. Confirma condiciones de visita localmente.</p>
            </>}
          </aside>
        </div>
        {recommendations.length > 0 && <section className="experience-related"><div className="experience-section__title"><p className="section-kicker">Sigue explorando</p><h2>Otros lugares cercanos.</h2></div><div className="related-grid">{recommendations.map((item) => <Link key={item.id} to={`/trips/${item.id}`} className="related-card"><img src={item.image_url || `https://picsum.photos/seed/${item.code}/600/400`} alt="" loading="lazy" /><span>{item.category_icon} {item.category_name}</span><strong>{item.name}</strong><small>{item.canton || item.destination}</small></Link>)}</div></section>}
      </div>
    </div>
  );
}

export default TripDetailPage;
