import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.get(`/trips/${id}`)
      .then((res) => setTrip(res.data.trip))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = () => {
    addItem(trip, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return <div className="spinner"><div className="spinner__circle" /></div>;
  }

  if (!trip) return null;

  const imageUrl = trip.image_url || `https://picsum.photos/seed/${trip.code}/800/400`;

  return (
    <div className="page fade-in">
      <div className="container">
        <div className="trip-detail">
          <div>
            <img src={imageUrl} alt={trip.name} className="trip-detail__image" />
          </div>
          <div className="trip-detail__sidebar">
            <div className="trip-detail__category">
              {trip.category_icon} {trip.category_name}
            </div>
            <h1 className="trip-detail__title">{trip.name}</h1>
            <p className="trip-detail__destination">📍 {trip.destination}</p>
            <p className="trip-detail__description">{trip.description}</p>

            <div className="trip-detail__stats">
              <div className="trip-detail__stat">
                <div className="trip-detail__stat-value">{trip.duration_days}</div>
                <div className="trip-detail__stat-label">Días</div>
              </div>
              <div className="trip-detail__stat">
                <div className="trip-detail__stat-value">{trip.available_slots}</div>
                <div className="trip-detail__stat-label">Cupos</div>
              </div>
            </div>

            <div className="trip-detail__price">
              ${trip.price.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              <small> / persona</small>
            </div>

            <div className="quantity-selector">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cantidad:</span>
              <button
                className="quantity-selector__btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <span className="quantity-selector__value">{quantity}</span>
              <button
                className="quantity-selector__btn"
                onClick={() => setQuantity(Math.min(trip.available_slots, quantity + 1))}
              >
                +
              </button>
            </div>

            {isAuthenticated ? (
              <button
                className="btn btn--primary btn--full btn--lg"
                onClick={handleAddToCart}
                disabled={trip.available_slots === 0}
              >
                {trip.available_slots === 0 ? 'Sin cupos' : added ? '✓ Agregado' : 'Agregar al Carrito'}
              </button>
            ) : (
              <button
                className="btn btn--primary btn--full btn--lg"
                onClick={() => navigate('/login')}
              >
                Inicia sesión para reservar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripDetailPage;