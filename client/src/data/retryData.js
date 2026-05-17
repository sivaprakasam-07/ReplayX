export const retryData = [
    { time: "00:00", retries: 12, recovered: 8, predicted_retries: 10, predicted_recovered: 9 },
    { time: "04:00", retries: 19, recovered: 14, predicted_retries: 16, predicted_recovered: 15 },
    { time: "08:00", retries: 31, recovered: 25, predicted_retries: 28, predicted_recovered: 26 },
    { time: "12:00", retries: 46, recovered: 37, predicted_retries: 42, predicted_recovered: 39 },
    { time: "16:00", retries: 28, recovered: 22, predicted_retries: 25, predicted_recovered: 23 },
    { time: "20:00", retries: 18, recovered: 15, predicted_retries: 16, predicted_recovered: 15 },
]

export const retryEvents = [
    { id: "RTY-201", endpoint: "/payment/webhook", status: "retrying", attempts: 3, delay: "12s", risk_score: 0.72, failure_pattern: "timeout_spike" },
    { id: "RTY-202", endpoint: "/invoice/service", status: "recovered", attempts: 2, delay: "8s", risk_score: 0.35, failure_pattern: "normal" },
    { id: "RTY-203", endpoint: "/subscription/event", status: "failed", attempts: 5, delay: "31s", risk_score: 0.91, failure_pattern: "unstable_endpoint" },
]
