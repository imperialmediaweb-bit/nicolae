export default function HappyLogo({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* Petals */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <ellipse
          key={i}
          cx="100"
          cy="55"
          rx="32"
          ry="48"
          fill="#C48DB8"
          transform={`rotate(${angle} 100 100)`}
        />
      ))}
      {/* Center face */}
      <circle cx="100" cy="100" r="35" fill="white" />
      {/* Eyes */}
      <circle cx="88" cy="92" r="4" fill="#333" />
      <circle cx="112" cy="92" r="4" fill="#333" />
      {/* Smile */}
      <path
        d="M 85 105 Q 100 120 115 105"
        stroke="#333"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Letters on petals */}
      <text x="100" y="38" textAnchor="middle" fill="#E8D44D" fontWeight="bold" fontSize="22" fontFamily="Arial">H</text>
      <text x="148" y="72" textAnchor="middle" fill="#E8D44D" fontWeight="bold" fontSize="22" fontFamily="Arial">A</text>
      <text x="138" y="148" textAnchor="middle" fill="#E8D44D" fontWeight="bold" fontSize="22" fontFamily="Arial">P</text>
      <text x="62" y="148" textAnchor="middle" fill="#E8D44D" fontWeight="bold" fontSize="22" fontFamily="Arial">P</text>
      <text x="52" y="72" textAnchor="middle" fill="#E8D44D" fontWeight="bold" fontSize="22" fontFamily="Arial">Y</text>
    </svg>
  );
}
