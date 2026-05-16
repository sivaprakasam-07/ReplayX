import api from "./axios"

export const triggerSimulation =
    async (type) => {

        const response =
            await api.post(
                `/simulate/${type}`
            )

        return response.data
    }