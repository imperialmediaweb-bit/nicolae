export default function HappyLogo({ size = 120 }: { size?: number }) {
  // Petal positions: angle from center, letter, word
  const petals = [
    { angle: 0, letter: "H", word: "Help" },
    { angle: 72, letter: "A", word: "Act" },
    { angle: 144, letter: "P", word: "Protect" },
    { angle: 216, letter: "P", word: "Provide" },
    { angle: 288, letter: "Y", word: "Yield" },
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
      {/* Petals */}
      {petals.map((petal, i) => (
        <g key={i} transform={`rotate(${petal.angle} 120 120)`}>
          {/* Petal shape */}
          <ellipse
            cx="120"
            cy="58"
            rx="38"
            ry="55"
            fill="#C48DB8"
          />
          {/* Letter */}
          <text
            x="120"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#E8D44D"
            fontWeight="bold"
            fontSize="28"
            fontFamily="Arial, sans-serif"
          >
            {petal.letter}
          </text>
          {/* Word below letter */}
          <text
            x="120"
            y="70"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="10"
            fontFamily="Arial, sans-serif"
            fontWeight="500"
          >
            {petal.word}
          </text>
        </g>
      ))}

      {/* White center circle (body) */}
      <circle cx="120" cy="120" r="40" fill="white" />

      {/* Left arm */}
      <path
        d="M 82 110 Q 60 100 50 115"
        stroke="white"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right arm */}
      <path
        d="M 158 110 Q 180 100 190 115"
        stroke="white"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Left eye */}
      <circle cx="106" cy="112" r="5" fill="#333" />
      {/* Right eye */}
      <circle cx="134" cy="112" r="5" fill="#333" />

      {/* Smile */}
      <path
        d="M 102 130 Q 120 148 138 130"
        stroke="#333"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
