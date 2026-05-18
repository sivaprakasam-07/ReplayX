import StatusPill from "../common/StatusPill"

import React from "react"

const ReplayTable = ({ replays }) => {

    return (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">

            <table className="w-full">

                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">

                    <tr>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Event ID
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Replay Safe
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Risk Level
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Failure Reason
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Recommended Action
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            ML Confidence
                        </th>

                    </tr>

                </thead>

                <tbody>

                    {replays.map((replay) => (

                        <tr
                            key={replay.event_id}
                            className="border-b border-[#F1F5F9] hover:bg-[#FAFBFC]"
                        >

                            <td className="px-6 py-4 text-sm font-semibold text-[#1F2937]">
                                {replay.event_id}
                            </td>

                            <td className="px-6 py-4">
                                <StatusPill
                                    status={
                                        replay.safe_to_replay
                                            ? "safe"
                                            : "blocked"
                                    }
                                />
                            </td>

                            <td className="px-6 py-4 text-sm font-medium text-[#1F2937] capitalize">
                                {replay.risk_level}
                            </td>

                            <td className="px-6 py-4 text-sm text-[#6B7280]">
                                {replay.reason}
                            </td>

                            <td className="px-6 py-4 text-sm font-medium text-[#1F2937]">
                                {replay.recommended_action}
                            </td>

                            <td className="px-6 py-4">
                                {replay.ml_confidence != null ? (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${replay.ml_confidence > 80
                                            ? "bg-[#DCFCE7] text-[#15803D]"
                                            : replay.ml_confidence > 60
                                                ? "bg-[#FEF3C7] text-[#D97706]"
                                                : "bg-[#FEE2E2] text-[#DC2626]"
                                        }`}>
                                        {replay.ml_confidence}%
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

export default React.memo(ReplayTable)