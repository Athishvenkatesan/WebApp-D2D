interface DEWALogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function DEWALogo({ size = 'md' }: DEWALogoProps) {
  const ringSize = size === 'lg' ? 72 : size === 'sm' ? 40 : 52;
  const textClass = size === 'lg' ? 'dewa-logo-lg' : size === 'sm' ? 'dewa-logo-sm' : 'dewa-logo-md';

  return (
    <div className={`dewa-logo ${textClass}`}>
      {/* Text block */}
      <div className="dewa-logo-text">
        <div className="dewa-arabic">هيئة كهرباء ومياه دبي</div>
        <div className="dewa-english">Dubai Electricity &amp; Water Authority</div>
      </div>

      {/* The circular gradient ring — approximates the real DEWA logo */}
      <svg
        width={ringSize}
        height={ringSize}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="dewa-ring"
      >
        <defs>
          {/* Main ring gradient: green → teal → blue */}
          <linearGradient id="dewaMajorGrad" x1="0" y1="1" x2="0.3" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="35%" stopColor="#16a34a" />
            <stop offset="65%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          {/* Red/pink accent gradient */}
          <linearGradient id="dewaAccentGrad" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Main arc: ~300° of the ring (green → blue), starting from bottom-right going CCW */}
        {/* Using stroke-dasharray to show partial circle */}
        {/* Circle circumference at r=33: 2*PI*33 ≈ 207.3 */}
        {/* Main arc: 270/360 * 207.3 ≈ 155.5 */}
        <circle
          cx="40"
          cy="40"
          r="33"
          stroke="url(#dewaMajorGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="148 207"
          strokeDashoffset="0"
          transform="rotate(100 40 40)"
        />

        {/* Red/pink accent: ~50° at top-right */}
        {/* 50/360 * 207.3 ≈ 28.8 */}
        <circle
          cx="40"
          cy="40"
          r="33"
          stroke="url(#dewaAccentGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="28 207"
          strokeDashoffset="-148"
          transform="rotate(100 40 40)"
        />

        {/* Inner lighter ring for depth */}
        <circle
          cx="40"
          cy="40"
          r="24"
          stroke="#e2f5ea"
          strokeWidth="1"
          strokeDasharray="120 151"
          strokeDashoffset="0"
          transform="rotate(100 40 40)"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
