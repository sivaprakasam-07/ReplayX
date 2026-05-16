import { monitoringData } from "../../data/monitoringData"
import StatusPill from "../common/StatusPill"

const EventTable = () => {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">

            <div className="overflow-x-auto">

                <table className="w-full">

                    <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">

                        <tr>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Event ID
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Endpoint
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Status
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Latency
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Retries
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {monitoringData.map((event) => (
                            <tr
                                key={event.id}
                                className="border-b border-[#F1F5F9] hover:bg-[#FAFBFC] transition-colors"
                            >

                                <td className="px-6 py-4 text-sm font-semibold text-[#1F2937]">
                                    {event.id}
                                </td>

                                <td className="px-6 py-4 text-sm text-[#6B7280]">
                                    {event.endpoint}
                                </td>

                                <td className="px-6 py-4">
                                    <StatusPill status={event.status} />
                                </td>

                                <td className="px-6 py-4 text-sm text-[#1F2937]">
                                    {event.latency}
                                </td>

                                <td className="px-6 py-4 text-sm text-[#1F2937]">
                                    {event.retries}
                                </td>

                            </tr>
                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    )
}

export default EventTable