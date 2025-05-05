export default function ProfileCard({ profile }) {
  if (!profile) return null;
  return (
    // Profile card-container
    <section className="profile-card panel" aria-labelledby="profile-heading">
      <div className="avatar-wrap">
        <img src={profile.avatar_url} alt={profile.login} className="avatar" loading="lazy" />
      </div>
      <h2 id="profile-heading" className="profile-name">{profile.name || profile.login}</h2>
      {profile.bio && <p className="profile-bio">{profile.bio}</p>}
      <p className="profile-link"><a href={profile.html_url} target="_blank" rel="noopener noreferrer">@{profile.login}</a></p>
      <div className="quick-stats">
        <div className="qstat"><span className="qstat-label">Followers</span><span className="qstat-value">{profile.followers}</span></div>
        <div className="qstat"><span className="qstat-label">Following</span><span className="qstat-value">{profile.following}</span></div>
        <div className="qstat"><span className="qstat-label">Repos</span><span className="qstat-value">{profile.public_repos}</span></div>
      </div>
    </section>
  );
}
