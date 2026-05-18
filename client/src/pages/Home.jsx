import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Activity, RefreshCcw, ShieldCheck, Server, PlayCircle, BarChart3, ArrowRight } from "lucide-react"
import { subscribeToConnectionStatus } from "../services/socket"

const quickLinks = [
    { name: "Dashboard", path: "/dashboard", icon: BarChart3, desc: "Delivery metrics & charts", color: "bg-[#5B6CFF]" },
    { name: "Monitoring", path: "/monitoring", icon: Activity, desc: "Live event stream", color: "bg-[#8FAF9F]" },
    { name: "Retry Analysis", path: "/retries", icon: RefreshCcw, desc: "Retry intelligence & ML", color: "bg-[#F59E0B]" },
    { name: "Replay Center", path: "/replay", icon: ShieldCheck, desc: "Replay safety & execution", color: "bg-[#3B82F6]" },
    { name: "Endpoint Health", path: "/endpoints", icon: Server, desc: "Endpoint status & risks", color: "bg-[#EF4444]" },
    { name: "Simulator", path: "/simulator", icon: PlayCircle, desc: "Test webhook flows", color: "bg-[#8B5CF6]" },
]

const Home = () => {
    const [wsStatus, setWsStatus] = useState("connecting")

    useEffect(() => {
        const unsub = subscribeToConnectionStatus(setWsStatus)
        return () => unsub()
    }, [])

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-5xl font-bold tracking-tight text-[#1F2937]">
                        Welcome to <span className="text-[#5B6CFF]">ReplayX</span>
                    </h1>
                    <p className="text-[#6B7280] mt-3 text-lg max-w-2xl">
                        Webhook delivery reliability intelligence platform with ML-powered retry analysis, replay safety, and realtime monitoring.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F8FAFC] border border-[#E5E7EB]">
                    <div className={`w-2.5 h-2.5 rounded-full ${wsStatus === "connected" ? "bg-green-500" : wsStatus === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-red-500"}`} />
                    <span className="text-sm font-medium text-[#6B7280]">
                        {wsStatus === "connected" ? "Live" : wsStatus === "connecting" ? "Connecting..." : "Offline"}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {quickLinks.map((link) => {
                    const Icon = link.icon
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className="group bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`w-12 h-12 rounded-xl ${link.color} flex items-center justify-center`}>
                                    <Icon size={22} className="text-white" />
                                </div>
                                <ArrowRight size={18} className="text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1F2937] mt-4">{link.name}</h3>
                            <p className="text-sm text-[#6B7280] mt-1">{link.desc}</p>
                        </Link>
                    )
                })}
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#1F2937] mb-2">Getting Started</h2>
                <ol className="space-y-2 text-sm text-[#6B7280] list-decimal list-inside">
                    <li>Use the <span className="font-semibold text-[#1F2937]">Simulator</span> to generate webhook events</li>
                    <li>Watch events appear in <span className="font-semibold text-[#1F2937]">Monitoring</span> in realtime</li>
                    <li>Review <span className="font-semibold text-[#1F2937]">Retry Analysis</span> for ML-powered retry insights</li>
                    <li>Check <span className="font-semibold text-[#1F2937]">Replay Center</span> for safe replay recommendations</li>
                    <li>View overall health in the <span className="font-semibold text-[#1F2937]">Dashboard</span></li>
                </ol>
            </div>
        </div>
    )
}

export default Home
