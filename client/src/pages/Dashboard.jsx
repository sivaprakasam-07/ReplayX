import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import MetricCard from "../components/cards/MetricCard"
import DeliveryTrafficChart from "../components/charts/DeliveryTrafficChart"
import LiveActivityTable from "../components/tables/LiveActivityTable"

const Dashboard = () => {
    const [loading, setLoading] = useState(true)
    const [metrics, setMetrics] = useState({
        totalEvents: "24.8K",
        failed: 312,
        safety: 94,
        endpointsCount: 7,
    })

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 700)

        const id = setInterval(() => {
            setMetrics((m) => ({
                totalEvents: `${Math.max(0, parseInt(m.totalEvents.toString().replace(/[^0-9]/g, "")) + Math.round(Math.random() * 120 - 10))}`,
                failed: Math.max(0, m.failed + Math.round(Math.random() * 6 - 3)),
                safety: Math.max(70, Math.min(100, m.safety + Math.round(Math.random() * 3 - 1))),
                endpointsCount: Math.max(0, m.endpointsCount + Math.round(Math.random() * 1)),
            }))
        }, 4200)

        return () => {
            clearTimeout(t)
            clearInterval(id)
        }
    }, [])

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

            <motion.div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                {
                    /* Simulated metrics for demo */
                }
                <MetricCard title="Total Events" value={metrics?.totalEvents ?? "--"} change="+3.2%" status="positive" loading={loading} />

                <MetricCard title="Failed Deliveries" value={metrics?.failed ?? "--"} change="-1.4%" status={metrics?.failed > 500 ? "negative" : "positive"} loading={loading} />

                <MetricCard title="Replay Safety" value={`${metrics?.safety ?? "--"}%`} change="0.2%" status="positive" loading={loading} />

                <MetricCard title="Critical Endpoints" value={metrics?.endpointsCount ?? "--"} change="+2.3%" status="negative" loading={loading} />
            </motion.div>

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