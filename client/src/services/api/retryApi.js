import api from "./axios"
import { retryData, retryEvents } from "../../data/retryData"

export const getRetryAnalytics = async () => {
    try {
        const response = await api.get(`/retries/analytics`)
        return response.data
    } catch (error) {
        console.error("Failed to fetch retry analytics, returning fallback:", error)
        return {
            timeline: retryData,
            summary: {
                total_retries: 3421,
                recovery_rate: 87.0,
                failed_retries: 142,
            },
            ml_predictions: {
                predicted_retry_volume: 428,
                predicted_spike_time: "14:00",
                predicted_retries: retryData.map(d => d.predicted_retries),
                predicted_recoveries: retryData.map(d => d.predicted_recovered),
                risk_level: "medium",
                forecast: "degraded",
            },
            failure_patterns: [
                { pattern: "timeout_spike", severity: "high", count: 3 },
                { pattern: "rate_limit_burst", severity: "medium", count: 2 },
            ],
            retry_events: retryEvents,
        }
    }
}

export const triggerRetry = async (eventId) => {
    try {
        const response = await api.post(`/retries/trigger/${eventId}`)
        return response.data
    } catch (error) {
        console.error("Failed to trigger retry:", error)
        throw error
    }
}

export const getOperationsQueue = async (status = "all") => {
    try {
        const response = await api.get(`/operations/queue?status=${status}`)
        return response.data
    } catch (error) {
        console.error("Failed to fetch operations queue:", error)
        return []
    }
}

export const processPendingOperations = async () => {
    try {
        const response = await api.post(`/operations/process-pending`)
        return response.data
    } catch (error) {
        console.error("Failed to process pending operations:", error)
        return { processed: 0, results: [] }
    }
}

export const scheduleAuto = async (eventId) => {
    try {
        const response = await api.post(`/operations/schedule/${eventId}`)
        return response.data
    } catch (error) {
        console.error("Failed to schedule auto operations:", error)
        throw error
    }
}

export default {
    getRetryAnalytics,
    triggerRetry,
    getOperationsQueue,
    processPendingOperations,
    scheduleAuto,
}
