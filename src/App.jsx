
import { useState, useMemo } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10; // paginate after 10; two-column layout starts at >5

  const fetchProfile = async (e) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setError('');
    setProfile(null);
    setRepos([]);
  try {
      const userRes = await fetch(`https://api.github.com/users/${username}`);
      if (!userRes.ok) throw new Error('User not found');
      const userData = await userRes.json();
      setProfile(userData);

      // Fetch ALL public repos (paginate up to 500 repos for safety)
      const allRepos = [];
      let page = 1;
      while (page <= 5) { // cap pages to avoid excessive requests
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`);
        if (!reposRes.ok) break;
        const batch = await reposRes.json();
        if (!Array.isArray(batch) || batch.length === 0) break;
        allRepos.push(...batch);
        if (batch.length < 100) break; // last page
        page++;
      }
      // Sort by last push date desc
      allRepos.sort((a,b)=> new Date(b.pushed_at) - new Date(a.pushed_at));
  setRepos(allRepos);
  setPage(1); // reset pagination
    } catch (err) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const languageStats = useMemo(() => {
    const tally = {};
    repos.forEach(r => { if (r.language) tally[r.language] = (tally[r.language] || 0) + 1; });
    const entries = Object.entries(tally).sort((a,b)=> b[1]-a[1]);
    const total = entries.reduce((acc, [,c])=> acc + c, 0);
    return entries.map(([lang,count]) => ({ lang, count, percent: total ? (count/total*100) : 0 }));
  }, [repos]);

  const topLanguages = languageStats.slice(0,8);

  const totalPages = Math.max(1, Math.ceil(repos.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRepos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return repos.slice(start, start + pageSize);
  }, [repos, currentPage]);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    // scroll to repo list smoothly
    const el = document.getElementById('repo-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="github-viewer">
      <h1>GitHub Profile Viewer</h1>
      <form onSubmit={fetchProfile} className="search-form">
        <input
          type="text"
          placeholder="Enter GitHub username"
          value={username}
          onChange={e => setUsername(e.target.value.trim())}
          required
        />
        <button type="submit" disabled={loading || !username}>Search</button>
      </form>
      {loading && <p>Loading...</p>}
      {error && <p style={{color: 'salmon'}}>{error}</p>}
      {profile && (
        <>
          <div className="profile-card">
            <img src={profile.avatar_url} alt={profile.login} className="avatar" />
            <h2>{profile.name || profile.login}</h2>
            {profile.bio && <p>{profile.bio}</p>}
            <p>
              <a href={profile.html_url} target="_blank" rel="noopener noreferrer">@{profile.login}</a>
            </p>
            <div className="stats">
              <span>Followers: {profile.followers}</span>
              <span>Following: {profile.following}</span>
              <span>Repos: {profile.public_repos}</span>
            </div>
          </div>

          <div className="panel-grid extra-stats">
            <img src={`https://github-readme-streak-stats.herokuapp.com/?user=${profile.login}&theme=tokyonight&hide_border=true`} alt="GitHub Streak" loading="lazy" />
            <img src={`https://github-readme-stats.vercel.app/api?username=${profile.login}&show_icons=true&theme=tokyonight&hide_border=true`} alt="GitHub Stats" loading="lazy" />
            <img src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${profile.login}&layout=compact&theme=tokyonight&hide_border=true`} alt="Top Languages (API)" loading="lazy" />
            <img src={`https://github-profile-trophy.vercel.app/?username=${profile.login}&theme=onedark&no-frame=true&row=2&column=3`} alt="GitHub Trophies" loading="lazy" />
            <img src={`https://ghchart.rshah.org/646cff/${profile.login}`} alt="Contribution Graph" loading="lazy" />
          </div>
        </>
      )}
      {topLanguages.length > 0 && (
        <div className="repo-list" style={{marginTop: '1.5rem'}}>
          <h3>Language Usage</h3>
          <ul style={{
            listStyle:'none',
            margin:0,
            padding:0,
            display:'grid',
            gap:'0.85rem',
            gridTemplateColumns: topLanguages.length > 5 ? 'repeat(auto-fit,minmax(240px,1fr))' : '1fr'
          }}>
            {topLanguages.map(l => (
              <li key={l.lang} style={{background:'#2b2d42', padding:'.65rem .75rem .9rem', borderRadius:'14px', position:'relative', overflow:'hidden'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'.75rem', marginBottom:'.35rem', fontWeight:600}}>
                  <span>{l.lang}</span>
                  <span>{l.count} · {l.percent.toFixed(1)}%</span>
                </div>
                <div style={{height:'8px', borderRadius:'5px', background:'#1f1f29', overflow:'hidden', boxShadow:'inset 0 0 0 1px #35384d'}}>
                  <div style={{width:`${l.percent}%`, height:'100%', background:'linear-gradient(90deg,#646cff,#4f54c0)', transition:'width .7s ease'}} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {repos.length > 0 && (
        <div className="repo-list" id="repo-section">
          <h3>Repositories ({repos.length})</h3>
          <ul className={repos.length > 5 ? 'repo-grid two-col' : ''}>
            {pageRepos.map(repo => (
              <li key={repo.id}>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">{repo.name}</a>
                <span>★ {repo.stargazers_count}</span>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
              <span>Page {currentPage} / {totalPages}</span>
              <button onClick={() => goPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
            </div>
          )}
        </div>
      )}
      <footer>Data from GitHub public API & community endpoints; images may be cached or rate limited.</footer>
    </div>
  );
}

export default App;
