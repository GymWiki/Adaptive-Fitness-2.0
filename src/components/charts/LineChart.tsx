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

export function LineChart({ points, formatValue = (v) => `${Math.round(v)}` }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (points.length === 0) return null

  const values = points.map((p) => p.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const spread = rawMax - rawMin || 1
  const min = rawMin - spread * 0.15
  const max = rawMax + spread * 0.15

  const innerWidth = VIEW_WIDTH - PAD_X * 2
  const innerHeight = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM

  function xFor(index: number) {
    if (points.length === 1) return PAD_X + innerWidth / 2
    return PAD_X + (index / (points.length - 1)) * innerWidth
  }

  function yFor(value: number) {
    return PAD_TOP + innerHeight * (1 - (value - min) / (max - min))
  }

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.value)}`).join(' ')
  const active = hoverIndex !== null ? points[hoverIndex] : null

  function handlePointerMove(clientX: number, target: SVGSVGElement) {
    const rect = target.getBoundingClientRect()
    const relativeX = ((clientX - rect.left) / rect.width) * VIEW_WIDTH
    let closest = 0
    let closestDistance = Infinity
    points.forEach((_, i) => {
      const distance = Math.abs(xFor(i) - relativeX)
      if (distance < closestDistance) {
        closestDistance = distance
        closest = i
      }
    })
    setHoverIndex(closest)
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-44 w-full touch-none"
        onMouseMove={(e) => handlePointerMove(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.currentTarget)}
        onTouchEnd={() => setHoverIndex(null)}
      >
        <line
          x1={PAD_X}
          y1={VIEW_HEIGHT - PAD_BOTTOM}
          x2={VIEW_WIDTH - PAD_X}
          y2={VIEW_HEIGHT - PAD_BOTTOM}
          stroke="var(--color-border)"
          strokeWidth={1}
        />

        {active && (
          <line
            x1={xFor(hoverIndex!)}
            y1={PAD_TOP}
            x2={xFor(hoverIndex!)}
            y2={VIEW_HEIGHT - PAD_BOTTOM}
            stroke="var(--color-border-strong)"
            strokeWidth={1}
          />
        )}

        <path
          d={path}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={xFor(i)}
            cy={yFor(p.value)}
            r={hoverIndex === i ? 5 : 4}
            fill="var(--color-accent)"
            stroke="var(--color-surface)"
            strokeWidth={2}
          />
        ))}

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
            left: `${(xFor(hoverIndex!) / VIEW_WIDTH) * 100}%`,
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
