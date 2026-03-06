interface ProgressRingProps {
  value: number;       // 0–100
  size?: number;       // px
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  size = 160,
  strokeWidth = 10,
  color = '#22C55E',
  bgColor = '#E5E7EB',
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference;
  const cx = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cx} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cx} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="font-mono font-bold text-gray-900" style={{ fontSize: size * 0.18 }}>
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-gray-400" style={{ fontSize: size * 0.09 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
