import {
    LayoutDashboard,
    Activity,
    RefreshCcw,
    ShieldCheck,
    Server,
    PlayCircle,
} from "lucide-react"

import { NavLink } from "react-router-dom"

const navItems = [
    {
        name: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
    },
    {
        name: "Monitoring",
        path: "/monitoring",
        icon: Activity,
    },
    {
        name: "Retry Analysis",
        path: "/retries",
        icon: RefreshCcw,
    },
    {
        name: "Replay Center",
        path: "/replay",
        icon: ShieldCheck,
    },
    {
        name: "Endpoint Health",
        path: "/endpoints",
        icon: Server,
    },
    {
        name: "Simulator",
        path: "/simulator",
        icon: PlayCircle,
    },
]

const Sidebar = () => {
    return (
        <div className="w-72 min-h-screen bg-white border-r border-[#E5E7EB] flex flex-col shadow-[0_0_0_1px_rgba(255,255,255,0.6)]">

            <div className="h-20 flex items-center px-6 border-b border-[#F3F4F6]">
                <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
                    ReplayX
                </h1>
            </div>

            <div className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon

                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out ${isActive
                                    ? "bg-[#EEF2FF] text-[#5B6CFF] shadow-sm"
                                    : "text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#1F2937]"
                                }`
                            }
                        >
                            <Icon size={19} className="shrink-0" />
                            <span className="font-medium tracking-tight text-[0.96rem]">
                                {item.name}
                            </span>
                        </NavLink>
                    )
                })}
            </div>

            <div className="p-4 border-t border-[#F3F4F6]">
                <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E5E7EB] shadow-sm">
                    <p className="text-sm text-[#6B7280]">
                        System Status
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-[#8FAF9F]"></div>

                        <span className="text-sm font-medium text-[#1F2937]">
                            Operational
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Sidebar