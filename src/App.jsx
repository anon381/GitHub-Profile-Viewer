
import { useState, useMemo, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar.jsx';
import ProfileCard from './components/ProfileCard.jsx';
import StatsPanels from './components/StatsPanels.jsx';
import LanguageUsage from './components/LanguageUsage.jsx';
import RepoList from './components/RepoList.jsx';
import { ProfileSkeleton, RepoSkeletonList } from './components/Skeleton.jsx';

function App() {
  // State
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [languageBytes, setLanguageBytes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [theme, setTheme] = useState(() => localStorage.getItem('gpv_theme') || 'dark');

  // Config
  const pageSize = 10;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  const envToken = import.meta.env.VITE_GITHUB_TOKEN;
  const [userToken, setUserToken] = useState(() => localStorage.getItem('gpv_token') || '');
  const effectiveToken = (userToken || envToken || '').trim();
  const baseHeaders = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gpv_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Fetch profile + repos + languages (with cache)
  const fetchProfile = async (e) => {
    if (e) e.preventDefault();
    if (!username) return;
    setLoading(true);
    setError('');
    setProfile(null);
    setRepos([]);
    setLanguageBytes({});
    setPage(1);
    try {
      const cacheKey = `gpv_cache_${username}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < CACHE_TTL) {
            setProfile(parsed.profile);
            setRepos(parsed.repos);
            setLanguageBytes(parsed.languageBytes);
            setLoading(false);
            return;
          }
        } catch { /* ignore bad cache */ }
      }

      // Profile
      const profResp = await fetch(`https://api.github.com/users/${username}`, { headers: baseHeaders });
      if (!profResp.ok) throw new Error(profResp.status === 404 ? 'User not found' : 'Profile fetch failed');
      const profileData = await profResp.json();
      setProfile(profileData);

      // Repos
      let allRepos = [];
      for (let pageNum = 1; ; pageNum++) {
        const repoResp = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&page=${pageNum}`, { headers: baseHeaders });
        if (!repoResp.ok) throw new Error('Repo fetch failed');
        const repoPage = await repoResp.json();
        allRepos = allRepos.concat(repoPage);
        if (repoPage.length < 100) break;
      }
      setRepos(allRepos);

      // Languages (first 30 repos)
      const langBytes = {};
      await Promise.all(
        allRepos.slice(0, 30).map(async (r) => {
          const langResp = await fetch(r.languages_url, { headers: baseHeaders });
          if (langResp.ok) {
            const langs = await langResp.json();
            for (const [lang, bytes] of Object.entries(langs)) {
              langBytes[lang] = (langBytes[lang] || 0) + bytes;
            }
          }
        })
      );
      setLanguageBytes(langBytes);

      localStorage.setItem(cacheKey, JSON.stringify({ profile: profileData, repos: allRepos, languageBytes: langBytes, ts: Date.now() }));
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  // Derive language stats
  const languageStats = useMemo(() => {
    const entries = Object.keys(languageBytes).length
      ? Object.entries(languageBytes).map(([lang, bytes]) => ({ lang, bytes }))
      : (() => {
          const tally = {};
          repos.forEach(r => { if (r.language) tally[r.language] = (tally[r.language] || 0) + 1; });
          return Object.entries(tally).map(([lang, count]) => ({ lang, count }));
        })();
    const total = entries.reduce((acc, e) => acc + (e.bytes || e.count || 0), 0);
    return entries.map(e => ({
      lang: e.lang,
      count: e.count ?? undefined,
      bytes: e.bytes ?? undefined,
      percent: total ? ((e.bytes || e.count || 0) / total) * 100 : 0,
    })).sort((a, b) => b.percent - a.percent);
  }, [repos, languageBytes]);
  const topLanguages = languageStats;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(repos.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRepos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return repos.slice(start, start + pageSize);
  }, [repos, currentPage]);
  const goPage = (p) => { if (p >= 1 && p <= totalPages) setPage(p); };

  const showSkeletons = loading && !profile;

  return (
    <div className="app-shell">
      <header id="top-bar" className="glass-bar">
        <h1 className="app-title">GitHub Profile Viewer</h1>
        <SearchBar
          username={username}
          setUsername={setUsername}
          token={userToken}
          setToken={setUserToken}
          onSubmit={fetchProfile}
          loading={loading}
        />
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
        </button>
      </header>
      <main className="main-grid">
        {error && <p className="error-msg" role="alert">{error}</p>}
        {showSkeletons && (
          <>
            <ProfileSkeleton />
            <RepoSkeletonList />
          </>
        )}
        {!showSkeletons && (
          <>
            <ProfileCard profile={profile} />
            <StatsPanels login={profile?.login} />
            {topLanguages.length > 0 && (
              <LanguageUsage languages={topLanguages} byteAccurate={Object.keys(languageBytes).length > 0} />
            )}
            <RepoList
              repos={repos}
              pageRepos={pageRepos}
              currentPage={currentPage}
              totalPages={totalPages}
              goPage={goPage}
            />
          </>
        )}
        {loading && profile && <div className="loading-indicator">Refreshing…</div>}
        <footer className="footer-note">Data from GitHub public API & community endpoints; images may be cached or rate limited.</footer>
      </main>
    </div>
  );
}

export default App;
