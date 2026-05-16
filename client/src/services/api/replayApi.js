import api from "./axios"
import { replayData } from "../../data/replayData"

export const getReplayRecommendations = async () => {
    try {
        const response = await api.get(`/replay/recommendations`)
        return response.data
    } catch (error) {
        console.error("Failed to fetch replay recommendations, returning fallback:", error)
        return { recommendations: replayData }
    }
}

export default {
    getReplayRecommendations,
}
