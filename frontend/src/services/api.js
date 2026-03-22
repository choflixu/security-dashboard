export function getApiBase() {
    return localStorage.getItem('backend-url') || 'http://localhost:8080'
}

export async function fetchScripts() {
    const res = await fetch(`${getApiBase()}/api/scripts`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function runScript(scriptId) {
    const res = await fetch(`${getApiBase()}/api/scripts/${scriptId}/run`, {
        method: 'POST',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function fetchLastResult(scriptId) {
    const res = await fetch(`${getApiBase()}/api/scripts/${scriptId}/result`)
    if (res.status === 204) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

const pollingIntervals = {}

export function connectWebSocket(onConnected) {
    onConnected?.()
}

export function subscribeToScript(scriptId, callback) {
    if (pollingIntervals[scriptId]) {
        clearInterval(pollingIntervals[scriptId])
    }

    const launchedAt = Date.now()

    pollingIntervals[scriptId] = setInterval(async () => {
        try {
            const result = await fetchLastResult(scriptId)
            if (result) {
                const resultTime = result.executedAt
                    ? new Date(result.executedAt).getTime()
                    : 0

                if (resultTime >= launchedAt - 5000) {
                    callback(result)
                    if (result.status !== 'RUNNING') {
                        clearInterval(pollingIntervals[scriptId])
                        delete pollingIntervals[scriptId]
                    }
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