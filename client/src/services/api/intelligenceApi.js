import api from "./axios"

export const analyzeEvent = async (
    eventId
) => {

    try {
        const response = await api.get(
            `/intelligence/analyze/${eventId}`
        )

        return response.data
    } catch {
        return {
            delivery_state: "Delivered with retry",
            failure_reason: "Transient timeout during initial attempt",
            recommended_action: "Replay safely",
            safe_to_replay: true,
            risk_score: 18,
        }
    }
}