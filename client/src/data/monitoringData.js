export const monitoringData = [
    {
        id: "EVT-1024",
        endpoint: "/payment/webhook",
        status: "success",
        latency: "182ms",
        retries: 0,
    },
    {
        id: "EVT-1025",
        endpoint: "/order/update",
        status: "failed",
        latency: "2.4s",
        retries: 3,
    },
    {
        id: "EVT-1026",
        endpoint: "/subscription/event",
        status: "retry",
        latency: "1.1s",
        retries: 2,
    },
    {
        id: "EVT-1027",
        endpoint: "/invoice/service",
        status: "success",
        latency: "210ms",
        retries: 0,
    },
]