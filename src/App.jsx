
import { useState, useMemo, useEffect } from 'react';
import './App.css';

// Mapping some common language names to simple inline SVG logos or emoji fallback
const LANGUAGE_ICONS = {
  JavaScript: { fill: '#f7df1e', svg: '<circle cx="12" cy="12" r="11" fill="#f7df1e" />' },
  TypeScript: { fill: '#3178c6', svg: '<rect x="2" y="2" width="20" height="20" rx="4" fill="#3178c6" />' },
  Python: { fill: '#3776ab', svg: '<path fill="#3776ab" d="M6 4h6a4 4 0 0 1 4 4v2H8a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h2v-3H8a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H6z"/><path fill="#ffdf5b" d="M18 20h-6a4 4 0 0 1-4-4v-2h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4h-2v3h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H8a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h10z"/>' },
  Java: { fill: '#e11d21', svg: '<circle cx="12" cy="12" r="11" fill="#e11d21" />' },
  Go: { fill: '#00ADD8', svg: '<rect x="2" y="2" width="20" height="20" rx="6" fill="#00ADD8" />' },
  Rust: { fill: '#dea584', svg: '<circle cx="12" cy="12" r="11" fill="#dea584" />' },
  Ruby: { fill: '#cc342d', svg: '<rect x="3" y="3" width="18" height="18" rx="5" fill="#cc342d" />' },
  PHP: { fill: '#777bb4', svg: '<ellipse cx="12" cy="12" rx="11" ry="9" fill="#777bb4" />' },
  C: { fill: '#283593', svg: '<rect x="3" y="3" width="18" height="18" rx="4" fill="#283593" />' },
  'C++': { fill: '#00599C', svg: '<rect x="3" y="3" width="18" height="18" rx="4" fill="#00599C" />' },
  'C#': { fill: '#68217A', svg: '<rect x="3" y="3" width="18" height="18" rx="4" fill="#68217A" />' },
  HTML: { fill: '#e44d26', svg: '<rect x="2" y="2" width="20" height="20" rx="3" fill="#e44d26" />' },
  CSS: { fill: '#264de4', svg: '<rect x="2" y="2" width="20" height="20" rx="3" fill="#264de4" />' },
  Shell: { fill: '#89e051', svg: '<circle cx="12" cy="12" r="11" fill="#89e051" />' },
};

