import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import CatalogPagination from '../../components/CatalogPagination';

const initialStats = { total: 0, active: 0, inactive: 0, bookable: 0 };

function DashboardPage() {
  const [trips, setTrips] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 24 });
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [bookable, setBookable] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const [allResponse, inactiveResponse, bookableResponse] = await Promise.all([
      api.get('/trips', { params: { active: 'all', limit: 1 } }),
      api.get('/trips', { params: { active: 'false', limit: 1 } }),
      api.get('/trips', { params: { active: 'all', bookable: 'true', limit: 1 } })
    ]);
    const total = allResponse.data.pagination.total;
    const inactive = inactiveResponse.data.pagination.total;
    setStats({ total, inactive, active: total - inactive, bookable: bookableResponse.data.pagination.total });
  }, []);

  const fetchTrips = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 24 };
      if (status === 'all') params.active = 'all';
      if (status === 'inactive') params.active = 'false';
      if (bookable !== '') params.bookable = bookable;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const response = await api.get('/trips', { params });
      setTrips(response.data.trips);
      setPagination(response.data.pagination);
    } catch (error) { console.error('Error fetching trips:', error); } finally { setLoading(false); }
  }, [status, bookable, debouncedSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 280);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => { fetchStats().catch(console.error); }, [fetchStats]);
  useEffect(() => { fetchTrips(1); }, [fetchTrips]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Se desactivara este registro del catalogo. Podras seguir viendolo desde el filtro Inactivos.')) return;
    try {
      await api.delete(`/trips/${id}`);
      await Promise.all([fetchTrips(pagination.page), fetchStats()]);
    } catch (error) { console.error('Error deactivating trip:', error); }
  };
  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('active');
    setBookable('');
  };
  const changePage = (page) => {
    fetchTrips(page);
    document.querySelector('.admin-table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const hasFilters = Boolean(search || status !== 'active' || bookable !== '');

  return (
    <main className="admin-console fade-in">
      <div className="container">
        <header className="admin-console__hero">
          <div><p className="section-kicker">Operacion Turix</p><h1>Catalogo bajo control.</h1><p>Gestiona fichas, experiencias reservables y la presencia publica de cada destino.</p></div>
          <div className="admin-console__actions"><Link to="/admin/orders" className="btn btn--secondary">Ver reservas</Link><Link to="/admin/trips/new" className="btn btn--primary admin-console__create"><span>+</span> Nuevo registro</Link></div>
        </header>

        <section className="admin-stats" aria-label="Resumen del catalogo">
          <article><span>Catalogo total</span><strong>{stats.total.toLocaleString('es-EC')}</strong><small>fichas registradas</small></article>
          <article><span>Publicados</span><strong>{stats.active.toLocaleString('es-EC')}</strong><small>visibles al publico</small></article>
          <article><span>En borrador</span><strong>{stats.inactive.toLocaleString('es-EC')}</strong><small>registros inactivos</small></article>
          <article><span>Reservables</span><strong>{stats.bookable.toLocaleString('es-EC')}</strong><small>con cupos y precio</small></article>
        </section>

        <section className="admin-table-card">
          <div className="admin-table-card__top">
            <div><p className="section-kicker">Inventario</p><h2>Destinos y experiencias</h2></div>
            <span>{pagination.total.toLocaleString('es-EC')} resultados</span>
          </div>
          <div className="admin-toolbar">
            <label className="admin-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, codigo o destino" aria-label="Buscar por nombre, codigo o destino" /></label>
            <div className="admin-toolbar__filters">
              <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Estado de publicacion"><option value="active">Publicados</option><option value="inactive">Inactivos</option><option value="all">Todos los estados</option></select>
              <select value={bookable} onChange={(event) => setBookable(event.target.value)} aria-label="Disponibilidad de reserva"><option value="">Todo el catalogo</option><option value="true">Solo reservables</option><option value="false">Solo para explorar</option></select>
              {hasFilters && <button type="button" onClick={resetFilters}>Limpiar</button>}
            </div>
          </div>

          {loading ? <div className="admin-loading"><div className="spinner__circle" /><span>Actualizando inventario...</span></div> : trips.length === 0 ? <div className="admin-empty"><strong>No hay registros con esos filtros.</strong><button className="btn btn--secondary btn--sm" type="button" onClick={resetFilters}>Limpiar filtros</button></div> : <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Destino</th><th>Codigo</th><th>Ubicacion</th><th>Modelo</th><th>Estado</th><th aria-label="Acciones" /></tr></thead><tbody>{trips.map((trip) => <tr key={trip.id}><td><div className="admin-trip"><strong>{trip.name}</strong><span>{trip.category_name} · {trip.attraction_type || 'Experiencia'}</span></div></td><td><code>{trip.code}</code></td><td><div className="admin-location"><strong>{trip.province || trip.destination}</strong><span>{trip.canton || trip.destination}</span></div></td><td>{Number(trip.is_bookable) === 1 ? <span className="admin-model admin-model--bookable">Reservable</span> : <span className="admin-model">Explorar</span>}</td><td><span className={`status-badge ${trip.is_active ? 'status-badge--active' : 'status-badge--inactive'}`}>{trip.is_active ? 'Publicado' : 'Inactivo'}</span></td><td><div className="admin-row-actions"><Link to={`/admin/trips/${trip.id}/edit`} className="btn btn--secondary btn--sm">Editar</Link>{trip.is_active && <button className="admin-deactivate" type="button" onClick={() => handleDeactivate(trip.id)}>Desactivar</button>}</div></td></tr>)}</tbody></table></div>}
          {!loading && pagination.pages > 1 && <CatalogPagination pagination={pagination} onPageChange={changePage} disabled={loading} />}
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
