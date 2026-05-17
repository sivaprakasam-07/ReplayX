import api from "./axios"
import { endpointData } from "../../data/endpointData"

export const getEndpointsHealth =
    async () => {

        try {

            const response =
                await api.get(
                    `/endpoints/health`
                )

            return response.data

        } catch (error) {

            console.error(
                "Failed to fetch endpoints health, returning fallback:",
                error
            )

            return endpointData
        }
    }

export default {
    getEndpointsHealth,
}