import { useEffect, useState } from "react"

import MetricCard from "../components/cards/MetricCard"
import ReplayTable from "../components/tables/ReplayTable"

import {
    getReplayRecommendations,
} from "../services/api/replayApi"

const ReplayCenter = () => {

    const [replays, setReplays] =
        useState([])

    const [loading, setLoading] =
        useState(true)

    useEffect(() => {

        const fetchReplays =
            async () => {

                try {

                    const data =
                        await getReplayRecommendations()

                    const unique =
                        Array.from(
                            new Map(
                                data.map(
                                    (item) => [
                                        item.event_id,
                                        item,
                                    ]
                                )
                            ).values()
                        )

                    setReplays(unique)

                } catch (error) {

                    console.error(error)

                } finally {

                    setLoading(false)
                }
            }

        fetchReplays()

    }, [])

    const safeReplays =
        replays.filter(
            (r) =>
                r.safe_to_replay
        ).length

    const blockedReplays =
        replays.filter(
            (r) =>
                !r.safe_to_replay
        ).length

    const highRisks =
        replays.filter(
            (r) =>
                r.risk_level ===
                "high"
        ).length

    const replayConfidence =
        replays.length
            ? Math.round(
                (safeReplays /
                    replays.length) *
                100
            )
            : 0

    return (
        <div className="space-y-8">

            <div>

                <h1 className="text-4xl font-bold tracking-tight text-[#1F2937]">
                    Replay Intelligence Center
                </h1>

                <p className="text-[#6B7280] mt-2">
                    Analyze replay safety,
                    duplicate delivery risks,
                    and operational replay
                    recommendations.
                </p>

            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                    title="Safe Replays"
                    value={safeReplays}
                    change="+12.1%"
                    status="positive"
                />

                <MetricCard
                    title="Blocked Replays"
                    value={blockedReplays}
                    change="-4.8%"
                    status="positive"
                />

                <MetricCard
                    title="Duplicate Risks"
                    value={highRisks}
                    change="+2.6%"
                    status="negative"
                />

                <MetricCard
                    title="Replay Confidence"
                    value={`${replayConfidence}%`}
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

                        {replays
                            .slice(0, 3)
                            .map(
                                (
                                    replay
                                ) => (

                                    <div
                                        key={
                                            replay.event_id
                                        }
                                        className={`rounded-2xl p-5 border ${replay.safe_to_replay
                                                ? "border-green-200 bg-green-50"
                                                : "border-red-200 bg-red-50"
                                            }`}
                                    >

                                        <h3
                                            className={`text-lg font-semibold ${replay.safe_to_replay
                                                    ? "text-green-700"
                                                    : "text-red-700"
                                                }`}
                                        >

                                            {replay.safe_to_replay
                                                ? "Safe Replay Recommended"
                                                : "Replay Blocked"}

                                        </h3>

                                        <p
                                            className={`text-sm mt-2 ${replay.safe_to_replay
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                                }`}
                                        >

                                            {replay.recommended_action}

                                        </p>

                                    </div>

                                )
                            )}

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
                                High Risk Events
                            </p>

                            <h2 className="text-3xl font-bold text-[#1F2937] mt-2">
                                {highRisks}
                            </h2>

                        </div>

                        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">

                            <p className="text-sm text-[#6B7280]">
                                Replay Success Rate
                            </p>

                            <h2 className="text-3xl font-bold text-[#1F2937] mt-2">
                                {replayConfidence}%
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

                {loading ? (

                    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center text-[#6B7280] shadow-sm">
                        Loading replay recommendations...
                    </div>

                ) : (

                    <ReplayTable
                        replays={replays}
                    />

                )}

            </div>

        </div>
    )
}

export default ReplayCenter