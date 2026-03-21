

const API_BASE = 'https://security-dashboard-production-8563.up.railway.app'

// ── REST ──────────────────────────────────────────────────────────────────────

export async function fetchScripts() {
    const res = await fetch(`${API_BASE}/api/scripts`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function runScript(scriptId) {
    const res = await fetch(`${API_BASE}/api/scripts/${scriptId}/run`, {
        method: 'POST',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function fetchLastResult(scriptId) {
    const res = await fetch(`${API_BASE}/api/scripts/${scriptId}/result`)
    if (res.status === 204) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

// ── Polling (reemplaza WebSocket) ─────────────────────────────────────────────

const pollingIntervals = {}

export function connectWebSocket(onConnected) {
    // Sin WebSocket, simulamos conexión inmediata
    onConnected?.()
}

export function subscribeToScript(scriptId, callback) {
    // Polling cada 2 segundos
    if (pollingIntervals[scriptId]) {
        clearInterval(pollingIntervals[scriptId])
    }

    pollingIntervals[scriptId] = setInterval(async () => {
        try {
            const result = await fetchLastResult(scriptId)
            if (result) {
                callback(result)
                // Si el script terminó, parar el polling
                if (result.status !== 'RUNNING') {
                    clearInterval(pollingIntervals[scriptId])
                    delete pollingIntervals[scriptId]
                }
            }
        } catch (e) {
            console.error('Polling error:', e)
        }
    }, 2000)
}

export function unsubscribeFromScript(scriptId) {
    if (pollingIntervals[scriptId]) {
        clearInterval(pollingIntervals[scriptId])
        delete pollingIntervals[scriptId]
    }
}

export function disconnectWebSocket() {
    Object.keys(pollingIntervals).forEach(id => {
        clearInterval(pollingIntervals[id])
    })
}
