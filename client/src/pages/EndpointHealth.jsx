import MetricCard from "../components/cards/MetricCard"
import HealthCard from "../components/cards/HealthCard"
import EndpointHealthChart from "../components/charts/EndpointHealthChart"
import StatusPill from "../components/common/StatusPill"
import { endpointData } from "../data/endpointData"

const EndpointHealth = () => {
    return (
        <div className="space-y-8">

            <div>
                <h1 className="text-4xl font-bold tracking-tight text-[#1F2937]">
                    Endpoint Health Intelligence
                </h1>

                <p className="text-[#6B7280] mt-2">
                    AI-assisted endpoint monitoring, anomaly detection, and operational reliability analytics.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                    title="Stable Endpoints"
                    value="128"
                    change="+4.2%"
                    status="positive"
                />

                <MetricCard
                    title="Critical Endpoints"
                    value="12"
                    change="+1.6%"
                    status="negative"
                />

                <MetricCard
                    title="Avg Uptime"
                    value="98.4%"
                    change="+2.1%"
                    status="positive"
                />

                <MetricCard
                    title="Risk Alerts"
                    value="18"
                    change="+3.8%"
                    status="negative"
                />

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <div className="xl:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">

                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-[#1F2937]">
                            Endpoint Health Distribution
                        </h2>

                        <p className="text-sm text-[#6B7280] mt-1">
                            Stability analysis across webhook endpoints
                        </p>
                    </div>

                    <EndpointHealthChart />

                </div>

                <div className="space-y-5">

                    <HealthCard
                        title="AI Risk Engine"
                        value="Active"
                        description="Realtime anomaly detection enabled"
                    />

                    <HealthCard
                        title="Prediction Confidence"
                        value="94%"
                        description="ML-assisted reliability scoring"
                    />

                    <HealthCard
                        title="Recovery Forecast"
                        value="Stable"
                        description="Endpoint recovery trend analysis"
                    />

                </div>

            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">

                <div className="p-6 border-b border-[#E5E7EB]">

                    <h2 className="text-2xl font-bold text-[#1F2937]">
                        Endpoint Monitoring
                    </h2>

                    <p className="text-sm text-[#6B7280] mt-1">
                        Live endpoint reliability assessment
                    </p>

                </div>

                <table className="w-full">

                    <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">

                        <tr>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Endpoint ID
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Endpoint
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Health
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Uptime
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Risk
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {endpointData.map((endpoint) => (
                            <tr
                                key={endpoint.id}
                                className="border-b border-[#F1F5F9] hover:bg-[#FAFBFC]"
                            >

                                <td className="px-6 py-4 text-sm font-semibold text-[#1F2937]">
                                    {endpoint.id}
                                </td>

                                <td className="px-6 py-4 text-sm text-[#6B7280]">
                                    {endpoint.endpoint}
                                </td>

                                <td className="px-6 py-4">
                                    <StatusPill status={endpoint.health} />
                                </td>

                                <td className="px-6 py-4 text-sm text-[#1F2937]">
                                    {endpoint.uptime}
                                </td>

                                <td className="px-6 py-4 text-sm font-medium text-[#1F2937]">
                                    {endpoint.risk}
                                </td>

                            </tr>
                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    )
}

export default EndpointHealth