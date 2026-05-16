export const replayData = [
    {
        id: "RPL-101",
        endpoint: "/payment/webhook",
        status: "success",
        recommendation: "Safe Replay",
        risk: "Low",
    },
    {
        id: "RPL-102",
        endpoint: "/invoice/service",
        status: "warning",
        recommendation: "Duplicate Risk",
        risk: "Medium",
    },
    {
        id: "RPL-103",
        endpoint: "/subscription/event",
        status: "failed",
        recommendation: "Replay Blocked",
        risk: "High",
    },
]