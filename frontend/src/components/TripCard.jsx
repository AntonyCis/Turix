import { Link } from 'react-router-dom';

function TripCard({ trip, index = 0 }) {
  const imageUrl = trip.image_url || `https://picsum.photos/seed/${trip.code}/800/1000`;

  return (
    <article className="card">
      <Link to={`/trips/${trip.id}`} className="card__image-link" aria-label={`Ver detalles de ${trip.name}`}>
        <img
          src={imageUrl}
          alt={trip.name}
          className="card__image"
          loading={index < 3 ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={index < 3 ? 'high' : 'auto'}
        />
        <span className="card__image-overlay" />
        <span className="card__category"><span>{trip.category_icon || '◆'}</span> {trip.category_name}</span>
        <span className="card__view" aria-hidden="true">Ver viaje <b>↗</b></span>
      </Link>
      <div className="card__body">
        <Link to={`/trips/${trip.id}`} className="card__title-link"><h3 className="card__title">{trip.name}</h3></Link>
        <p className="card__description">{trip.description}</p>
        <div className="card__footer">
          <div className="card__meta">
            <span className="card__meta-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5.1 7-12A7 7 0 1 0 5 9c0 6.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2"/></svg>{trip.destination}</span>
            <span className="card__meta-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/></svg>{trip.duration_days} dia{trip.duration_days > 1 ? 's' : ''}</span>
          </div>
          <div className="card__price">${Number(trip.price).toLocaleString('es-EC', { minimumFractionDigits: 2 })}<small>/ persona</small></div>
        </div>
      </div>
    </article>
  );
}

export default TripCard;
