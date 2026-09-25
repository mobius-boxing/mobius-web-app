import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface LaneSegment {
  /** Stable React key — the plan item uuid, or `${orderUuid}-${index}` for a candidate preview. */
  key: string;
  orderNumber: string;
  runWidth: number; // mm
  count: number;
  rotated: boolean;
}

interface LaneDiagramProps {
  /** mm, the chosen reel/format width — the diagram's full bar width. */
  reelWidth: number;
  /** mm, machine-side deckle loss (E-1/E-2) — shaded at the edge. */
  machineTrim: number;
  /** mm, leftover after lanes and machine trim (E-2) — hatched at the edge. */
  transversalRefile: number;
  lanes: LaneSegment[];
  className?: string;
  'data-testid'?: string;
}

const PALETTE = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c', '#4ade80', '#38bdf8'];

const colorFor = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

/**
 * One reel/format width as an SVG bar: one coloured segment per lane
 * (`count` sheets of `runWidth` side by side), the transversal refile
 * hatched and the machine trim shaded at the trailing edge (E-1/E-2).
 * No canvas lib exists in this repo (scout-ui.md §4) — plain inline SVG.
 */
const LaneDiagram: React.FC<LaneDiagramProps> = ({
  reelWidth,
  machineTrim,
  transversalRefile,
  lanes,
  className,
  'data-testid': testId,
}) => {
  const hatchId = `corrugator-hatch-${useId()}`;
  const width = Math.max(reelWidth, 1);
  let x = 0;

  return (
    <svg
      viewBox={`0 0 ${width} 64`}
      preserveAspectRatio="none"
      className={cn('h-16 w-full', className)}
      data-testid={testId}
      role="img"
      aria-label={`${reelWidth} mm`}
    >
      <defs>
        <pattern id={hatchId} width={8} height={8} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1={0} y1={0} x2={0} y2={8} stroke="#f87171" strokeWidth={4} />
        </pattern>
      </defs>

      {lanes.map((lane) => {
        const laneWidth = Math.max(lane.runWidth * lane.count, 0);
        const startX = x;
        x += laneWidth;
        return (
          <g key={lane.key} data-testid="lane-segment">
            <rect x={startX} y={4} width={laneWidth} height={56} fill={colorFor(lane.orderNumber)} stroke="#fff" strokeWidth={1} />
            {Array.from({ length: Math.max(lane.count - 1, 0) }, (_, i) => (
              <line
                key={i}
                x1={startX + lane.runWidth * (i + 1)}
                x2={startX + lane.runWidth * (i + 1)}
                y1={4}
                y2={60}
                stroke="#ffffff"
                strokeWidth={1}
              />
            ))}
            <text
              x={startX + laneWidth / 2}
              y={36}
              textAnchor="middle"
              fontSize={Math.max(Math.min(12, laneWidth / 4), 6)}
              fill="#1f2937"
            >
              {lane.rotated ? '⟲ ' : ''}
              {lane.orderNumber} ×{lane.runWidth}
            </text>
          </g>
        );
      })}

      {transversalRefile > 0 && (
        <rect x={x} y={4} width={transversalRefile} height={56} fill={`url(#${hatchId})`} stroke="#fca5a5" data-testid="lane-refile" />
      )}
      {machineTrim > 0 && (
        <rect x={x + Math.max(transversalRefile, 0)} y={4} width={machineTrim} height={56} fill="#9ca3af" data-testid="lane-trim" />
      )}
    </svg>
  );
};

export default LaneDiagram;
