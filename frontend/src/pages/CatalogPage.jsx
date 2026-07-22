import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import TripCard from '../components/TripCard';
import SearchBar from '../components/SearchBar';
import CatalogPagination from '../components/CatalogPagination';
import { useTravelPlanner } from '../context/TravelPlannerContext';

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } };
const EcuadorMap = lazy(() => import('../components/EcuadorMap'));

function CatalogPage() {
  const [trips, setTrips] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ provinces: [], reservation: { bookable: 0, exploratory: 0 } });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedBookable, setSelectedBookable] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [activeTripId, setActiveTripId] = useState(null);
  const { compareTrips, toggleCompare, toggleSaved, isSaved, isCompared, clearCompare } = useTravelPlanner();

  const fetchTrips = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedProvince) params.province = selectedProvince;
      if (selectedBookable !== '') params.bookable = selectedBookable;
      const response = await api.get('/trips', { params });
      setTrips(response.data.trips);
      setActiveTripId(response.data.trips[0]?.id || null);
      setPagination(response.data.pagination);
    } catch (error) { console.error('Error fetching trips:', error); } finally { setLoading(false); }
  }, [debouncedSearch, selectedCategory, selectedProvince, selectedBookable]);

  useEffect(() => {
    Promise.all([api.get('/trips/categories'), api.get('/trips/filters')])
      .then(([categoriesResponse, filtersResponse]) => {
        setCategories(categoriesResponse.data.categories);
        setFilters(filtersResponse.data);
      }).catch(console.error);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 280);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => { fetchTrips(1); }, [fetchTrips]);

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedProvince('');
    setSelectedBookable('');
  };
  const changePage = (page) => {
    fetchTrips(page);
    document.querySelector('.catalog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const hasFilters = Boolean(search || selectedCategory || selectedProvince || selectedBookable !== '');

  return (
    <div className="catalog-page fade-in">
      <section className="explore-hero">
        <div className="explore-hero__image" /><div className="explore-hero__glow" />
        <div className="container explore-hero__content"><motion.section className="hero hero--editorial" variants={containerVariants} initial="hidden" animate="visible">
          <motion.p className="hero__eyebrow" variants={itemVariants}><span /> Viajes por todo el Ecuador</motion.p>
          <h1 className="hero__title"><motion.span className="hero__title-line hero__title-line--lead" variants={itemVariants}><em>Ecuador</em></motion.span><motion.span className="hero__title-line hero__title-line--sub" variants={itemVariants}>como nunca antes</motion.span></h1>
          <motion.p className="hero__subtitle" variants={itemVariants}>Viajes de autor para quienes quieren sentir la vida en cada coordenada.</motion.p>
          <motion.div variants={itemVariants}><SearchBar search={search} onSearchChange={setSearch} categories={categories} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} provinces={filters.provinces} selectedProvince={selectedProvince} onProvinceChange={setSelectedProvince} /></motion.div>
          <motion.div className="hero__proof" variants={itemVariants}><span><b>4.9/5</b> viajeros nos recomiendan</span><span className="hero__proof-rule" /><span><b>100%</b> experiencias locales</span></motion.div>
        </motion.section></div>
        <div className="explore-hero__scroll" aria-hidden="true"><span /> Descubrir</div>
      </section>
      <div className="container catalog-content">
        <section className="catalog-intro"><div><p className="section-kicker">Catalogo nacional</p><h2>1.216 razones para salir.</h2></div><p>Una seleccion georreferenciada de atractivos naturales y culturales de todo el Ecuador.</p></section>
        {categories.length > 0 && <div className="catalog-filter-panel">
          <div className="filters" aria-label="Filtrar por experiencia"><button className={`filter-pill ${!selectedCategory ? 'filter-pill--active' : ''}`} onClick={() => setSelectedCategory('')}>Todas</button>{categories.map((category) => <button key={category.id} className={`filter-pill ${String(selectedCategory) === String(category.id) ? 'filter-pill--active' : ''}`} onClick={() => setSelectedCategory(category.id)}><span>{category.icon}</span>{category.name}</button>)}</div>
          <div className="availability-filters" aria-label="Filtrar por disponibilidad de reserva"><span>Disponibilidad</span><button type="button" className={selectedBookable === '' ? 'is-active' : ''} onClick={() => setSelectedBookable('')}>Todo</button><button type="button" className={selectedBookable === 'true' ? 'is-active' : ''} onClick={() => setSelectedBookable('true')}>Reservables ({filters.reservation?.bookable || 0})</button><button type="button" className={selectedBookable === 'false' ? 'is-active' : ''} onClick={() => setSelectedBookable('false')}>Para explorar ({filters.reservation?.exploratory || 0})</button>{hasFilters && <button type="button" className="availability-filters__clear" onClick={resetFilters}>Limpiar</button>}</div>
        </div>}
        {loading ? <div className="spinner"><div className="spinner__circle" /></div> : trips.length === 0 ? <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}><div className="empty-state__icon">⌕</div><p className="empty-state__text">No se encontraron atractivos</p><p className="empty-state__subtext">Prueba otra provincia, categoria o disponibilidad.</p><button type="button" className="btn btn--secondary btn--sm" onClick={resetFilters}>Limpiar filtros</button></motion.div> : <>
          <p className="catalog-results"><span>{pagination.total}</span> atractivo{pagination.total !== 1 ? 's' : ''} seleccionado{pagination.total !== 1 ? 's' : ''} para ti</p>
          <Suspense fallback={<div className="map-loading">Cargando mapa de Ecuador...</div>}><EcuadorMap trips={trips} activeTripId={activeTripId} onTripSelect={setActiveTripId} /></Suspense>
          <motion.div className="trips-grid" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>{trips.map((trip, index) => <TripCard key={trip.id} trip={trip} index={index} saved={isSaved(trip.id)} compared={isCompared(trip.id)} onSave={toggleSaved} onCompare={toggleCompare} onFocus={() => setActiveTripId(trip.id)} />)}</motion.div>
          {pagination.pages > 1 && <CatalogPagination pagination={pagination} onPageChange={changePage} disabled={loading} />}
        </>}
      </div>
      {compareTrips.length > 0 && <aside className="compare-tray" aria-label="Comparador de atractivos"><div><span>Comparar atractivos</span><strong>{compareTrips.length} de 3 seleccionados</strong></div><div className="compare-tray__items">{compareTrips.map((trip) => <button key={trip.id} type="button" onClick={() => toggleCompare(trip)}>{trip.name}<b>x</b></button>)}</div><button className="btn btn--primary btn--sm" type="button" onClick={() => document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' })}>Ver comparacion</button></aside>}
      {compareTrips.length > 1 && <section id="comparison" className="comparison-section container"><div className="comparison-section__heading"><div><p className="section-kicker">Tu seleccion</p><h2>Compara antes de decidir.</h2></div><button type="button" className="btn btn--ghost btn--sm" onClick={clearCompare}>Limpiar seleccion</button></div><div className="comparison-grid">{compareTrips.map((trip) => <article key={trip.id} className="comparison-card"><span>{trip.category_icon} {trip.category_name}</span><h3>{trip.name}</h3><dl>{Number(trip.is_bookable) === 1 ? <><div><dt>Duracion</dt><dd>{trip.duration_days} dias</dd></div><div><dt>Cupos</dt><dd>{trip.available_slots} disponibles</dd></div><div><dt>Inversion</dt><dd>${Number(trip.price).toLocaleString('es-EC')}</dd></div></> : <><div><dt>Provincia</dt><dd>{trip.province}</dd></div><div><dt>Tipo</dt><dd>{trip.attraction_type}</dd></div><div><dt>Jerarquia</dt><dd>{trip.hierarchy || 'N/D'}</dd></div></>}</dl></article>)}</div></section>}
    </div>
  );
}

export default CatalogPage;
