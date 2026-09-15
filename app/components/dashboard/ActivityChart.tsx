'use client';

import { useId, useRef, useState } from 'react';
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
 * Small dependency-free area chart — plain SVG, no chart library (avoids
 * needing `npm install` for something like recharts).
 *
 * Two things this fixes vs. the first version: it used onMouseEnter for
 * the tooltip, which never fires on a touchscreen — on mobile the chart
 * had no way to ever show a number, which is what "just static" meant.
 * It also had no labels visible without hovering. Both are fixed here:
 * pointer events cover touch and mouse the same way, and the axis now
 * always shows the date range and value scale regardless of interaction.
 */
export function ActivityChart({ title, data }: { title: string; data: DailyCount[] }) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
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
  const hasActivity = data.some((d) => d.count > 0);

  const updateHoverFromClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const svgX = ratio * CHART_WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - svgX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  return (
    <div className="rounded-card border border-borderColor bg-cardBg p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-primaryText">{title}</p>
        <p className="text-xs text-secondaryText">max {maxCount.toLocaleString()}</p>
      </div>

      {!hasActivity && (
        <p className="mb-2 text-xs text-secondaryText">No activity yet in this window — the line below is flat at zero.</p>
      )}

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-40 w-full touch-none"
          preserveAspectRatio="none"
          onPointerMove={(e) => updateHoverFromClientX(e.clientX)}
          onPointerDown={(e) => updateHoverFromClientX(e.clientX)}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines with their value, so the scale reads
              without needing to hover at all */}
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line
                x1={PADDING}
                x2={CHART_WIDTH - PADDING}
                y1={PADDING + innerHeight * (1 - f)}
                y2={PADDING + innerHeight * (1 - f)}
                stroke="rgb(var(--color-border))"
                strokeWidth={1}
              />
              <text
                x={PADDING + 2}
                y={PADDING + innerHeight * (1 - f) - 3}
                fontSize={9}
                fill="rgb(var(--color-secondary-text))"
              >
                {Math.round(maxCount * f)}
              </text>
            </g>
          ))}

          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <path d={linePath} fill="none" stroke="rgb(37 99 235)" strokeWidth={2} />

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

      {/* Always-visible date range — readable at a glance, no tap needed */}
      {points.length > 0 && (
        <div className="mt-1 flex justify-between text-xs text-secondaryText">
          <span>{formatDay(points[0].date)}</span>
          <span className="hidden sm:inline">Tap or hover a point for details</span>
          <span>{formatDay(points[points.length - 1].date)}</span>
        </div>
      )}
    </div>
  );
}
