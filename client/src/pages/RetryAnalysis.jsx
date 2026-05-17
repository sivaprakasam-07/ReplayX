import { useEffect, useState } from "react"
import MetricCard from "../components/cards/MetricCard"
import RetryTimelineChart from "../components/charts/RetryTimelineChart"
import RetryTable from "../components/tables/RetryTable"
import StatusPill from "../components/common/StatusPill"
import { getRetryAnalytics, triggerRetry, getOperationsQueue, processPendingOperations } from "../services/api/retryApi"

const RetryAnalysis = () => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [queue, setQueue] = useState([])
    const [triggerMsg, setTriggerMsg] = useState(null)
    const [triggerLoading, setTriggerLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const result = await getRetryAnalytics()
            setData(result)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchQueue = async () => {
        try {
            const q = await getOperationsQueue("all")
            setQueue(q)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchData()
        fetchQueue()
        const interval = setInterval(fetchQueue, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleTriggerRetry = async () => {
        setTriggerLoading(true)
        setTriggerMsg(null)
        const eventId = prompt("Enter Event ID to trigger retry:")
        if (!eventId) { setTriggerLoading(false); return }
        try {
            const result = await triggerRetry(eventId)
            setTriggerMsg({ type: "success", text: `Retry scheduled! Op: ${result.operation_id}` })
            fetchQueue()
        } catch (e) {
            setTriggerMsg({ type: "error", text: `Failed: ${e.message}` })
        } finally {
            setTriggerLoading(false)
        }
    }

    const handleProcessPending = async () => {
        setTriggerLoading(true)
        try {
            const result = await processPendingOperations()
            setTriggerMsg({ type: "success", text: `Processed ${result.processed} operations` })
            fetchQueue()
            fetchData()
        } catch (e) {
            setTriggerMsg({ type: "error", text: `Failed: ${e.message}` })
        } finally {
            setTriggerLoading(false)
        }
    }

    const summary = data?.summary || {}
    const ml = data?.ml_predictions || {}
    const patterns = data?.failure_patterns || []
    const timeline = data?.timeline || null
    const retryEvents = data?.retry_events || null

    const pendingOps = queue.filter(o => o.status === "pending").length
    const inProgressOps = queue.filter(o => o.status === "in_progress").length
    const completedOps = queue.filter(o => o.status === "completed").length

    return (
        <div className="space-y-8">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-[#1F2937]">
                        Retry Intelligence
                    </h1>
                    <p className="text-[#6B7280] mt-2">
                        Analyze retry behavior, recovery patterns, and failed delivery timelines.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleTriggerRetry}
                        disabled={triggerLoading}
                        className="px-4 py-2 bg-[#1F2937] text-white rounded-xl text-sm font-semibold hover:bg-[#374151] disabled:opacity-50"
                    >
                        {triggerLoading ? "Processing..." : "+ Trigger Retry"}
                    </button>
                    <button
                        onClick={handleProcessPending}
                        disabled={triggerLoading}
                        className="px-4 py-2 border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#6B7280] hover:bg-[#F8FAFC] disabled:opacity-50"
                    >
                        Process Pending
                    </button>
                </div>
            </div>

            {triggerMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                    triggerMsg.type === "success" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#DC2626]"
                }`}>
                    {triggerMsg.text}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard title="Total Retries" value={summary.total_retries != null ? summary.total_retries.toLocaleString() : "--"} change="+14.2%" status="negative" />
                <MetricCard title="Recovery Rate" value={summary.recovery_rate != null ? `${summary.recovery_rate}%` : "--"} change="+6.4%" status="positive" />
                <MetricCard title="Failed Retries" value={summary.failed_retries != null ? summary.failed_retries.toLocaleString() : "--"} change="-2.1%" status="positive" />
                <MetricCard title={`ML: ${ml.forecast || "N/A"}`} value={ml.risk_level ? <StatusPill status={ml.risk_level} /> : "--"} change={ml.predicted_spike_time ? `Spike ~${ml.predicted_spike_time}` : ""} status={ml.risk_level === "high" ? "negative" : ml.risk_level === "medium" ? "warning" : "positive"} />
                <MetricCard title="Queue" value={
                    <div className="flex gap-2 items-center">
                        <span className="text-yellow-600">{pendingOps} pending</span>
                        <span className="text-blue-600">{inProgressOps} active</span>
                        <span className="text-green-600">{completedOps} done</span>
                    </div>
                } change="" status="neutral" />
            </div>

            {patterns.length > 0 && (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-[#1F2937] mb-4">ML Detected Failure Patterns</h3>
                    <div className="flex flex-wrap gap-3">
                        {patterns.map((p, i) => (
                            <div key={i} className={`rounded-xl px-4 py-3 border ${
                                p.severity === "high" ? "bg-[#FEE2E2] border-red-200" :
                                p.severity === "medium" ? "bg-[#FEF3C7] border-yellow-200" :
                                "bg-[#DCFCE7] border-green-200"
                            }`}>
                                <p className="text-sm font-semibold">{p.pattern}</p>
                                <p className="text-xs mt-1 opacity-75">Severity: {p.severity}{p.count != null ? ` (${p.count})` : ""}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-[#1F2937]">Retry Timeline Analytics</h2>
                    <p className="text-sm text-[#6B7280] mt-1">Retry spikes, recovery trends, and ML-predicted outcomes (dashed lines)</p>
                </div>
                {loading ? (
                    <div className="h-[340px] flex items-center justify-center text-[#6B7280]">Loading...</div>
                ) : (
                    <RetryTimelineChart data={timeline} />
                )}
            </div>

            {queue.filter(o => o.status !== "completed").length > 0 && (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-[#1F2937] mb-4">Active Operations Queue</h3>
                    <div className="space-y-3">
                        {queue.filter(o => o.status !== "completed").map(op => (
                            <div key={op.operation_id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                                <div>
                                    <p className="text-sm font-semibold">{op.operation_id}</p>
                                    <p className="text-xs text-[#6B7280]">Event: {op.event_id} | Type: {op.operation_type} | Attempt: {op.attempt_number}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusPill status={op.status} />
                                    <span className="text-xs text-[#6B7280]">{new Date(op.scheduled_at).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-5">
                <div>
                    <h2 className="text-2xl font-bold text-[#1F2937]">Retry Queue Activity</h2>
                    <p className="text-sm text-[#6B7280] mt-1">Live retry processing and recovery operations</p>
                </div>
                <RetryTable events={retryEvents} />
            </div>

        </div>
    )
}

export default RetryAnalysis