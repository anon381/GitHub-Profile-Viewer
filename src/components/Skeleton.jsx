export function ProfileSkeleton() {
  return (
    <div className="profile-skeleton panel shimmer">
      <div className="sk-avatar" />
      <div className="sk-line w40" />
      <div className="sk-line w60" />
      <div className="sk-stats">
        <div className="sk-chip" />
        <div className="sk-chip" />
        <div className="sk-chip" />
      </div>
    </div>
  );
}
//
export function RepoSkeletonList({ count = 6 }) {
  return (
    <ul className="repo-grid skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="repo-item shimmer">
          <div className="sk-line w70" />
          <div className="sk-line w20" />
        </li>
      ))}
    </ul>
  );
}
