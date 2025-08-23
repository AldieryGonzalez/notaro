interface ConnectionProps {
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
}

export function Connection({ sourcePosition, targetPosition }: ConnectionProps) {
  const dx = targetPosition.x - sourcePosition.x;
  const dy = targetPosition.y - sourcePosition.y;
  
  // Create a curved path
  const controlPoint1X = sourcePosition.x + dx * 0.5;
  const controlPoint1Y = sourcePosition.y;
  const controlPoint2X = targetPosition.x - dx * 0.5;
  const controlPoint2Y = targetPosition.y;
  
  const path = `M ${sourcePosition.x} ${sourcePosition.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetPosition.x} ${targetPosition.y}`;
  
  return (
    <g>
      <path
        d={path}
        stroke="#6b7280"
        strokeWidth="2"
        fill="none"
        strokeDasharray="0"
        className="hover:stroke-blue-500 transition-colors"
      />
      {/* Arrow head */}
      <polygon
        points={`${targetPosition.x},${targetPosition.y} ${targetPosition.x - 8},${targetPosition.y - 4} ${targetPosition.x - 8},${targetPosition.y + 4}`}
        fill="#6b7280"
        className="hover:fill-blue-500 transition-colors"
      />
    </g>
  );
}
