function SearchBar({ search, onSearchChange, categories, selectedCategory, onCategoryChange, provinces, selectedProvince, onProvinceChange }) {
  return (
    <div className="search-bar">
      <label className="search-bar__field search-bar__field--destination">
        <span className="search-bar__field-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/></svg></span>
        <span className="search-bar__field-copy"><small>Destino</small><input type="text" className="search-bar__input" placeholder="¿A donde quieres ir?" value={search} onChange={(e) => onSearchChange(e.target.value)} /></span>
      </label>
      <label className="search-bar__field search-bar__field--category">
        <span className="search-bar__field-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21s7-5.1 7-12A7 7 0 1 0 5 9c0 6.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2"/></svg></span>
        <span className="search-bar__field-copy"><small>Experiencia</small><select className="search-bar__select" value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)}><option value="">Todas las experiencias</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}</select></span>
      </label>
      <label className="search-bar__field search-bar__field--province">
        <span className="search-bar__field-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21s7-5.1 7-12A7 7 0 1 0 5 9c0 6.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2"/></svg></span>
        <span className="search-bar__field-copy"><small>Provincia</small><select className="search-bar__select" value={selectedProvince} onChange={(e) => onProvinceChange(e.target.value)}><option value="">Todo Ecuador</option>{provinces.map((province) => <option key={province.value} value={province.value}>{province.value} ({province.total})</option>)}</select></span>
      </label>
      <button type="button" className="search-bar__submit" aria-label="Buscar experiencias"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/></svg><span>Buscar</span></button>
    </div>
  );
}

export default SearchBar;
