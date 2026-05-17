import axios from "axios"

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

const api = axios.create({
    baseURL: `${API_BASE}/api/v1`,
    timeout: 30000,
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