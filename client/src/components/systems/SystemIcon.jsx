const icons = {
  'chapter-01': ( // 运动系统 — bone
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2c-1 0-1.5.8-1 1.5 1 1 3 1.5 4.5 2.5C11 7 12 8.5 12 12s-1 5-2.5 6c-1.5 1-3.5 1.5-4.5 2.5-.5.7 0 1.5 1 1.5M18 2c1 0 1.5.8 1 1.5-1 1-3 1.5-4.5 2.5C13 7 12 8.5 12 12s1 5 2.5 6c1.5 1 3.5 1.5 4.5 2.5.5.7 0 1.5-1 1.5"/>
    </svg>
  ),
  'chapter-02': ( // 消化系统 — stomach
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4h1c2 0 3 2 3 5v3c0 3 1 4 3 4h1M7 4c-2 0-4 2-4 5s2 5 4 5M7 14v3c0 1 1 2 2 2"/>
      <line x1="7" y1="9" x2="7" y2="14"/>
      <line x1="11" y1="9" x2="10" y2="16"/>
    </svg>
  ),
  'chapter-03': ( // 呼吸系统 — lungs
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7c-.5-2-2.5-3.5-4.5-3C1 4.5.5 7 1 9c.5 2 2 3 3 3.5M7 7v5.5c0 2-.5 3.5-1.5 4.5M17 7c.5-2 2.5-3.5 4.5-3 1.5.5 2 3 1.5 5-.5 2-2 3-3 3.5M17 7v5.5c0 2 .5 3.5 1.5 4.5M12 9v11"/>
      <path d="M7 10c0-1.5 2-2.5 5-2.5s5 1 5 2.5"/>
    </svg>
  ),
  'chapter-04': ( // 泌尿系统 — kidney
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="9" cy="12" rx="5" ry="7" transform="rotate(-15 9 12)"/>
      <path d="M5 12c0-1 .5-2 1-3"/>
      <line x1="13" y1="8" x2="18" y2="4"/>
      <ellipse cx="15" cy="12" rx="5" ry="7" transform="rotate(15 15 12)"/>
      <path d="M19 12c0-1-.5-2-1-3"/>
      <line x1="11" y1="8" x2="6" y2="4"/>
    </svg>
  ),
  'chapter-05': ( // 生殖系统 — abstract biology
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="3"/>
      <circle cx="17" cy="7" r="3"/>
      <circle cx="7" cy="17" r="3"/>
      <circle cx="17" cy="17" r="3"/>
      <line x1="10" y1="7" x2="14" y2="7"/>
      <line x1="10" y1="17" x2="14" y2="17"/>
      <line x1="7" y1="10" x2="7" y2="14"/>
      <line x1="17" y1="10" x2="17" y2="14"/>
    </svg>
  ),
  'chapter-06': ( // 循环系统 — heart
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21C12 21 3 14.5 3 8.5 3 5.5 5.5 3 8 3c1.5 0 3 .8 4 2 1-1.2 2.5-2 4-2 2.5 0 5 2.5 5 5.5C21 14.5 12 21 12 21Z"/>
      <path d="M8 5.5V2.5M16 5.5V2.5"/>
    </svg>
  ),
  'chapter-07': ( // 感觉器 — eye
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M18 4l3-2M2 6l3-2"/>
    </svg>
  ),
  'chapter-08': ( // 神经系统 — brain
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 2 5 5 5 8.5c0 2 1 3.5 1.5 4.5-.5 1-1 2.5-1 4 0 3 2.5 5 6.5 5s6.5-2 6.5-5c0-1.5-.5-3-1-4 .5-1 1.5-2.5 1.5-4.5C19 5 16 2 12 2Z"/>
      <path d="M8 10c0 1 .5 2 1 3M16 10c0 1-.5 2-1 3M12 11v5"/>
      <circle cx="9" cy="9" r="0.8" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="9" r="0.8" fill="currentColor" stroke="none"/>
    </svg>
  ),
  'chapter-09': ( // 内分泌系统 — gland/thyroid
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h3c1 0 2 1 2 2v4c0 1-1 2-2 2H6c-1 0-2-1-2-2v-4c0-1 1-2 2-2Z"/>
      <path d="M15 8h3c1 0 2 1 2 2v4c0 1-1 2-2 2h-3c-1 0-2-1-2-2v-4c0-1 1-2 2-2Z"/>
      <line x1="12" y1="10" x2="12" y2="14"/>
      <circle cx="9" cy="7" r="1.5"/>
      <circle cx="15" cy="7" r="1.5"/>
      <circle cx="9" cy="17" r="1.5"/>
      <circle cx="15" cy="17" r="1.5"/>
    </svg>
  ),
  'chapter-00': ( // 绪论 — open book
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h6l2 2 2-2h6v14H14l-2-3-2 3H4Z"/>
      <line x1="12" y1="8" x2="12" y2="17"/>
    </svg>
  ),
};

const fallback = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v6M12 16v1"/>
  </svg>
);

export default function SystemIcon({ chapterId, size = 24 }) {
  return (
    <span className="system-icon" style={{ width: size, height: size, flexShrink: 0 }}
      aria-hidden="true">
      {icons[chapterId] || fallback}
    </span>
  );
}
