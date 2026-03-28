export function getApiBase() {
    return localStorage.getItem('backend-url') || 'http://localhost:8080'
}

const HEADERS = {
    'ngrok-skip-browser-warning': 'true',
    'Content-Type': 'application/json',
}

export async function fetchScripts() {
    const res = await fetch(`${getApiBase()}/api/scripts`, { headers: HEADERS })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function runScript(scriptId) {
    const res = await fetch(`${getApiBase()}/api/scripts/${scriptId}/run`, {
        method: 'POST',
        headers: HEADERS,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function fetchLastResult(scriptId) {
    const res = await fetch(`${getApiBase()}/api/scripts/${scriptId}/result`, {
        headers: HEADERS,
    })
    if (res.status === 204) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

const pollingIntervals = {}
const launchTimes = {}

export function connectWebSocket(onConnected) {
    onConnected?.()
}

export function subscribeToScript(scriptId, callback) {
    if (pollingIntervals[scriptId]) {
        clearInterval(pollingIntervals[scriptId])
    }

    // Guarda el momento de lanzamiento
    launchTimes[scriptId] = new Date().toISOString()

    pollingIntervals[scriptId] = setInterval(async () => {
        try {
            const result = await fetchLastResult(scriptId)
            if (result && result.status !== 'RUNNING') {
                // Compara fechas como strings ISO
                if (result.executedAt && result.executedAt >= launchTimes[scriptId].substring(0, 19)) {
                    callback(result)
                    clearInterval(pollingIntervals[scriptId])
                    delete pollingIntervals[scriptId]
                    delete launchTimes[scriptId]
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
    delete launchTimes[scriptId]
}

export function disconnectWebSocket() {
    Object.keys(pollingIntervals).forEach(id => {
        clearInterval(pollingIntervals[id])
    })
}