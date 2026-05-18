import React from "react"
import StatusPill from "../common/StatusPill"

const defaultEvents = [
    { id: "RTY-201", endpoint: "/payment/webhook", status: "retrying", attempts: 3, delay: "12s", risk_score: 0.72, failure_pattern: "timeout_spike" },
    { id: "RTY-202", endpoint: "/invoice/service", status: "recovered", attempts: 2, delay: "8s", risk_score: 0.35, failure_pattern: "normal" },
    { id: "RTY-203", endpoint: "/subscription/event", status: "failed", attempts: 5, delay: "31s", risk_score: 0.91, failure_pattern: "unstable_endpoint" },
]

const RetryTable = ({ events }) => {
    const data = events || defaultEvents

    return (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">

            <table className="w-full">

                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">

                    <tr>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Retry ID
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Endpoint
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Status
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Attempts
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Delay
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Risk Score
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Failure Pattern
                        </th>

                    </tr>

                </thead>

                <tbody>

                    {data.map((retry) => (
                        <tr
                            key={retry.id}
                            className="border-b border-[#F1F5F9] hover:bg-[#FAFBFC]"
                        >

                            <td className="px-6 py-4 text-sm font-semibold text-[#1F2937]">
                                {retry.id}
                            </td>

                            <td className="px-6 py-4 text-sm text-[#6B7280]">
                                {retry.endpoint}
                            </td>

                            <td className="px-6 py-4">
                                <StatusPill status={retry.status} />
                            </td>

                            <td className="px-6 py-4 text-sm text-[#1F2937]">
                                {retry.attempts}
                            </td>

                            <td className="px-6 py-4 text-sm text-[#1F2937]">
                                {retry.delay}
                            </td>

                            <td className="px-6 py-4">
                                {retry.risk_score != null ? (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${retry.risk_score > 0.7
                                            ? "bg-[#FEE2E2] text-[#DC2626]"
                                            : retry.risk_score > 0.3
                                                ? "bg-[#FEF3C7] text-[#D97706]"
                                                : "bg-[#DCFCE7] text-[#15803D]"
                                        }`}>
                                        {(retry.risk_score * 100).toFixed(0)}
                                    </span>
                                ) : (
                                    <span className="text-sm text-[#9CA3AF]">--</span>
                                )}
                            </td>

                            <td className="px-6 py-4">
                                {retry.failure_pattern ? (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${retry.failure_pattern === "normal"
                                            ? "bg-[#DCFCE7] text-[#15803D]"
                                            : retry.failure_pattern.includes("timeout") || retry.failure_pattern.includes("unstable")
                                                ? "bg-[#FEE2E2] text-[#DC2626]"
                                                : "bg-[#FEF3C7] text-[#D97706]"
                                        }`}>
                                        {retry.failure_pattern}
                                    </span>
                                ) : (
                                    <span className="text-sm text-[#9CA3AF]">--</span>
                                )}
                            </td>

                        </tr>
                    ))}

                </tbody>

            </table>

        </div>
    )
}

export default React.memo(RetryTable)