import MetricCard from "../components/cards/MetricCard"
import RetryTimelineChart from "../components/charts/RetryTimelineChart"
import RetryTable from "../components/tables/RetryTable"

const RetryAnalysis = () => {
    return (
        <div className="space-y-8">

            <div>
                <h1 className="text-4xl font-bold tracking-tight text-[#1F2937]">
                    Retry Intelligence
                </h1>

                <p className="text-[#6B7280] mt-2">
                    Analyze retry behavior, recovery patterns, and failed delivery timelines.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                    title="Total Retries"
                    value="3,421"
                    change="+14.2%"
                    status="negative"
                />

                <MetricCard
                    title="Recovery Rate"
                    value="87%"
                    change="+6.4%"
                    status="positive"
                />

                <MetricCard
                    title="Failed Retries"
                    value="142"
                    change="-2.1%"
                    status="positive"
                />

                <MetricCard
                    title="Avg Retry Delay"
                    value="11s"
                    change="+1.8%"
                    status="negative"
                />

            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-[#1F2937]">
                        Retry Timeline Analytics
                    </h2>

                    <p className="text-sm text-[#6B7280] mt-1">
                        Retry spikes, recovery trends, and delivery stability analysis
                    </p>
                </div>

                <RetryTimelineChart />

            </div>

            <div className="space-y-5">

                <div>
                    <h2 className="text-2xl font-bold text-[#1F2937]">
                        Retry Queue Activity
                    </h2>

                    <p className="text-sm text-[#6B7280] mt-1">
                        Live retry processing and recovery operations
                    </p>
                </div>

                <RetryTable />

            </div>

        </div>
    )
}

export default RetryAnalysis