import { replayData } from "../../data/replayData"
import StatusPill from "../common/StatusPill"

const ReplayTable = () => {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">

            <table className="w-full">

                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">

                    <tr>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Replay ID
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Endpoint
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Status
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Recommendation
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                            Risk
                        </th>

                    </tr>

                </thead>

                <tbody>

                    {replayData.map((replay) => (
                        <tr
                            key={replay.id}
                            className="border-b border-[#F1F5F9] hover:bg-[#FAFBFC]"
                        >

                            <td className="px-6 py-4 text-sm font-semibold text-[#1F2937]">
                                {replay.id}
                            </td>

                            <td className="px-6 py-4 text-sm text-[#6B7280]">
                                {replay.endpoint}
                            </td>

                            <td className="px-6 py-4">
                                <StatusPill status={replay.status} />
                            </td>

                            <td className="px-6 py-4 text-sm font-medium text-[#1F2937]">
                                {replay.recommendation}
                            </td>

                            <td className="px-6 py-4 text-sm text-[#1F2937]">
                                {replay.risk}
                            </td>

                        </tr>
                    ))}

                </tbody>

            </table>

        </div>
    )
}

export default ReplayTable