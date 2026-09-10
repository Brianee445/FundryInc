'use client';

import { useId, useState } from 'react';
import type { DailyCount } from '@/app/lib/types/analytics';

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-input border border-borderColor bg-secondaryBg px-4 py-3">
      <p className="text-2xl font-bold text-primaryText">{value.toLocaleString()}</p>
      <p className="text-xs text-secondaryText">{label}</p>
    </div>
  );
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;
const PADDING = 8;

/**
 * Small dependency-free area chart — plain SVG, no chart library. Avoids
 * adding a new package (recharts etc.) that would need `npm install`
 * before this'll run.
 */
export function ActivityChart({ title, data }: { title: string; data: DailyCount[] }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const innerWidth = CHART_WIDTH - PADDING * 2;
  const innerHeight = CHART_HEIGHT - PADDING * 2;
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = PADDING + i * stepX;
    const y = PADDING + innerHeight - (d.count / maxCount) * innerHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? PADDING} ${CHART_HEIGHT - PADDING} L ${PADDING} ${CHART_HEIGHT - PADDING} Z`;

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="rounded-card border border-borderColor bg-cardBg p-5">
      <p className="mb-3 text-sm font-semibold text-primaryText">{title}</p>
      <div className="relative">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-40 w-full"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PADDING}
              x2={CHART_WIDTH - PADDING}
              y1={PADDING + innerHeight * f}
              y2={PADDING + innerHeight * f}
              stroke="rgb(var(--color-border))"
              strokeWidth={1}
            />
          ))}

          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <path d={linePath} fill="none" stroke="rgb(37 99 235)" strokeWidth={2} />

          {/* Invisible wide hit-targets so hovering is easy even with 30 tightly-packed points */}
          {points.map((p, i) => (
            <rect
              key={i}
              x={p.x - stepX / 2}
              y={0}
              width={stepX || CHART_WIDTH}
              height={CHART_HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}

          {hovered && (
            <>
              <line
                x1={hovered.x}
                x2={hovered.x}
                y1={PADDING}
                y2={CHART_HEIGHT - PADDING}
                stroke="rgb(var(--color-border))"
                strokeWidth={1}
              />
              <circle cx={hovered.x} cy={hovered.y} r={4} fill="rgb(37 99 235)" />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute -top-1 rounded-input border border-borderColor bg-cardBg px-2 py-1 text-xs shadow-card"
            style={{
              left: `${(hovered.x / CHART_WIDTH) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="font-semibold text-primaryText">{hovered.count}</p>
            <p className="text-secondaryText">{formatDay(hovered.date)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
