const WS_EVENTS_PATH = "/ws/events"
const POLL_INTERVAL = 5000

let socket = null
let reconnectTimer = null
let pollTimer = null
const subscribers = new Set()
const statusListeners = new Set()
let currentStatus = "disconnected"
let isPolling = false

const getApiBase = () => import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

const ensureEventsPath = (url) => {
    if (url.endsWith("/ws/events")) {
        return url
    }
    if (url.endsWith("/ws")) {
        return `${url}/events`
    }
    return `${url.replace(/\/+$/, "")}${WS_EVENTS_PATH}`
}

const getWebSocketUrl = () => {
    const envUrl = import.meta.env.VITE_WS_URL?.trim()
    if (envUrl) {
        return ensureEventsPath(envUrl)
    }

    if (typeof window !== "undefined") {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws"
        return `${protocol}://${window.location.host}${WS_EVENTS_PATH}`
    }

    return WS_EVENTS_PATH
}

const notifyStatus = (status) => {
    currentStatus = status
    statusListeners.forEach((cb) => {
        try { cb(status) } catch (e) { console.error(e) }
    })
}

const normalizeMessage = (message) => ({
    type: message?.type || message?.data?.type || "unknown",
    event_id:
        message?.event_id ||
        message?.data?.event_id ||
        message?.data?.event?.event_id ||
        message?.data?.event?.event?.event_id ||
        null,
    status: message?.status || message?.data?.status || null,
    message: message?.message || message?.data?.message || "",
    data: message?.data || message,
    raw: message,
})

const dispatchMessage = (message) => {
    const normalized = normalizeMessage(message)
    console.debug('[socket] dispatch normalized:', normalized)
    subscribers.forEach((handler) => {
        try {
            handler(normalized)
        } catch (error) {
            console.error("Socket subscriber error:", error)
        }
    })
}

// --- Polling fallback for Render free tier (no WebSocket) ---
const seenEventIds = new Set()

const startPollingFallback = () => {
    if (pollTimer) return
    isPolling = true
    notifyStatus("connected")

    const poll = async () => {
        if (subscribers.size === 0) return
        try {
            const res = await fetch(`${getApiBase()}/api/v1/events?limit=10`)
            const data = await res.json()
            const events = data.events || data || []
            if (Array.isArray(events)) {
                events.forEach((evt) => {
                    if (!evt.event_id) return
                    if (!seenEventIds.has(evt.event_id)) {
                        seenEventIds.add(evt.event_id)
                        dispatchMessage({
                            type: "poll_event",
                            event_id: evt.event_id,
                            data: { event: evt },
                        })
                    }
                })
            }
        } catch (e) {
            console.warn("[socket] polling error:", e)
        }
    }

    poll()
    pollTimer = setInterval(poll, POLL_INTERVAL)
}

const stopPollingFallback = () => {
    if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
    }
    isPolling = false
}
// --- End polling fallback ---

const connect = () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return socket
    }

    if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
        reconnectTimer = null
    }

    notifyStatus("connecting")
    socket = new WebSocket(getWebSocketUrl())

    socket.onmessage = (event) => {
        try {
            const parsed = JSON.parse(event.data)
            console.debug('[socket] onmessage raw:', parsed)
            dispatchMessage(parsed)
        } catch (error) {
            console.error("Failed to parse websocket payload:", error)
        }
    }

    socket.onopen = () => {
        console.info('[socket] connected to', getWebSocketUrl())
        stopPollingFallback()
        notifyStatus("connected")
    }

    socket.onerror = () => {
        if (!isPolling && subscribers.size > 0) {
            startPollingFallback()
        }
    }

    socket.onclose = () => {
        socket = null
        if (!isPolling) {
            notifyStatus("disconnected")
            if (subscribers.size > 0) {
                reconnectTimer = window.setTimeout(() => {
                    reconnectTimer = null
                    connect()
                }, 3000)
            }
        }
    }

    return socket
}

export const subscribeToRealtimeEvents = (handler) => {
    subscribers.add(handler)
    connect()

    return () => {
        subscribers.delete(handler)

        if (subscribers.size === 0) {
            if (reconnectTimer) {
                window.clearTimeout(reconnectTimer)
                reconnectTimer = null
            }

            if (socket) {
                try {
                    socket.close()
                } catch (error) {
                    console.error(error)
                }
                socket = null
            }

            stopPollingFallback()
        }
    }
}

export const subscribeToConnectionStatus = (callback) => {
    statusListeners.add(callback)
    callback(currentStatus)
    return () => statusListeners.delete(callback)
}

export const isRetryLifecycleMessage = (message) =>
    message?.type === "retry_completed" || message?.type === "retry_failed"

export const isPollingFallback = () => isPolling
