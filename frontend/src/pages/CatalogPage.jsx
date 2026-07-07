import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import TripCard from '../components/TripCard';
import SearchBar from '../components/SearchBar';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const titleWords = ['Descubre', 'Ecuador'];

function CatalogPage() {
  const [trips, setTrips] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;

      const res = await api.get('/trips', { params });
      setTrips(res.data.trips);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    api.get('/trips/categories')
      .then((res) => setCategories(res.data.categories))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchTrips(1);
  }, [fetchTrips]);

  const handleSearch = (value) => {
    setSearch(value);
  };

  const handleCategory = (value) => {
    setSelectedCategory(value);
  };

  return (
    <div className="page fade-in">
      <div className="container">
        <motion.section
          className="hero"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h1 className="hero__title">
            {titleWords.map((word, i) => (
              <motion.span
                key={word}
                variants={itemVariants}
                style={{ display: 'inline-block', marginRight: '0.3em' }}
                className={i === 1 ? 'hero__title--accent' : ''}
              >
                {i === 1 ? <span>{word}</span> : word}
              </motion.span>
            ))}
          </h1>
          <motion.p className="hero__subtitle" variants={itemVariants}>
            Explora destinos únicos, desde las Islas Galápagos hasta la selva amazónica.
          </motion.p>
          <motion.div variants={itemVariants}>
            <SearchBar
              search={search}
              onSearchChange={handleSearch}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategory}
            />
          </motion.div>
        </motion.section>

        {loading ? (
          <div className="spinner"><div className="spinner__circle" /></div>
        ) : trips.length === 0 ? (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="empty-state__icon">🔍</div>
            <p className="empty-state__text">No se encontraron viajes</p>
            <p className="empty-state__subtext">Intenta con otros filtros de búsqueda</p>
          </motion.div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {pagination.total} viaje{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
            </p>
            <div className="trips-grid">
              {trips.map((trip, index) => (
                <TripCard key={trip.id} trip={trip} index={index} />
              ))}
            </div>
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchTrips(p)}
                    className={`btn ${p === pagination.page ? 'btn--primary' : 'btn--secondary'} btn--sm`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CatalogPage;