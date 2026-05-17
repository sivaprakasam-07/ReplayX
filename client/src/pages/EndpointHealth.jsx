import {
    useEffect,
    useState,
} from "react"

import MetricCard from "../components/cards/MetricCard"
import HealthCard from "../components/cards/HealthCard"
import EndpointHealthChart from "../components/charts/EndpointHealthChart"
import StatusPill from "../components/common/StatusPill"

import {
    getEndpointsHealth,
} from "../services/api/endpointApi"

const EndpointHealth = () => {

    const [endpoints, setEndpoints] =
        useState([])

    const [loading, setLoading] =
        useState(true)

    useEffect(() => {

        const fetchEndpoints =
            async () => {

                try {

                    const data =
                        await getEndpointsHealth()

                    setEndpoints(data)

                } catch (error) {

                    console.error(error)

                } finally {

                    setLoading(false)
                }
            }

        fetchEndpoints()

    }, [])

    const healthyEndpoints =
        endpoints.filter(
            (e) =>
                e.health ===
                "healthy"
        ).length

    const warningEndpoints =
        endpoints.filter(
            (e) =>
                e.health ===
                "warning"
        ).length

    const criticalEndpoints =
        endpoints.filter(
            (e) =>
                e.health ===
                "critical"
        ).length

    const avgUptime =
        endpoints.length
            ? (
                endpoints.reduce(
                    (
                        acc,
                        curr
                    ) =>
                        acc +
                        curr.uptime,
                    0
                ) /
                endpoints.length
            ).toFixed(1)
            : 0

    const avgRisk =
        endpoints.length
            ? (
                endpoints.reduce(
                    (
                        acc,
                        curr
                    ) =>
                        acc +
                        curr.risk_score,
                    0
                ) /
                endpoints.length
            ).toFixed(2)
            : 0

    const chartData = [
        ...(healthyEndpoints > 0
            ? [
                {
                    name: "Healthy",
                    value: healthyEndpoints,
                },
            ]
            : []),

        ...(warningEndpoints > 0
            ? [
                {
                    name: "Warning",
                    value: warningEndpoints,
                },
            ]
            : []),

        ...(criticalEndpoints > 0
            ? [
                {
                    name: "Critical",
                    value: criticalEndpoints,
                },
            ]
            : []),
    ]

    return (
        <div className="space-y-8">

            <div>

                <h1 className="text-4xl font-bold tracking-tight text-[#1F2937]">
                    Endpoint Health Intelligence
                </h1>

                <p className="text-[#6B7280] mt-2">
                    AI-assisted endpoint monitoring,
                    anomaly detection,
                    and operational reliability analytics.
                </p>

            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">

                <MetricCard
                    title="Stable Endpoints"
                    value={healthyEndpoints}
                    change="+4.2%"
                    status="positive"
                />

                <MetricCard
                    title="Warning Endpoints"
                    value={warningEndpoints}
                    change="+0.8%"
                    status="neutral"
                />

                <MetricCard
                    title="Critical Endpoints"
                    value={criticalEndpoints}
                    change="+1.6%"
                    status="negative"
                />

                <MetricCard
                    title="Avg Uptime"
                    value={`${avgUptime}%`}
                    change="+2.1%"
                    status="positive"
                />

                <MetricCard
                    title="Risk Alerts"
                    value={avgRisk}
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

                    <EndpointHealthChart
                        chartData={chartData}
                    />

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

                {loading ? (

                    <div className="p-10 text-center text-[#6B7280]">
                        Loading endpoint health...
                    </div>

                ) : (

                    <table className="w-full">

                        <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">

                            <tr>

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
                                    Risk Score
                                </th>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                    Avg Latency
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {endpoints.map(
                                (
                                    endpoint,
                                    index
                                ) => (

                                    <tr
                                        key={`${endpoint.endpoint}-${index}`}
                                        className="border-b border-[#F1F5F9] hover:bg-[#FAFBFC]"
                                    >

                                        <td className="px-6 py-4 text-sm font-semibold text-[#1F2937]">
                                            {endpoint.endpoint}
                                        </td>

                                        <td className="px-6 py-4">

                                            <StatusPill
                                                status={
                                                    endpoint.health
                                                }
                                            />

                                        </td>

                                        <td className="px-6 py-4 text-sm text-[#1F2937]">
                                            {Number(endpoint.uptime).toFixed(1)}%
                                        </td>

                                        <td className="px-6 py-4 text-sm font-medium text-[#1F2937]">
                                            {endpoint.risk_score}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-[#1F2937]">
                                            {
                                                endpoint.avg_latency
                                            }
                                            ms
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                )}

            </div>

        </div>
    )
}

export default EndpointHealth