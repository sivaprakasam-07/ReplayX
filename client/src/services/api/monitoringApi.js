import api from "./axios"

// Shared lightweight mock fallback used when backend is unavailable
const mockEvents = [
    {
        event: {
            event_id: "EVT-1024",
            event_type: "invoice.created",
            customer_id: "CUST-1001",
            delivery_state: "delivered",
            risk_score: 0.15,
        },
        delivery_history: [
            {
                attempt_number: 1,
                delivery_status: "success",
                failure_reason: null,
            },
        ],
    },
    {
        event: {
            event_id: "EVT-1025",
            event_type: "payment.failed",
            customer_id: "CUST-1044",
            delivery_state: "recovered",
            risk_score: 0.55,
        },
        delivery_history: [
            {
                attempt_number: 1,
                delivery_status: "failed",
                failure_reason: "Timeout while reaching endpoint",
            },
            {
                attempt_number: 2,
                delivery_status: "success",
                failure_reason: null,
            },
        ],
    },
    {
        event: {
            event_id: "EVT-1026",
            event_type: "compliance.failed",
            customer_id: "CUST-1077",
            delivery_state: "failed",
            risk_score: 0.88,
        },
        delivery_history: [
            {
                attempt_number: 1,
                delivery_status: "failed",
                failure_reason: "Invalid signature",
            },
            {
                attempt_number: 2,
                delivery_status: "failed",
                failure_reason: "Rate limited",
            },
        ],
    },
]

export const getEvents = async (limit = 50, skip = 0) => {
    try {
        const response = await api.get(`/events?limit=${limit}&skip=${skip}`)
        return response.data
    } catch (error) {
        console.error("Failed to fetch events, returning fallback mock:", error)

        // Normalize fallback to the same shape monitoring expects (array of events)
        return mockEvents.map((m) => m.event)
    }
}

export const getEventById = async (eventId) => {
    try {
        const response = await api.get(`/events/${eventId}`)
        return response.data
    } catch (error) {
        console.error("Failed to fetch event details, returning fallback:", error)

        const found = mockEvents.find((item) => item.event.event_id === eventId)
        return (found && found.event) || mockEvents[0].event
    }
}

export const getEventIntelligence = async (eventId) => {
    try {
        const response = await api.get(`/intelligence/analyze/${eventId}`)
        return response.data
    } catch (error) {
        console.error("Failed to fetch event intelligence, returning fallback:", error)

        return {
            delivery_state: "recovered",
            failure_reason: "Transient timeout during initial attempt",
            recommended_action: "Replay safely",
            safe_to_replay: true,
            risk_score: 0.35,
            ml_predictions: {
                retry_success_probability: 72,
                predicted_recovery_time: "45s",
                risk_level: "medium",
                forecast: "degraded",
                ai_confidence: 84,
            },
            failure_patterns: [
                { pattern: "timeout_spike", severity: "medium" }
            ],
        }
    }
}