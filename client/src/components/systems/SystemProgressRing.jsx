export default function SystemProgressRing({ pct = 0, size = 32 }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const strokeW = 3;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--color-border)" strokeWidth={strokeW} />
      {pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--color-primary)" strokeWidth={strokeW}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.3s ease' }} />
      )}
      {pct > 0 && (
        <text x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="central"
          fill="var(--color-text-secondary)"
          style={{ fontSize: size <= 28 ? '8px' : '10px', fontWeight: 600 }}>
          {pct}
        </text>
      )}
      {pct === 0 && (
        <text x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="central"
          fill="var(--color-text-hint)"
          style={{ fontSize: '10px' }}>–</text>
      )}
    </svg>
  );
}