function LanguageUsage({ languages, byteAccurate }) {
  const [animatedPercents, setAnimatedPercents] = useState(() => languages.map(()=>0));
  useEffect(() => {
    let frame;
    const start = performance.now();
    const target = languages.map(l => l.percent);
    const duration = 900;
    const animate = (t) => {
      const progress = Math.min(1, (t - start) / duration);
      setAnimatedPercents(target.map(p => p * progress));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [languages]);
  return (
    <div className="repo-list" style={{marginTop:'1.5rem'}}>
      <h3>Language Usage {byteAccurate ? '(by bytes)' : '(by repo count)'} </h3>
      <ul style={{
        listStyle:'none',margin:0,padding:0,display:'grid',gap:'1rem',
        gridTemplateColumns: 'repeat(3, minmax(0,1fr))'
      }}>
        {languages.map((l, idx) => {
          const icon = LANGUAGE_ICONS[l.lang];
          const pctDisplay = l.percent.toFixed(1);
          const animated = animatedPercents[idx] || 0;
          return (
            <li key={l.lang} style={{background:'#2b2d42',padding:'.9rem 1rem 1.1rem',borderRadius:18, display:'flex', flexDirection:'column', gap:'.55rem', position:'relative', overflow:'hidden'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'.75rem'}}>
                <div style={{display:'flex', alignItems:'center', gap:'.6rem'}}>
                  <div style={{width:34,height:34,borderRadius:10,background:icon?icon.fill:'#444',display:'grid',placeItems:'center',boxShadow:'0 0 0 1px rgba(255,255,255,0.08)'}}>
                    {icon ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" dangerouslySetInnerHTML={{__html: icon.svg}} />
                    ) : (
                      <span style={{fontSize:'0.65rem'}}>{l.lang.slice(0,3).toUpperCase()}</span>
                    )}
                  </div>
                  <strong style={{fontSize:'.85rem', letterSpacing:'.3px'}}>{l.lang}</strong>
                </div>
                <span style={{fontSize:'.7rem', opacity:.75, fontWeight:600}}>{l.count} · {pctDisplay}%</span>
              </div>
              <div style={{height:'10px', borderRadius:6, background:'#1f1f29', overflow:'hidden', boxShadow:'inset 0 0 0 1px #35384d'}}>
                <div style={{width:`${animated}%`, height:'100%', background:'linear-gradient(90deg,#646cff,#4f54c0)', transition:'width .25s',}} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function App() {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [languageBytes, setLanguageBytes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const CACHE_TTL = 5 * 60 * 1000;
  const envToken = import.meta.env.VITE_GITHUB_TOKEN;
  const [userToken, setUserToken] = useState(() => localStorage.getItem('gpv_token') || '');
  const effectiveToken = (userToken || envToken || '').trim();
  const baseHeaders = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};

  // Fetch profile and repos
  const fetchProfile = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setProfile(null);
    setRepos([]);
    setLanguageBytes({});
    setPage(1);
    try {
      // Check cache
      const cacheKey = `gpv_cache_${username}`;
      const cache = localStorage.getItem(cacheKey);
      if (cache) {
        const { profile, repos, languageBytes, ts } = JSON.parse(cache);
        if (Date.now() - ts < CACHE_TTL) {
          setProfile(profile);
          setRepos(repos);
          setLanguageBytes(languageBytes);
          setLoading(false);
          return;
        }
      }
      // Fetch profile
      const resp = await fetch(`https://api.github.com/users/${username}`, { headers: baseHeaders });
      if (!resp.ok) throw new Error(resp.status === 404 ? 'User not found' : 'Error fetching profile');
      const profileData = await resp.json();
      setProfile(profileData);
      // Fetch repos (all pages)
      let allRepos = [];
      let pageNum = 1;
      while (true) {
        const repoResp = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&page=${pageNum}`,
          { headers: baseHeaders });
        if (!repoResp.ok) throw new Error('Error fetching repos');
        const repoPage = await repoResp.json();
        allRepos = allRepos.concat(repoPage);
        if (repoPage.length < 100) break;
        pageNum++;
      }
      setRepos(allRepos);
      // Fetch language bytes for each repo (limit to 30 for rate limit)
      const langBytes = {};
      await Promise.all(
        allRepos.slice(0, 30).map(async (repo) => {
          const langResp = await fetch(repo.languages_url, { headers: baseHeaders });
          if (langResp.ok) {
            const langs = await langResp.json();
            for (const [lang, bytes] of Object.entries(langs)) {
              langBytes[lang] = (langBytes[lang] || 0) + bytes;
            }
          }
        })
      );
      setLanguageBytes(langBytes);
      // Cache
      localStorage.setItem(cacheKey, JSON.stringify({ profile: profileData, repos: allRepos, languageBytes: langBytes, ts: Date.now() }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const languageStats = useMemo(() => {
    const entries = Object.keys(languageBytes).length
      ? Object.entries(languageBytes).map(([lang, bytes]) => ({ lang, bytes }))
      : (() => {
          const tally = {};
          repos.forEach(r => { if (r.language) tally[r.language] = (tally[r.language] || 0) + 1; });
          return Object.entries(tally).map(([lang, count]) => ({ lang, count }));
        })();
    const total = entries.reduce((acc, e) => acc + (e.bytes || e.count || 0), 0);
    return entries
      .map(e => ({
        lang: e.lang,
        count: e.count ?? undefined,
        bytes: e.bytes ?? undefined,
        percent: total ? ((e.bytes || e.count || 0) / total) * 100 : 0,
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [repos, languageBytes]);
  const topLanguages = languageStats;
  const totalPages = Math.max(1, Math.ceil(repos.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRepos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return repos.slice(start, start + pageSize);
  }, [repos, currentPage]);
  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className="github-viewer">
     
      <div id="top-bar">
        <div className="top-bar-center">
          <h1>GitHub Profile Viewer</h1>
          <form onSubmit={fetchProfile} className="search-form">
            <input
              type="text"
              placeholder="Enter GitHub username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Token (optional)"
              value={userToken}
              onChange={e => { setUserToken(e.target.value); localStorage.setItem('gpv_token', e.target.value); }}
              style={{ width: '170px' }}
            />
            <button type="submit" disabled={loading || !username}>Search</button>
          </form>
        </div>
      </div>
      <div className="main-content-under-header">
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'salmon' }}>{error}</p>}
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
              <div className="stats-img-wrap"><img src={`https://github-readme-streak-stats.herokuapp.com/?user=${profile.login}&theme=tokyonight&hide_border=true`} alt="GitHub Streak" loading="lazy" /></div>
              <div className="stats-img-wrap"><img src={`https://github-readme-stats.vercel.app/api?username=${profile.login}&show_icons=true&theme=tokyonight&hide_border=true`} alt="GitHub Stats" loading="lazy" /></div>
              <div className="stats-img-wrap"><img src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${profile.login}&layout=compact&theme=tokyonight&hide_border=true`} alt="Top Languages (API)" loading="lazy" /></div>
              <div className="stats-img-wrap"><img src={`https://github-profile-trophy.vercel.app/?username=${profile.login}&theme=onedark&no-frame=true&row=2&column=3`} alt="GitHub Trophies" loading="lazy" /></div>
              <div className="stats-img-wrap"><img src={`https://ghchart.rshah.org/646cff/${profile.login}`} alt="Contribution Graph" loading="lazy" /></div>
            </div>
          </>
        )}
        {topLanguages.length > 0 && (
          <LanguageUsage languages={topLanguages} byteAccurate={Object.keys(languageBytes).length > 0} />
        )}
        {repos.length > 0 && (
          <div className="repo-list" id="repo-section">
            <h3>Repositories ({repos.length})</h3>
            <ul className="two-col">
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
    </div>
  );
}

export default App;

