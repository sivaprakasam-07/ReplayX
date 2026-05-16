import api from "./axios"

const mockEvents = [
    {
        event: {
            event_id: "EVT-1024",
            event_type: "payment.webhook",
            customer_id: "CUST-1001",
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
            event_type: "order.updated",
            customer_id: "CUST-1044",
        },
        delivery_history: [
            {
                attempt_number: 1,
                delivery_status: "failed",
                failure_reason: "Timeout while reaching endpoint",
            },
            {
                attempt_number: 2,
                delivery_status: "retry",
                failure_reason: "Retry scheduled by policy",
            },
        ],
    },
]

export const getEvents = async (limit = 20, skip = 0) => {
    try {
        const response = await api.get(`/events?limit=${limit}&skip=${skip}`)
        return response.data
    } catch {
        return mockEvents
    }
}

export const getEventById = async (eventId) => {
    try {
        const response = await api.get(`/events/${eventId}`)
        return response.data
    } catch {
        return (
            mockEvents.find((item) => item.event.event_id === eventId) ?? mockEvents[0]
        )
    }
}