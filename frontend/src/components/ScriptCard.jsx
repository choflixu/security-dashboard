import { useState } from 'react'
import ScriptIcon from './ScriptIcon'

const STATUS_CONFIG = {
  SUCCESS: { color: '#39ff14', label: 'OK',      glow: '0 0 12px rgba(57,255,20,0.4)' },
  WARNING: { color: '#ffd600', label: 'AVISO',   glow: '0 0 12px rgba(255,214,0,0.4)' },
  ERROR:   { color: '#ff3d3d', label: 'ERROR',   glow: '0 0 12px rgba(255,61,61,0.4)' },
  TIMEOUT: { color: '#ff8c00', label: 'TIMEOUT', glow: '0 0 12px rgba(255,140,0,0.4)' },
  RUNNING: { color: '#00e5ff', label: 'RUNNING', glow: '0 0 12px rgba(0,229,255,0.4)' },
  IDLE:    { color: '#3d4558', label: 'INACTIVO',glow: 'none' },
}

const CATEGORY_COLORS = {
  NETWORK:    '#00e5ff',
  PROCESSES:  '#b388ff',
  FILESYSTEM: '#ffd600',
  USERS:      '#39ff14',
  UPDATES:    '#ff8c00',
  FIREWALL:   '#ff3d3d',
  LOGS:       '#82b1ff',
}

export default function ScriptCard({ script, onRun, status, isRunning }) {
  const [hovered, setHovered] = useState(false)

  const statusKey = isRunning ? 'RUNNING' : (status?.status || 'IDLE')
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.IDLE
  const catColor = CATEGORY_COLORS[script.category] || '#3d4558'

  return (
    <button
      onClick={() => onRun(script.id)}
      disabled={isRunning}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        padding: '20px 18px',
        background: hovered && !isRunning
          ? 'var(--bg-card-hover)'
          : 'var(--bg-card)',
        border: `1px solid ${hovered && !isRunning ? catColor + '55' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: isRunning ? 'wait' : 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        transform: hovered && !isRunning ? 'translateY(-2px)' : 'none',
        boxShadow: hovered && !isRunning
          ? `0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px ${catColor}22`
          : '0 2px 8px rgba(0,0,0,0.3)',
        animation: 'fadeInUp 0.3s ease both',
        width: '100%',
      }}
    >
      {/* Category accent bar */}
      <span style={{
        position: 'absolute',
        top: 0, left: 16, right: 16,
        height: 2,
        background: catColor,
        borderRadius: '0 0 2px 2px',
        opacity: hovered ? 0.8 : 0.3,
        transition: 'opacity 0.2s',
      }}/>

      {/* Icon + Status dot row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ color: catColor, opacity: isRunning ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <ScriptIcon name={script.icon} size={26} />
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Pulse ring when running */}
          {isRunning && (
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <span style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                border: `1px solid ${cfg.color}`,
                animation: 'pulse-ring 1s ease-out infinite',
              }}/>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: cfg.color,
                boxShadow: cfg.glow,
                animation: 'spin 1s linear infinite',
              }}/>
            </span>
          )}
          {!isRunning && statusKey !== 'IDLE' && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: cfg.color,
              boxShadow: cfg.glow,
            }}/>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.05em',
            color: cfg.color,
            opacity: statusKey === 'IDLE' ? 0.4 : 1,
          }}>
            {cfg.label}
          </span>
        </span>
      </div>

      {/* Script name */}
      <div>
        <div style={{
          fontFamily: 'var(--font-ui)',
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
          marginBottom: 4,
        }}>
          {script.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
        }}>
          {script.description}
        </div>
      </div>

      {/* Duration if available */}
      {status?.durationMs && !isRunning && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          marginTop: 'auto',
        }}>
          {(status.durationMs / 1000).toFixed(1)}s · {script.category}
        </div>
      )}

      {/* Scanline overlay on hover */}
      {hovered && !isRunning && (
        <span style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <span style={{
            position: 'absolute',
            left: 0, right: 0,
            height: 60,
            background: `linear-gradient(transparent, ${catColor}08, transparent)`,
            animation: 'scanline 1.5s linear infinite',
          }}/>
        </span>
      )}
    </button>
  )
}
