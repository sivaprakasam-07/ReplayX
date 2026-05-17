const DEFAULT_WS_URL = "ws://127.0.0.1:8000/ws/events"

let socket = null
let reconnectTimer = null
const subscribers = new Set()

const getWebSocketUrl = () => import.meta.env.VITE_WS_URL || DEFAULT_WS_URL

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

const connect = () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return socket
    }

    if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
        reconnectTimer = null
    }

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
    }

    socket.onerror = (error) => {
        console.error("WebSocket error:", error)
    }

    socket.onclose = () => {
        socket = null
        if (subscribers.size > 0) {
            reconnectTimer = window.setTimeout(() => {
                reconnectTimer = null
                connect()
            }, 3000)
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
        }
    }
}

export const isRetryLifecycleMessage = (message) =>
    message?.type === "retry_completed" || message?.type === "retry_failed"
