export default function RjsMapPin({ type = 'pickup', animated = false, className = '' }) {
  const pickup = type === 'pickup';
  const color = pickup ? '#0756f8' : '#ff5a00';
  return <span className={`rjs-map-pin ${animated && pickup ? 'is-pulsing' : ''} ${className}`} aria-hidden="true">
    <svg viewBox="0 0 120 150" role="presentation">
      <g className="rjs-pin-waves" fill="none" stroke={color}>
        <ellipse cx="60" cy="130" rx="31" ry="11" strokeOpacity=".20" strokeWidth="10" />
        <ellipse cx="60" cy="130" rx="18" ry="7" strokeOpacity=".32" strokeWidth="7" />
      </g>
      <path d="M60 126V69" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <circle cx="60" cy="128" r="8" fill={color} stroke="white" strokeWidth="5" />
      <circle cx="60" cy="48" r="38" fill="white" stroke={color} strokeWidth="9" />
      <circle cx="60" cy="48" r="20" fill={color} />
    </svg>
  </span>;
}
