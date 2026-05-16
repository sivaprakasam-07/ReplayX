import api from "./axios"

export const analyzeEvent = async (
    eventId
) => {

    const response = await api.get(
        `/intelligence/analyze/${eventId}`
    )

    return response.data
}