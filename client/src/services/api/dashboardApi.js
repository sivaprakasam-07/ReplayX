import api from "./axios"

export const getDashboardMetrics = async () => {
    try {
        const response = await api.get('/dashboard/metrics')
        return response.data
    } catch (error) {
        console.error("Failed to fetch dashboard metrics:", error)
        return null
    }
}

export const getRetryAnalytics = async () => {
    try {
        const response = await api.get('/retries/analytics')
        return response.data
    } catch (error) {
        console.error("Failed to fetch retry analytics:", error)
        return null
    }
}

export const getEndpointsHealth = async () => {
    try {
        const response = await api.get('/endpoints/health')
        return response.data
    } catch (error) {
        console.error("Failed to fetch endpoints health:", error)
        return null
    }
}

export const getReplayRecommendations = async () => {
    try {
        const response = await api.get('/replay/recommendations')
        return response.data
    } catch (error) {
        console.error("Failed to fetch replay recommendations:", error)
        return null
    }
}
