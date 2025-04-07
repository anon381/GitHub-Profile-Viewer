export default function RepoList({ repos, pageRepos, currentPage, totalPages, goPage }) {
  if (!repos.length) return null;
  return (
    <section className="repo-section bordered" aria-labelledby="repo-heading">
      <header className="repo-header">
        <h3 id="repo-heading" className="repo-title">Repositories <span className="count">({repos.length})</span></h3>
      </header>
      <ul className="repo-two-col">
        {pageRepos.map((repo, idx) => (
          <li key={repo.id} className="repo-card reveal" style={{'--delay': `${idx * 35}ms`}}>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="repo-name">{repo.name}</a>
            <span className="repo-stars" aria-label="Stars">★ {repo.stargazers_count}</span>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <nav className="pagination" aria-label="Repository pagination">
          <button onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
          <span className="page-indicator">Page {currentPage} / {totalPages}</span>
          <button onClick={() => goPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
        </nav>
      )}
    </section>
  );
}
