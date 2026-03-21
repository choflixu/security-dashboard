import { useEffect, useRef } from 'react'

// Colorea lineas de output segun palabras clave
function colorLine(line) {
  if (/\[ALERTA\]|\[ERROR\]|FAILED|DENIED|WARNING/i.test(line))
    return '#ff3d3d'
  if (/\[AVISO\]|\[REVISAR\]|AVISO/i.test(line))
    return '#ffd600'
  if (/\[OK\]|SUCCESS|completado/i.test(line))
    return '#39ff14'
  if (/\[INFO\]|Iniciando|Analisis/i.test(line))
    return '#00e5ff'
  if (/^={3,}|^-{3,}|^>{2}/.test(line))
    return '#7a8499'
  return '#c8d0e0'
}

export default function TerminalPanel({ scriptName, output, status, onClose }) {
  const bottomRef = useRef(null)
  const lines = output ? output.split('\n') : []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  if (!scriptName) return null

  const isRunning = status === 'RUNNING'

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: '42vh',
      background: 'var(--bg-terminal)',
      borderTop: '1px solid rgba(0,229,255,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      animation: 'fadeInUp 0.25s ease',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,229,255,0.04)',
        flexShrink: 0,
      }}>
        {/* Traffic lights */}
        <span style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff3d3d' }}/>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffd600' }}/>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#39ff14' }}/>
        </span>

        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          flex: 1,
        }}>
          bash — {scriptName}
          {isRunning && (
            <span style={{
              marginLeft: 8,
              color: '#00e5ff',
              animation: 'blink 1s step-end infinite',
            }}>●</span>
          )}
        </span>

        {/* Status badge */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          padding: '2px 8px',
          borderRadius: 4,
          background: isRunning
            ? 'rgba(0,229,255,0.1)'
            : status === 'SUCCESS' ? 'rgba(57,255,20,0.1)'
            : status === 'ERROR'   ? 'rgba(255,61,61,0.1)'
            : status === 'WARNING' ? 'rgba(255,214,0,0.1)'
            : 'rgba(255,255,255,0.05)',
          color: isRunning
            ? '#00e5ff'
            : status === 'SUCCESS' ? '#39ff14'
            : status === 'ERROR'   ? '#ff3d3d'
            : status === 'WARNING' ? '#ffd600'
            : 'var(--text-secondary)',
        }}>
          {status || 'RUNNING'}
        </span>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: '0 4px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >
          ✕
        </button>
      </div>

      {/* Output area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        lineHeight: 1.6,
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{ color: colorLine(line), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {line || '\u00a0'}
          </div>
        ))}

        {/* Blinking cursor at end */}
        {isRunning && (
          <span style={{
            display: 'inline-block',
            width: 8, height: 14,
            background: '#00e5ff',
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            animation: 'blink 0.8s step-end infinite',
          }}/>
        )}

        <div ref={bottomRef}/>
      </div>
    </div>
  )
}
