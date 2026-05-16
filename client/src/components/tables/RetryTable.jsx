import StatusPill from "../common/StatusPill"

const retryEvents = [
    {
        id: "RTY-201",
        endpoint: "/payment/webhook",
        status: "retry",
        attempts: 3,
        delay: "12s",
    },
    {
        id: "RTY-202",
        endpoint: "/invoice/service",
        status: "success",
        attempts: 2,
        delay: "8s",
    },
    {
        id: "RTY-203",
        endpoint: "/subscription/event",
        status: "failed",
        attempts: 5,
        delay: "31s",
    },
]

const RetryTable = () => {
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

                    </tr>

                </thead>

                <tbody>

                    {retryEvents.map((retry) => (
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

                        </tr>
                    ))}

                </tbody>

            </table>

        </div>
    )
}

export default RetryTable