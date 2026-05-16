import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const Simulator = () => {

    const [logs, setLogs] = useState([
        {
            id: Date.now(),
            type: "success",
            message: "Webhook delivery initialized",
            ts: Date.now(),
        },
    ])

    const containerRef = useRef(null)

    const addLog = (type, message) => {
        const newLog = {
            id: Date.now() + Math.random(),
            type,
            message,
            ts: Date.now(),
        }

        setLogs((prev) => [newLog, ...prev].slice(0, 200))
    }

    // auto-generate demo events every few seconds
    useEffect(() => {
        const actions = [
            () => addLog("success", "Webhook delivered successfully to payment endpoint."),
            () => addLog("failed", "Webhook delivery failed due to timeout."),
            () => addLog("retry", "Retry workflow initiated for failed delivery."),
            () => addLog("replay", "Replay recommendation approved by intelligence engine."),
        ]

        const id = setInterval(() => {
            const fn = actions[Math.floor(Math.random() * actions.length)]
            fn()
        }, 4500)

        return () => clearInterval(id)
    }, [])

    // auto-scroll to top on new log (latest-first)
    useEffect(() => {
        if (!containerRef.current) return
        containerRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }, [logs])

    return (
        <div className="space-y-8">

            <div>
                <h1 className="text-4xl font-bold tracking-tight text-[#1F2937]">
                    Live Webhook Simulator
                </h1>

                <p className="text-[#6B7280] mt-2">
                    Simulate webhook events, retries, replay operations, and endpoint failures in realtime.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                <button
                    onClick={() =>
                        addLog(
                            "success",
                            "Webhook delivered successfully to payment endpoint."
                        )
                    }
                    className="bg-[#5B6CFF] text-white rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all"
                >

                    <h2 className="text-xl font-bold">
                        Trigger Success
                    </h2>

                    <p className="text-sm text-indigo-100 mt-2">
                        Simulate successful webhook delivery
                    </p>

                </button>

                <button
                    onClick={() =>
                        addLog(
                            "failed",
                            "Webhook delivery failed due to timeout."
                        )
                    }
                    className="bg-[#EF4444] text-white rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all"
                >

                    <h2 className="text-xl font-bold">
                        Trigger Failure
                    </h2>

                    <p className="text-sm text-red-100 mt-2">
                        Simulate failed delivery event
                    </p>

                </button>

                <button
                    onClick={() =>
                        addLog(
                            "retry",
                            "Retry workflow initiated for failed delivery."
                        )
                    }
                    className="bg-[#F59E0B] text-white rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all"
                >

                    <h2 className="text-xl font-bold">
                        Trigger Retry
                    </h2>

                    <p className="text-sm text-amber-100 mt-2">
                        Simulate retry intelligence flow
                    </p>

                </button>

                <button
                    onClick={() =>
                        addLog(
                            "replay",
                            "Replay recommendation approved by intelligence engine."
                        )
                    }
                    className="bg-[#8FAF9F] text-white rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all"
                >

                    <h2 className="text-xl font-bold">
                        Trigger Replay
                    </h2>

                    <p className="text-sm text-green-100 mt-2">
                        Simulate replay recommendation
                    </p>

                </button>

            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">

                <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">

                    <div>
                        <h2 className="text-2xl font-bold text-[#1F2937]">
                            Live Event Console
                        </h2>

                        <p className="text-sm text-[#6B7280] mt-1">
                            Realtime operational simulation logs
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>

                        <span className="text-sm font-semibold text-green-600">
                            Live
                        </span>
                    </div>

                </div>

                <div ref={containerRef} className="max-h-[500px] overflow-y-auto">
                    <AnimatePresence initial={false}>
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.28 }}
                                layout
                                className="px-6 py-5 border-b border-[#F1F5F9] hover:bg-[#FAFBFC] transition-colors"
                            >

                                <div className="flex items-start gap-4">

                                    <div
                                        className={`w-3 h-3 rounded-full mt-1.5 ${log.type === "success"
                                            ? "bg-[#8FAF9F]"
                                            : log.type === "failed"
                                                ? "bg-red-500"
                                                : log.type === "retry"
                                                    ? "bg-amber-500"
                                                    : "bg-[#5B6CFF]"
                                            }`}
                                    ></div>

                                    <div>

                                        <p className="font-semibold text-[#1F2937]">
                                            {log.message}
                                        </p>

                                        <p className="text-sm text-[#6B7280] mt-1">
                                            {new Date(log.ts).toLocaleTimeString()}
                                        </p>

                                    </div>

                                </div>

                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

            </div>

        </div>
    )
}

export default Simulator