const panels = (login) => [
  { alt: 'GitHub Streak', src: `https://github-readme-streak-stats.herokuapp.com/?user=${login}&theme=tokyonight&hide_border=true` },
  { alt: 'GitHub Stats', src: `https://github-readme-stats.vercel.app/api?username=${login}&show_icons=true&theme=tokyonight&hide_border=true` },
  { alt: 'Top Languages (API)', src: `https://github-readme-stats.vercel.app/api/top-langs/?username=${login}&layout=compact&theme=tokyonight&hide_border=true` },
  { alt: 'GitHub Trophies', src: `https://github-profile-trophy.vercel.app/?username=${login}&theme=onedark&no-frame=true&row=2&column=3` },
  { alt: 'Contribution Graph', src: `https://ghchart.rshah.org/646cff/${login}` },
];

export default function StatsPanels({ login }) {
  if (!login) return null;
  return (
    <section className="stats-panels panel" aria-label="GitHub statistic images">
      <div className="scroll-row enhanced-scroll">
        {panels(login).map((p, i) => (
          <figure key={p.alt} className="stat-figure reveal" style={{'--delay': `${(i+1) * 60}ms`}}>
            <img src={p.src} alt={p.alt} loading="lazy" />
          </figure>
        ))}
      </div>
    </section>
  );
}
