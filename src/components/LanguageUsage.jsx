import { useState, useEffect } from 'react';

const LANGUAGE_ICONS = {
  JavaScript: { fill: '#f7df1e', svg: '<circle cx="12" cy="12" r="11" fill="#f7df1e" />' },
  TypeScript: { fill: '#3178c6', svg: '<rect x="2" y="2" width="20" height="20" rx="4" fill="#3178c6" />' },
  Python: { fill: '#3776ab', svg: '<path fill="#3776ab" d="M6 4h6a4 4 0 0 1 4 4v2H8a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h2v-3H8a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H6z"/><path fill="#ffdf5b" d="M18 20h-6a4 4 0 0 1-4-4v-2h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4h-2v3h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H8a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h10z" />' },
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

export default function LanguageUsage({ languages, byteAccurate }) {
  const [animatedPercents, setAnimatedPercents] = useState(() => languages.map(()=>0));
  useEffect(() => {
    let frame; const start = performance.now();
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
    <section className="panel language-usage" aria-labelledby="language-usage-heading">
      <h3 id="language-usage-heading" className="panel-title">Language Usage {byteAccurate ? '(bytes)' : '(repos)'}</h3>
      <ul className="language-grid">
        {languages.map((l, idx) => {
          const icon = LANGUAGE_ICONS[l.lang];
          const pctDisplay = l.percent.toFixed(1);
          const animated = animatedPercents[idx] || 0;
          return (
            <li key={l.lang} className="language-item reveal" style={{'--delay': `${idx * 40}ms`}}>
              <div className="lang-header">
                <div className="lang-avatar" style={{ background: icon? icon.fill : 'var(--surface-3)'}}>
                  {icon ? <svg width="22" height="22" viewBox="0 0 24 24" dangerouslySetInnerHTML={{__html: icon.svg}} /> : <span>{l.lang.slice(0,3)}</span>}
                </div>
                <strong className="lang-name">{l.lang}</strong>
                <span className="lang-meta">{(l.count ?? l.bytes)?.toLocaleString()} · {pctDisplay}%</span>
              </div>
              <div className="lang-bar">
                <div className="lang-bar-fill" style={{width: `${animated}%`}} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
