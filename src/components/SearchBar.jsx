export default function SearchBar({ username, setUsername, token, setToken, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="search-form enhanced-scroll" aria-label="Search GitHub user">
      <input
        type="text"
        placeholder="GitHub username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
        aria-label="GitHub username"
      />
      {/* Optional token input */}
      <button type="submit" disabled={loading || !username} aria-label="Search" className="accent-btn">
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
