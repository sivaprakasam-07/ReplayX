import axios from "axios"

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1`,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
})

api.interceptors.request.use(
    (config) => {

        console.log(
            `API Request → ${config.method?.toUpperCase()} ${config.url}`
        )

        return config
    },

    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => response,

    (error) => {

        console.error(
            "API Error:",
            error.response?.data || error.message
        )

        return Promise.reject(error)
    }
)

export default api