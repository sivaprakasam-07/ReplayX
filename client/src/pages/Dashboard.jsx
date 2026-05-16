import MetricCard from "../components/cards/MetricCard"
import DeliveryTrafficChart from "../components/charts/DeliveryTrafficChart"
import LiveActivityTable from "../components/tables/LiveActivityTable"

const Dashboard = () => {
    return (
        <div className="space-y-8">

            <div className="flex flex-col gap-3">
                <h1 className="text-4xl md:text-[2.85rem] font-bold tracking-tight text-[#1F2937]">
                    Reliability Overview
                </h1>

                <p className="text-[#6B7280] max-w-3xl leading-7 text-[0.98rem] font-medium">
                    Monitor webhook delivery health, retries, replay safety, and endpoint intelligence in realtime.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                    title="Total Events"
                    value="24.8K"
                    change="+12.5%"
                    status="positive"
                />

                <MetricCard
                    title="Failed Deliveries"
                    value="312"
                    change="-8.2%"
                    status="positive"
                />

                <MetricCard
                    title="Replay Safety"
                    value="94%"
                    change="+4.1%"
                    status="positive"
                />

                <MetricCard
                    title="Critical Endpoints"
                    value="7"
                    change="+2.3%"
                    status="negative"
                />

            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

                <div className="xl:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">

                    <div className="flex items-center justify-between mb-6">

                        <div>
                            <h2 className="text-xl font-bold text-[#1F2937] tracking-tight">
                                Delivery Traffic
                            </h2>

                            <p className="text-sm text-[#6B7280] mt-1">
                                Webhook delivery trends & retry analytics
                            </p>
                        </div>

                        <div className="px-3 py-1.5 rounded-full bg-[#EEF2FF] text-[#5B6CFF] text-sm font-semibold">
                            Live
                        </div>

                    </div>

                    <DeliveryTrafficChart />

                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">

                    <div className="flex items-center justify-between mb-6">

                        <div>
                            <h2 className="text-xl font-bold text-[#1F2937] tracking-tight">
                                Live Activity
                            </h2>

                            <p className="text-sm text-[#6B7280] mt-1">
                                Realtime operational events
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>

                            <span className="text-sm font-medium text-green-600">
                                Live
                            </span>
                        </div>

                    </div>

                    <LiveActivityTable />

                </div>

            </div>

        </div>
    )
}

export default Dashboard