export function Tile({ rank, number, first }) {
  return (
    <div class={first ? 'tile first' : 'tile'}>
      <span class="rank">{rank}</span>
      <span class="num">{number || '----'}</span>
    </div>
  );
}

export function Top3({ draw }) {
  return (
    <div class="top3">
      <Tile rank="1ST" number={draw.first} first />
      <Tile rank="2ND" number={draw.second} />
      <Tile rank="3RD" number={draw.third} />
    </div>
  );
}

export function NumberGrid({ numbers }) {
  const list = numbers || [];
  return (
    <div class="nums">
      {list.map((n, i) => (
        <div key={i} class={n && /^\d{4}$/.test(n) ? 'chip' : 'chip dash'}>{n && /^\d{4}$/.test(n) ? n : '----'}</div>
      ))}
    </div>
  );
}

export function Loading() {
  return <div class="loading">Loading…</div>;
}
