const features = [
  { icon: '📖', text: '9大核心模块' },
  { icon: '📁', text: '50+细分小节' },
  { icon: '🔄', text: '5步完整学习流' },
  { icon: '🎯', text: '错题自动强化' },
];

export default function FeatureList() {
  return (
    <div className="feature-list">
      {features.map((f) => (
        <div key={f.text} className="feature-item">
          <span className="feature-item__icon">{f.icon}</span>
          <span className="feature-item__text">{f.text}</span>
        </div>
      ))}
    </div>
  );
}
