import { useEffect, useState } from "react"

import MetricCard from "../components/cards/MetricCard"
import ReplayTable from "../components/tables/ReplayTable"

import {
    getReplayRecommendations,
    executeReplay,
} from "../services/api/replayApi"

const ReplayCenter = () => {

    const [replays, setReplays] = useState([])
    const [loading, setLoading] = useState(true)
    const [execMsg, setExecMsg] = useState(null)
    const [execLoading, setExecLoading] = useState(false)

    const fetchReplays = async () => {
        setLoading(true)
        try {
            const data = await getReplayRecommendations()
            const unique = Array.from(
                new Map(data.map((item) => [item.event_id, item])).values()
            )
            setReplays(unique)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReplays()
    }, [])

    const handleExecuteReplay = async (eventId) => {
        setExecLoading(true)
        setExecMsg(null)
        try {
            const result = await executeReplay(eventId)
            setExecMsg({ type: "success", text: `Replay ${result.status}! Op: ${result.operation_id}` })
            fetchReplays()
        } catch (e) {
            const detail = e.response?.data?.detail || e.message
            setExecMsg({ type: "error", text: `Blocked: ${detail}` })
        } finally {
            setExecLoading(false)
        }
    }

    const safeReplays = replays.filter((r) => r.safe_to_replay).length
    const blockedReplays = replays.filter((r) => !r.safe_to_replay).length
    const highRisks = replays.filter((r) => r.risk_level === "high").length
    const replayConfidence = replays.length
        ? Math.round((safeReplays / replays.length) * 100)
        : 0

    const avgMlConfidence = replays.length
        ? Math.round(
            replays.filter(r => r.ml_confidence != null).reduce((a, r) => a + r.ml_confidence, 0) /
            Math.max(replays.filter(r => r.ml_confidence != null).length, 1)
        )
        : 0

    const patternCounts = {}
    replays.forEach(r => {
        const patterns = r.failure_patterns || []
        patterns.forEach(p => {
            const key = typeof p === "string" ? p : p.pattern
            patternCounts[key] = (patternCounts[key] || 0) + 1
        })
    })
    const topPatterns = Object.entries(patternCounts).sort((a, b) => b[1] - a[1]).slice(0, 4)

    return (
        <div className="space-y-8">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-[#1F2937]">
                        Replay Intelligence Center
                    </h1>
                    <p className="text-[#6B7280] mt-2">
                        Analyze replay safety, duplicate delivery risks, and operational replay recommendations.
                    </p>
                </div>
            </div>

            {execMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                    execMsg.type === "success" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#DC2626]"
                }`}>
                    {execMsg.text}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard title="Safe Replays" value={safeReplays} change="+12.1%" status="positive" />
                <MetricCard title="Blocked Replays" value={blockedReplays} change="-4.8%" status="positive" />
                <MetricCard title="High Risk" value={highRisks} change="+2.6%" status="negative" />
                <MetricCard title="Replay Confidence" value={`${replayConfidence}%`} change="+3.9%" status="positive" />
                <MetricCard title="Avg ML Confidence" value={`${avgMlConfidence}%`} change={avgMlConfidence > 70 ? "+4.2%" : "-1.1%"} status={avgMlConfidence > 70 ? "positive" : "negative"} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <div className="xl:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-[#1F2937]">Replay Recommendations</h2>
                        <p className="text-sm text-[#6B7280] mt-1">AI-assisted replay safety intelligence</p>
                    </div>

                    <div className="space-y-5">
                        {replays.slice(0, 5).map((replay) => (
                            <div key={replay.event_id} className={`rounded-2xl p-5 border ${replay.safe_to_replay ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className={`text-lg font-semibold ${replay.safe_to_replay ? "text-green-700" : "text-red-700"}`}>
                                                {replay.safe_to_replay ? "Safe Replay Recommended" : "Replay Blocked"}
                                            </h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                replay.risk_level === "high" ? "bg-red-200 text-red-800" :
                                                replay.risk_level === "medium" ? "bg-yellow-200 text-yellow-800" :
                                                "bg-green-200 text-green-800"
                                            }`}>{replay.risk_level}</span>
                                        </div>
                                        <p className={`text-sm ${replay.safe_to_replay ? "text-green-600" : "text-red-600"}`}>
                                            {replay.recommended_action}
                                        </p>
                                        <p className="text-xs text-[#6B7280] mt-1">Reason: {replay.reason}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 ml-4">
                                        {(replay.ml_confidence != null && replay.ml_confidence > 0) && (
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                replay.ml_confidence > 80 ? "bg-green-200 text-green-800" :
                                                replay.ml_confidence > 60 ? "bg-yellow-200 text-yellow-800" :
                                                "bg-red-200 text-red-800"
                                            }`}>
                                                ML {replay.ml_confidence}%
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleExecuteReplay(replay.event_id)}
                                            disabled={execLoading || !replay.safe_to_replay}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                                                replay.safe_to_replay
                                                    ? "bg-[#1F2937] text-white hover:bg-[#374151]"
                                                    : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
                                            } disabled:opacity-50`}
                                        >
                                            {execLoading ? "..." : replay.safe_to_replay ? "Execute Replay" : "Blocked"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {replays.length === 0 && !loading && (
                            <p className="text-center text-[#6B7280] py-8">No replay recommendations available.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-[#1F2937]">ML Risk & Patterns</h2>
                        <p className="text-sm text-[#6B7280] mt-1">Replay safety assessment & failure pattern breakdown</p>
                    </div>

                    <div className="space-y-5">
                        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                            <p className="text-sm text-[#6B7280]">High Risk Events</p>
                            <h2 className="text-3xl font-bold text-[#1F2937] mt-2">{highRisks}</h2>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                            <p className="text-sm text-[#6B7280]">ML Replay Success Rate</p>
                            <h2 className="text-3xl font-bold text-[#1F2937] mt-2">{replayConfidence}%</h2>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                            <p className="text-sm text-[#6B7280]">Avg ML Confidence</p>
                            <h2 className="text-3xl font-bold text-[#1F2937] mt-2">{avgMlConfidence}%</h2>
                        </div>

                        {topPatterns.length > 0 && (
                            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                                <p className="text-sm text-[#6B7280] mb-3">Top Failure Patterns</p>
                                <div className="space-y-2">
                                    {topPatterns.map(([pattern, count]) => (
                                        <div key={pattern} className="flex items-center justify-between">
                                            <span className="text-sm text-[#1F2937]">{pattern}</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                                count > 2 ? "bg-[#FEE2E2] text-[#DC2626]" :
                                                count > 1 ? "bg-[#FEF3C7] text-[#D97706]" :
                                                "bg-[#DCFCE7] text-[#15803D]"
                                            }`}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <div className="space-y-5">
                <div>
                    <h2 className="text-2xl font-bold text-[#1F2937]">Replay Activity</h2>
                    <p className="text-sm text-[#6B7280] mt-1">Replay operation history and recommendation tracking</p>
                </div>

                {loading ? (
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center text-[#6B7280] shadow-sm">
                        Loading replay recommendations...
                    </div>
                ) : (
                    <ReplayTable replays={replays} />
                )}
            </div>

        </div>
    )
}

export default ReplayCenter