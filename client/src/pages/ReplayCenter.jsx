import MetricCard from "../components/cards/MetricCard"
import ReplayTable from "../components/tables/ReplayTable"

const ReplayCenter = () => {
    return (
        <div className="space-y-8">

            <div>
                <h1 className="text-4xl font-bold tracking-tight text-[#1F2937]">
                    Replay Intelligence Center
                </h1>

                <p className="text-[#6B7280] mt-2">
                    Analyze replay safety, duplicate delivery risks, and operational replay recommendations.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                    title="Safe Replays"
                    value="1,284"
                    change="+12.1%"
                    status="positive"
                />

                <MetricCard
                    title="Blocked Replays"
                    value="91"
                    change="-4.8%"
                    status="positive"
                />

                <MetricCard
                    title="Duplicate Risks"
                    value="37"
                    change="+2.6%"
                    status="negative"
                />

                <MetricCard
                    title="Replay Confidence"
                    value="96%"
                    change="+3.9%"
                    status="positive"
                />

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <div className="xl:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">

                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-[#1F2937]">
                            Replay Recommendations
                        </h2>

                        <p className="text-sm text-[#6B7280] mt-1">
                            AI-assisted replay safety intelligence
                        </p>
                    </div>

                    <div className="space-y-5">

                        <div className="border border-green-200 bg-green-50 rounded-2xl p-5">
                            <h3 className="text-lg font-semibold text-green-700">
                                Safe Replay Recommended
                            </h3>

                            <p className="text-sm text-green-600 mt-2">
                                Payment webhook replay passed idempotency and duplicate checks.
                            </p>
                        </div>

                        <div className="border border-amber-200 bg-amber-50 rounded-2xl p-5">
                            <h3 className="text-lg font-semibold text-amber-700">
                                Duplicate Delivery Risk Detected
                            </h3>

                            <p className="text-sm text-amber-600 mt-2">
                                Replay may trigger duplicate invoice generation.
                            </p>
                        </div>

                        <div className="border border-red-200 bg-red-50 rounded-2xl p-5">
                            <h3 className="text-lg font-semibold text-red-700">
                                Replay Blocked
                            </h3>

                            <p className="text-sm text-red-600 mt-2">
                                Endpoint instability exceeds replay safety threshold.
                            </p>
                        </div>

                    </div>

                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">

                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-[#1F2937]">
                            Risk Summary
                        </h2>

                        <p className="text-sm text-[#6B7280] mt-1">
                            Replay safety assessment overview
                        </p>
                    </div>

                    <div className="space-y-5">

                        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                            <p className="text-sm text-[#6B7280]">
                                High Risk Endpoints
                            </p>

                            <h2 className="text-3xl font-bold text-[#1F2937] mt-2">
                                12
                            </h2>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                            <p className="text-sm text-[#6B7280]">
                                Replay Success Rate
                            </p>

                            <h2 className="text-3xl font-bold text-[#1F2937] mt-2">
                                94%
                            </h2>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                            <p className="text-sm text-[#6B7280]">
                                Duplicate Prevention
                            </p>

                            <h2 className="text-3xl font-bold text-[#1F2937] mt-2">
                                Active
                            </h2>
                        </div>

                    </div>

                </div>

            </div>

            <div className="space-y-5">

                <div>
                    <h2 className="text-2xl font-bold text-[#1F2937]">
                        Replay Activity
                    </h2>

                    <p className="text-sm text-[#6B7280] mt-1">
                        Replay operation history and recommendation tracking
                    </p>
                </div>

                <ReplayTable />

            </div>

        </div>
    )
}

export default ReplayCenter