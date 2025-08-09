
import { useState } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setProfile(null);
    setRepos([]);
    try {
      const userRes = await fetch(`https://api.github.com/users/${username}`);
      if (!userRes.ok) throw new Error('User not found');
      const userData = await userRes.json();
      setProfile(userData);
      const repoRes = await fetch(userData.repos_url + '?per_page=10&sort=updated');
      const repoData = await repoRes.json();
      setRepos(Array.isArray(repoData) ? repoData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="github-viewer">
      <h1>GitHub Profiles Viewer</h1>
      <form onSubmit={fetchProfile} className="search-form">
        <input
          type="text"
          placeholder="Enter GitHub username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>Search</button>
      </form>
      {loading && <p>Loading...</p>}
      {error && <p style={{color: 'salmon'}}>{error}</p>}
      {profile && (
        <div className="profile-card">
          <img src={profile.avatar_url} alt={profile.login} className="avatar" />
          <h2>{profile.name || profile.login}</h2>
          <p>{profile.bio}</p>
          <p>
            <a href={profile.html_url} target="_blank" rel="noopener noreferrer">@{profile.login}</a>
          </p>
          <div className="stats">
            <span>Followers: {profile.followers}</span>
            <span>Following: {profile.following}</span>
            <span>Repos: {profile.public_repos}</span>
          </div>
        </div>
      )}
      {repos.length > 0 && (
        <div className="repo-list">
          <h3>Public Repositories</h3>
          <ul>
            {repos.map(repo => (
              <li key={repo.id}>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">{repo.name}</a>
                <span>★ {repo.stargazers_count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
