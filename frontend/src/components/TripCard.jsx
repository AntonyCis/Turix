import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function TripCard({ trip, index = 0 }) {
  const imageUrl = trip.image_url || `https://picsum.photos/seed/${trip.code}/400/300`;

  return (
    <motion.article
      className="card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <Link to={`/trips/${trip.id}`} className="card__image-link" aria-label={`Ver detalles de ${trip.name}`}>
        <img
          src={imageUrl}
          alt={trip.name}
          className="card__image"
          loading="lazy"
        />
      </Link>
      <div className="card__body">
        <div className="card__category">
          {trip.category_icon} {trip.category_name}
        </div>
        <Link to={`/trips/${trip.id}`} className="card__title-link">
          <h3 className="card__title">{trip.name}</h3>
        </Link>
        <p className="card__description">{trip.description}</p>
        <div className="card__footer">
          <div className="card__meta">
            <span className="card__meta-item">📍 {trip.destination}</span>
            <span className="card__meta-item">📅 {trip.duration_days} día{trip.duration_days > 1 ? 's' : ''}</span>
          </div>
          <div className="card__price">
            ${trip.price.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
            <small>/ persona</small>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default TripCard;