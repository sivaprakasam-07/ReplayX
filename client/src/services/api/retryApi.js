import api from "./axios"
import { retryData } from "../../data/retryData"

export const getRetryAnalytics = async () => {
    try {
        const response = await api.get(`/retries/analytics`)
        return response.data
    } catch (error) {
        console.error("Failed to fetch retry analytics, returning fallback:", error)
        return { data: retryData }
    }
}

export default {
    getRetryAnalytics,
}
