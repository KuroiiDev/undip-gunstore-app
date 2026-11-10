const members = [
  { name: 'Maitsam Kadzim', nim: '21120124140161' },
  { name: 'Rafi Nurulhuda', nim: '21120124130053' },
  { name: 'Gotara Parasdya Abimanyu', nim: '21120124140157' },
  { name: 'Faiz Alif Rahmawan', nim: '21120124130063' },
]

const css = `
.about {
  --bg: #f2f4f5;
  --panel: #f9f7f3;
  --line: #e7dfd2;
  --ink: #1c1814;
  --muted: #6b6256;
  --accent: #a8701f;

  max-width: 880px;
  margin: 0 auto;
  padding: 72px 24px 48px;
  color: var(--ink);
  background: var(--bg);
  font-family: 'Inter', system-ui, sans-serif;
  min-height: 100vh;
}

.about .eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  color: var(--accent);
  margin: 0 0 16px;
}

.about .display {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2.5rem, 7vw, 4.5rem);
  line-height: 1.05;
  margin: 0 0 20px;
}

.about .lede {
  max-width: 56ch;
  font-size: 1.125rem;
  line-height: 1.65;
  color: var(--muted);
  margin: 0;
}

.about-hero {
  padding-bottom: 40px;
  margin-bottom: 40px;
  border-bottom: 1px solid var(--line);
}

.about-team {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 28px;
}

.team-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.team-head h2 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.6rem;
  margin: 0;
}

.about .badge {
  background: var(--ink);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
}

.team-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.team-list li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid var(--line);
}

.about .avatar {
  width: 40px;
  height: 40px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid var(--accent);
  color: var(--accent);
  background: #ffffff;
  font-weight: 700;
}

.about .member {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.about .nim {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 0.85rem;
  color: var(--muted);
}

.about .idx {
  font-family: Georgia, serif;
  color: var(--line);
  font-size: 1.6rem;
}

.about-foot {
  text-align: center;
  margin-top: 40px;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
}

@media (max-width: 480px) {
  .about { padding: 48px 16px 32px; }
  .about-team { padding: 20px; }
}
`

function About() {
  return (
    <div className="page about">
      <style>{css}</style>

      <header className="about-hero">
        <p className="eyebrow">About · Est. in a single room</p>
        <h1 className="display">A one-room armory.</h1>
        <p className="lede">
          Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced
          from the bench — no markup theatre, no filler.
        </p>
      </header>

      <section className="about-team">
        <div className="team-head">
          <h2>Kelompok 13</h2>
          <span className="badge">Shift 02</span>
        </div>
        <ul className="team-list">
          {members.map((m, i) => (
            <li key={m.nim}>
              <span className="avatar">{m.name.charAt(0)}</span>
              <div className="member">
                <strong>{m.name}</strong>
                <span className="nim">{m.nim}</span>
              </div>
              <span className="idx">0{i + 1}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="about-foot">Kelompok 13 — Shift 02</footer>
    </div>
  )
}

export default About