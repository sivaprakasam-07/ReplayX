import api from "./axios"
import { replayData } from "../../data/replayData"

export const getReplayRecommendations = async () => {
    try {
        const response = await api.get(`/replay/recommendations`)
        return response.data
    } catch (error) {
        console.error("Failed to fetch replay recommendations, returning fallback:", error)
        return replayData
    }
}

export const executeReplay = async (eventId) => {
    try {
        const response = await api.post(`/replay/execute/${eventId}`)
        return response.data
    } catch (error) {
        console.error("Failed to execute replay:", error)
        throw error
    }
}

export default {
    getReplayRecommendations,
    executeReplay,
}