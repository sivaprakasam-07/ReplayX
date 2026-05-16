import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

const numberFromValue = (v) => {
    if (typeof v === "number") return v
    if (typeof v === "string") {
        const parsed = parseFloat(v.toString().replace(/[^0-9.]/g, ""))
        return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
}

const MetricCard = ({ title, value, change, status, loading = false }) => {
    const [display, setDisplay] = useState(value)
    const raf = useRef(null)
    const prev = useRef(numberFromValue(value))

    useEffect(() => {
        if (loading) return

        const from = prev.current
        const to = numberFromValue(value)
        const duration = 800
        const start = performance.now()

        const step = (t) => {
            const p = Math.min(1, (t - start) / duration)
            const eased = 1 - Math.pow(1 - p, 3)
            const current = from + (to - from) * eased
            setDisplay(Number.isInteger(to) ? Math.round(current) : current.toFixed(1))
            if (p < 1) raf.current = requestAnimationFrame(step)
            else prev.current = to
        }

        raf.current = requestAnimationFrame(step)

        return () => raf.current && cancelAnimationFrame(raf.current)
    }, [value, loading])

    if (loading) {
        return (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                <div className="animate-pulse">
                    <div className="h-3 w-32 bg-[#F1F5F9] rounded mb-4"></div>
                    <div className="h-10 w-40 bg-[#F1F5F9] rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
        >

            <div className="flex items-start justify-between">

                <div>
                    <p className="text-sm text-[#6B7280] font-medium">
                        {title}
                    </p>

                    <h2 className="text-4xl font-bold text-[#1F2937] mt-4">
                        {display}
                    </h2>
                </div>

                <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${status === "positive"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                >
                    {change}
                </div>

            </div>
        </motion.div>
    )
}

export default MetricCard