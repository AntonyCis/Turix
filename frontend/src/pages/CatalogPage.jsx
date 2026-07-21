import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import TripCard from '../components/TripCard';
import SearchBar from '../components/SearchBar';

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } };

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
    } catch (err) { console.error('Error fetching trips:', err); } finally { setLoading(false); }
  }, [search, selectedCategory]);
  useEffect(() => { api.get('/trips/categories').then((res) => setCategories(res.data.categories)).catch(console.error); }, []);
  useEffect(() => { fetchTrips(1); }, [fetchTrips]);
  return (
    <div className="catalog-page fade-in">
      <section className="explore-hero">
        <div className="explore-hero__image" /><div className="explore-hero__glow" />
        <div className="container explore-hero__content"><motion.section className="hero hero--editorial" variants={containerVariants} initial="hidden" animate="visible">
          <motion.p className="hero__eyebrow" variants={itemVariants}><span /> Viajes curados en Ecuador</motion.p>
          <h1 className="hero__title">
            <motion.span className="hero__title-line hero__title-line--lead" variants={itemVariants}><em>Ecuador</em></motion.span>
            <motion.span className="hero__title-line hero__title-line--sub" variants={itemVariants}>como nunca antes</motion.span>
          </h1>
          <motion.p className="hero__subtitle" variants={itemVariants}>Viajes de autor para quienes quieren sentir la vida en cada coordenada.</motion.p>
          <motion.div variants={itemVariants}><SearchBar search={search} onSearchChange={setSearch} categories={categories} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} /></motion.div>
          <motion.div className="hero__proof" variants={itemVariants}><span><b>4.9/5</b> viajeros nos recomiendan</span><span className="hero__proof-rule" /><span><b>100%</b> experiencias locales</span></motion.div>
        </motion.section></div>
        <div className="explore-hero__scroll" aria-hidden="true"><span /> Descubrir</div>
      </section>
      <div className="container catalog-content">
        <section className="catalog-intro"><div><p className="section-kicker">Selección curada</p><h2>Encuentra tu próxima historia.</h2></div><p>Rutas diseñadas para ir más lejos, con el respaldo de expertos locales en cada destino.</p></section>
        {categories.length > 0 && <div className="filters" aria-label="Filtrar por experiencia"><button className={`filter-pill ${!selectedCategory ? 'filter-pill--active' : ''}`} onClick={() => setSelectedCategory('')}>Todas</button>{categories.map((category) => <button key={category.id} className={`filter-pill ${String(selectedCategory) === String(category.id) ? 'filter-pill--active' : ''}`} onClick={() => setSelectedCategory(category.id)}><span>{category.icon}</span>{category.name}</button>)}</div>}
        {loading ? <div className="spinner"><div className="spinner__circle" /></div> : trips.length === 0 ? <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}><div className="empty-state__icon">⌕</div><p className="empty-state__text">No se encontraron viajes</p><p className="empty-state__subtext">Intenta con otros filtros de búsqueda</p></motion.div> : <>
          <p className="catalog-results"><span>{pagination.total}</span> viaje{pagination.total !== 1 ? 's' : ''} seleccionado{pagination.total !== 1 ? 's' : ''} para ti</p>
          <motion.div className="trips-grid" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            {trips.map((trip, index) => <TripCard key={trip.id} trip={trip} index={index} />)}
          </motion.div>
          {pagination.pages > 1 && <div className="pagination">{Array.from({ length: pagination.pages }, (_, index) => index + 1).map((page) => <button key={page} onClick={() => fetchTrips(page)} className={`btn ${page === pagination.page ? 'btn--primary' : 'btn--secondary'} btn--sm`}>{page}</button>)}</div>}
        </>}
      </div>
    </div>
  );
}
export default CatalogPage;
