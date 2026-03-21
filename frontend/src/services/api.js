import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const API_BASE = import.meta.env.VITE_API_URL || ''

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

// ── WebSocket (STOMP over SockJS) ─────────────────────────────────────────────

let stompClient = null
const subscriptions = {}

export function connectWebSocket(onConnected) {
  if (stompClient?.active) {
    onConnected?.()
    return
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('[WS] Conectado')
      onConnected?.()
    },
    onDisconnect: () => console.log('[WS] Desconectado'),
    onStompError: (frame) => console.error('[WS] Error STOMP:', frame),
  })

  stompClient.activate()
}

export function subscribeToScript(scriptId, callback) {
  const topic = `/topic/script-output/${scriptId}`

  if (subscriptions[topic]) {
    subscriptions[topic].unsubscribe()
  }

  if (!stompClient?.active) {
    connectWebSocket(() => {
      subscriptions[topic] = stompClient.subscribe(topic, (msg) => {
        callback(JSON.parse(msg.body))
      })
    })
    return
  }

  subscriptions[topic] = stompClient.subscribe(topic, (msg) => {
    callback(JSON.parse(msg.body))
  })
}

export function unsubscribeFromScript(scriptId) {
  const topic = `/topic/script-output/${scriptId}`
  subscriptions[topic]?.unsubscribe()
  delete subscriptions[topic]
}

export function disconnectWebSocket() {
  stompClient?.deactivate()
}
