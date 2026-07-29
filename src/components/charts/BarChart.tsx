import { useState } from 'react'
import type { ChartPoint } from './ChartPoint'
import { formatChartDate } from './ChartPoint'

type Props = {
  points: ChartPoint[]
  formatValue?: (value: number) => string
}

const VIEW_WIDTH = 600
const VIEW_HEIGHT = 180
const PAD_X = 12
const PAD_TOP = 16
const PAD_BOTTOM = 24
const GAP = 3

export function BarChart({ points, formatValue = (v) => `${Math.round(v)}` }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (points.length === 0) return null

  const max = Math.max(...points.map((p) => p.value)) || 1
  const innerWidth = VIEW_WIDTH - PAD_X * 2
  const innerHeight = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM
  const barWidth = Math.max((innerWidth - GAP * (points.length - 1)) / points.length, 2)
  const active = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-44 w-full touch-none"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <line
          x1={PAD_X}
          y1={VIEW_HEIGHT - PAD_BOTTOM}
          x2={VIEW_WIDTH - PAD_X}
          y2={VIEW_HEIGHT - PAD_BOTTOM}
          stroke="var(--color-border)"
          strokeWidth={1}
        />

        {points.map((p, i) => {
          const x = PAD_X + i * (barWidth + GAP)
          const barHeight = Math.max((p.value / max) * innerHeight, 2)
          const y = VIEW_HEIGHT - PAD_BOTTOM - barHeight
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={hoverIndex === i ? 'var(--color-accent)' : 'var(--color-accent-dim)'}
              onMouseEnter={() => setHoverIndex(i)}
              onTouchStart={() => setHoverIndex(i)}
            />
          )
        })}

        <text x={PAD_X} y={VIEW_HEIGHT - 6} fontSize={11} fill="var(--color-ink-faint)">
          {formatChartDate(points[0].date)}
        </text>
        <text
          x={VIEW_WIDTH - PAD_X}
          y={VIEW_HEIGHT - 6}
          fontSize={11}
          fill="var(--color-ink-faint)"
          textAnchor="end"
        >
          {formatChartDate(points[points.length - 1].date)}
        </text>
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute -top-1 rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-ink shadow-lg"
          style={{
            left: `${((PAD_X + hoverIndex! * (barWidth + GAP) + barWidth / 2) / VIEW_WIDTH) * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-semibold">{formatValue(active.value)}</p>
          <p className="text-ink-faint">{formatChartDate(active.date)}</p>
        </div>
      )}
    </div>
  )
}
