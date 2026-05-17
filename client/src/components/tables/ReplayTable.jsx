import StatusPill from "../common/StatusPill"

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

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    )
}

export default ReplayTable