import { useState, useEffect, useCallback } from 'react'
import ScriptCard from './components/ScriptCard'
import TerminalPanel from './components/TerminalPanel'
import {
    fetchScripts,
    runScript,
    subscribeToScript,
    unsubscribeFromScript,
    connectWebSocket,
} from './services/api'

const CATEGORIES = ['TODOS', 'NETWORK', 'FIREWALL', 'PROCESSES', 'FILESYSTEM', 'USERS', 'UPDATES', 'LOGS']

function loadLocalResults() {
    try {
        const saved = localStorage.getItem('security-dashboard-results')
        return saved ? JSON.parse(saved) : {}
    } catch {
        return {}
    }
}

function saveLocalResults(results) {
    try {
        localStorage.setItem('security-dashboard-results', JSON.stringify(results))
    } catch {}
}

export default function App() {
    const [scripts, setScripts]       = useState([])
    const [results, setResults]       = useState(loadLocalResults)
    const [running, setRunning]       = useState({})
    const [activeOutput, setActive]   = useState(null)
    const [filter, setFilter]         = useState('TODOS')
    const [search, setSearch]         = useState('')
    const [wsReady, setWsReady]       = useState(false)
    const [loading, setLoading]       = useState(true)
    const [error, setError]           = useState(null)
    const [backendUrl, setBackendUrl] = useState(() => {
        return localStorage.getItem('backend-url') || ''
    })
    const [showUrlInput, setShowUrlInput] = useState(() => {
        return !localStorage.getItem('backend-url')
    })

    useEffect(() => {
        if (showUrlInput) return

        fetchScripts()
            .then(data => {
                setScripts(data)
                setLoading(false)
            })
            .catch(err => {
                setError('No se puede conectar con el backend.')
                setLoading(false)
                console.error(err)
            })

        connectWebSocket(() => setWsReady(true))
    }, [showUrlInput])

    const handleScriptMessage = useCallback((scriptId, msg) => {
        if (msg.status === 'RUNNING') {
            setResults(prev => ({
                ...prev,
                [scriptId]: {
                    ...prev[scriptId],
                    scriptId,
                    scriptName: msg.scriptName,
                    status: 'RUNNING',
                    output: (prev[scriptId]?.output || '') + (msg.output || ''),
                }
            }))
        } else {
            setResults(prev => {
                const updated = { ...prev, [scriptId]: msg }
                saveLocalResults(updated)
                return updated
            })
            setRunning(prev => ({ ...prev, [scriptId]: false }))
            unsubscribeFromScript(scriptId)
        }
    }, [])

    const handleRun = useCallback(async (scriptId) => {
        if (running[scriptId]) return

        setResults(prev => ({
            ...prev,
            [scriptId]: { scriptId, status: 'RUNNING', output: '' }
        }))
        setRunning(prev => ({ ...prev, [scriptId]: true }))
        setActive(scriptId)

        subscribeToScript(scriptId, (msg) => handleScriptMessage(scriptId, msg))

        try {
            await runScript(scriptId)
        } catch (e) {
            setResults(prev => {
                const updated = {
                    ...prev,
                    [scriptId]: { scriptId, status: 'ERROR', output: `Error al iniciar: ${e.message}` }
                }
                saveLocalResults(updated)
                return updated
            })
            setRunning(prev => ({ ...prev, [scriptId]: false }))
        }
    }, [running, handleScriptMessage])

    const visible = scripts.filter(s => {
        const matchCat = filter === 'TODOS' || s.category === filter
        const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
    })

    const counts = { success: 0, warning: 0, error: 0 }
    Object.values(results).forEach(r => {
        if (r.status === 'SUCCESS') counts.success++
        else if (r.status === 'WARNING') counts.warning++
        else if (r.status === 'ERROR' || r.status === 'TIMEOUT') counts.error++
    })

    const activeResult = activeOutput ? results[activeOutput] : null
    const activeScript = scripts.find(s => s.id === activeOutput)

    // ── Pantalla de configuración de backend ──────────────────────────────────
    if (showUrlInput) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(0,229,255,0.2)',
                    borderRadius: 16,
                    padding: '40px 32px',
                    width: 420,
                    textAlign: 'center',
                }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                         stroke="#00e5ff" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                        <path d="M12 2L3 7v6c0 5 4 9.3 9 10 5-.7 9-5 9-10V7L12 2z"/>
                        <polyline points="9 12 11 14 15 10"/>
                    </svg>
                    <h2 style={{
                        fontFamily: 'var(--font-ui)', fontWeight: 800,
                        fontSize: 22, marginBottom: 8
                    }}>
                        Security Dashboard
                    </h2>
                    <p style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                        color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6
                    }}>
                        Introduce la URL de tu backend local.<br/>
                        Usa ngrok para exponer tu localhost.
                    </p>
                    <input
                        type="text"
                        placeholder="https://abc123.ngrok-free.app"
                        value={backendUrl}
                        onChange={e => setBackendUrl(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && backendUrl) {
                                localStorage.setItem('backend-url', backendUrl.replace(/\/$/, ''))
                                setShowUrlInput(false)
                            }
                        }}
                        style={{
                            width: '100%',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13,
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(0,229,255,0.3)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            marginBottom: 16,
                            boxSizing: 'border-box',
                        }}
                    />
                    <button
                        onClick={() => {
                            if (backendUrl) {
                                localStorage.setItem('backend-url', backendUrl.replace(/\/$/, ''))
                                setShowUrlInput(false)
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'rgba(0,229,255,0.15)',
                            color: '#00e5ff',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13,
                            cursor: 'pointer',
                            marginBottom: 12,
                        }}
                    >
                        Conectar
                    </button>
                    <button
                        onClick={() => {
                            const url = 'http://localhost:8080'
                            localStorage.setItem('backend-url', url)
                            setBackendUrl(url)
                            setShowUrlInput(false)
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            cursor: 'pointer',
                        }}
                    >
                        Usar localhost:8080
                    </button>
                </div>
            </div>
        )
    }

    // ── Dashboard principal ───────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', paddingBottom: activeOutput ? '44vh' : 0 }}>

            <header style={{
                padding: '28px 32px 0',
                borderBottom: '1px solid var(--border-subtle)',
                position: 'sticky',
                top: 0,
                background: 'rgba(10,12,16,0.92)',
                backdropFilter: 'blur(12px)',
                zIndex: 50,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{
                        width: 36, height: 36,
                        borderRadius: 8,
                        background: 'rgba(0,229,255,0.1)',
                        border: '1px solid rgba(0,229,255,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                             stroke="#00e5ff" strokeWidth="2" strokeLinecap="round">
                            <path d="M12 2L3 7v6c0 5 4 9.3 9 10 5-.7 9-5 9-10V7L12 2z"/>
                            <polyline points="9 12 11 14 15 10"/>
                        </svg>
                    </div>

                    <div>
                        <h1 style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>
                            Security Dashboard
                        </h1>
                        <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: 11,
                            color: 'var(--text-secondary)', marginTop: 1,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
              <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: wsReady ? '#39ff14' : '#ff3d3d',
                  display: 'inline-block',
                  boxShadow: wsReady ? '0 0 6px rgba(57,255,20,0.6)' : 'none',
              }}/>
                            {wsReady ? 'Conectado' : 'Conectando...'}
                            <button
                                onClick={() => setShowUrlInput(true)}
                                style={{
                                    background: 'none',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: 4,
                                    padding: '2px 8px',
                                    color: 'var(--text-muted)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 10,
                                    cursor: 'pointer',
                                }}
                            >
                                cambiar backend
                            </button>
                        </div>
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                        {[
                            { label: 'OK',      count: counts.success, color: '#39ff14' },
                            { label: 'AVISOS',  count: counts.warning, color: '#ffd600' },
                            { label: 'ERRORES', count: counts.error,   color: '#ff3d3d' },
                        ].map(({ label, count, color }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color, lineHeight: 1 }}>
                                    {count}
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: 2 }}>
                                    {label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 16, flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                letterSpacing: '0.05em',
                                padding: '4px 10px',
                                borderRadius: 4,
                                border: `1px solid ${filter === cat ? 'rgba(0,229,255,0.5)' : 'rgba(255,255,255,0.07)'}`,
                                background: filter === cat ? 'rgba(0,229,255,0.1)' : 'transparent',
                                color: filter === cat ? '#00e5ff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {cat}
                        </button>
                    ))}

                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar script..."
                        style={{
                            marginLeft: 'auto',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            padding: '5px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.07)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            width: 200,
                        }}
                    />
                </div>
            </header>

            <main style={{ padding: '28px 32px' }}>
                {loading && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', height: 300, gap: 16,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            border: '2px solid rgba(0,229,255,0.15)',
                            borderTop: '2px solid #00e5ff',
                            animation: 'spin 0.8s linear infinite',
                        }}/>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
              Cargando scripts...
            </span>
                    </div>
                )}

                {error && (
                    <div style={{
                        maxWidth: 480, margin: '80px auto', textAlign: 'center',
                        background: 'rgba(255,61,61,0.06)',
                        border: '1px solid rgba(255,61,61,0.2)',
                        borderRadius: 12, padding: '32px 24px',
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
                        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, marginBottom: 8 }}>
                            Error de conexión
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                            {error}
                        </div>
                        <button
                            onClick={() => setShowUrlInput(true)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 8,
                                border: '1px solid rgba(0,229,255,0.3)',
                                background: 'rgba(0,229,255,0.1)',
                                color: '#00e5ff',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 12,
                                cursor: 'pointer',
                            }}
                        >
                            Cambiar URL del backend
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: 11,
                            color: 'var(--text-muted)', marginBottom: 20, letterSpacing: '0.04em',
                        }}>
                            {visible.length} script{visible.length !== 1 ? 's' : ''} · haz clic para ejecutar
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                            gap: 14,
                        }}>
                            {visible.map((script) => (
                                <ScriptCard
                                    key={script.id}
                                    script={script}
                                    onRun={handleRun}
                                    status={results[script.id]}
                                    isRunning={!!running[script.id]}
                                />
                            ))}
                        </div>

                        {visible.length === 0 && (
                            <div style={{
                                textAlign: 'center', padding: '60px 0',
                                fontFamily: 'var(--font-mono)', fontSize: 13,
                                color: 'var(--text-muted)',
                            }}>
                                Sin resultados para "{search}"
                            </div>
                        )}
                    </>
                )}
            </main>

            {activeOutput && (
                <TerminalPanel
                    scriptName={activeScript?.name || activeOutput}
                    output={activeResult?.output || ''}
                    status={activeResult?.status}
                    onClose={() => setActive(null)}
                />
            )}
        </div>
    )
}