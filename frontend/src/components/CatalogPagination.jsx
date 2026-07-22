import { useEffect, useState } from 'react';

function visiblePages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total]);
  for (let page = current - 1; page <= current + 1; page += 1) if (page > 1 && page < total) pages.add(page);
  const ordered = [...pages].sort((a, b) => a - b);
  return ordered.flatMap((page, index) => index > 0 && page - ordered[index - 1] > 1 ? ['ellipsis', page] : [page]);
}

function CatalogPagination({ pagination, onPageChange, disabled }) {
  const { page, pages, total, limit } = pagination;
  const [requestedPage, setRequestedPage] = useState(String(page));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);
  useEffect(() => setRequestedPage(String(page)), [page]);

  const submitPage = (event) => {
    event.preventDefault();
    onPageChange(Math.min(Math.max(Number(requestedPage) || 1, 1), pages));
  };

  return (
    <nav className="catalog-pagination" aria-label="Paginacion del catalogo">
      <p>Mostrando <strong>{rangeStart}-{rangeEnd}</strong> de <strong>{total}</strong> atractivos</p>
      <div className="catalog-pagination__controls">
        <button type="button" className="catalog-pagination__arrow" onClick={() => onPageChange(page - 1)} disabled={disabled || page === 1} aria-label="Pagina anterior">←</button>
        <div className="catalog-pagination__pages">
          {visiblePages(page, pages).map((item, index) => item === 'ellipsis' ? <span key={`ellipsis-${index}`} className="catalog-pagination__ellipsis">…</span> : <button key={item} type="button" onClick={() => onPageChange(item)} disabled={disabled} className={item === page ? 'is-active' : ''} aria-current={item === page ? 'page' : undefined}>{item}</button>)}
        </div>
        <button type="button" className="catalog-pagination__arrow" onClick={() => onPageChange(page + 1)} disabled={disabled || page === pages} aria-label="Pagina siguiente">→</button>
        <form className="catalog-pagination__jump" onSubmit={submitPage}>
          <label htmlFor="catalog-page">Ir a</label>
          <input id="catalog-page" type="number" min="1" max={pages} value={requestedPage} onChange={(event) => setRequestedPage(event.target.value)} disabled={disabled} />
        </form>
      </div>
    </nav>
  );
}

export default CatalogPagination;
