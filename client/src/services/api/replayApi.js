import api from "./axios"
import { replayData } from "../../data/replayData"

export const getReplayRecommendations = async (limit = 10, skip = 0) => {
    try {
        const response = await api.get(`/replay/recommendations?limit=${limit}&skip=${skip}`)
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