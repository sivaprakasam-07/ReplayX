import api from "./axios"

export const getEvents = async (
    limit = 20,
    skip = 0
) => {

    const response = await api.get(
        `/events?limit=${limit}&skip=${skip}`
    )

    return response.data
}