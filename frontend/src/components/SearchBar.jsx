function SearchBar({ search, onSearchChange, categories, selectedCategory, onCategoryChange }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-bar__input"
        placeholder="Buscar destinos, aventuras..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="search-bar__select"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">Todas las categorías</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SearchBar;