import { useEffect, useState } from "react"
import { motion } from "framer-motion"

import MetricCard from "../components/cards/MetricCard"
import DeliveryTrafficChart from "../components/charts/DeliveryTrafficChart"
import LiveActivityTable from "../components/tables/LiveActivityTable"

import {
    getDashboardMetrics,
    getRetryAnalytics,
} from "../services/api/dashboardApi"

const STORAGE_KEY = "replayx:delivery-chart"

const Dashboard = () => {

    const [loading, setLoading] =
        useState(true)

    const [metrics, setMetrics] =
        useState({
            totalEvents: "--",
            failed: "--",
            safety: "--",
            endpointsCount: "--",
        })

    const [
        deliveryChartData,
        setDeliveryChartData,
    ] = useState([])

    const [
        activityItems,
        setActivityItems,
    ] = useState([])

    const eventToActivity = (
        eventObj,
        index
    ) => {

        const eventType =
            eventObj?.event_type || "unknown"

        const eventId =
            eventObj?.event_id || `evt-${index}`

        const deliveryState =
            eventObj?.delivery_state || "success"

        let title =
            "Webhook Event Processed"

        let description =
            eventType

        let status =
            deliveryState

        if (
            deliveryState === "failed"
        ) {

            title =
                "Webhook Delivery Failed"

            description =
                `${eventType} - ${eventId}`

        } else if (
            deliveryState === "retry"
        ) {

            title =
                "Retry Attempt Triggered"

            description =
                `Retry initiated for ${eventType}`

        } else if (
            deliveryState === "success"
        ) {

            title =
                "Webhook Delivered Successfully"

            description =
                `${eventType} - ${eventId}`
        }

        return {
            id: eventId,
            status,
            title,
            description,
            timestamp:
                new Date().toISOString(),
        }
    }

    const readStoredChartData = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return null

            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : null
        } catch (error) {
            return null
        }
    }

    const writeStoredChartData = (list) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
        } catch (error) {
            /* ignore storage failures */
        }
    }

    useEffect(() => {

        const cachedChartData = readStoredChartData()

        if (cachedChartData && cachedChartData.length > 0) {
            setDeliveryChartData(cachedChartData)
        }

        const fetchInitialData =
            async () => {

                try {

                    setLoading(true)

                    const metricsData =
                        await getDashboardMetrics()

                    if (metricsData) {

                        setMetrics({

                            totalEvents:
                                metricsData.total_events,

                            failed:
                                metricsData.failed_deliveries,

                            safety:
                                metricsData.retry_success_rate,

                            endpointsCount:
                                metricsData.critical_endpoints,

                        })
                    }

                    const analyticsData =
                        await getRetryAnalytics()

                    if (
                        analyticsData?.timeline &&
                        Array.isArray(
                            analyticsData.timeline
                        )
                        && (!cachedChartData || cachedChartData.length === 0)
                    ) {

                        const formattedTimeline =
                            analyticsData.timeline.map(
                                (item) => ({

                                    time:
                                        item.time ||
                                        item.hour ||
                                        item.timestamp ||
                                        "00:00",

                                    success:
                                        item.success ||
                                        item.success_count ||
                                        item.delivered ||
                                        0,

                                    failed:
                                        item.failed ||
                                        item.failed_count ||
                                        item.errors ||
                                        0,

                                })
                            )

                        setDeliveryChartData(
                            formattedTimeline
                        )

                        writeStoredChartData(
                            formattedTimeline
                        )
                    }

                } catch (error) {

                    console.error(
                        "Failed to fetch dashboard data:",
                        error
                    )

                } finally {

                    setLoading(false)
                }
            }

        fetchInitialData()

    }, [])

    useEffect(() => {

        let socket = null

        let activityCounter = 0

        const wsUrl =
            import.meta.env.VITE_WS_URL ||
            "ws://127.0.0.1:8000/ws/events"

        try {

            socket =
                new WebSocket(wsUrl)

            socket.onopen = () => {

                console.log(
                    "Dashboard WebSocket Connected"
                )
            }

            socket.onmessage = (
                event
            ) => {

                try {

                    const message =
                        JSON.parse(event.data)

                    const eventObj =
                        message?.data?.event

                    if (
                        !eventObj ||
                        !eventObj.event_id
                    ) return

                    setActivityItems(
                        (prev) => {

                            const newActivity =
                                eventToActivity(
                                    eventObj,
                                    activityCounter++
                                )

                            return [
                                newActivity,
                                ...prev,
                            ].slice(0, 4)
                        }
                    )

                    setMetrics(
                        (prev) => ({

                            ...prev,

                            totalEvents:
                                (
                                    prev.totalEvents ===
                                        "--"
                                        ? 1
                                        : parseInt(
                                            prev.totalEvents
                                        ) + 1
                                ) || 1,

                        })
                    )

                    setDeliveryChartData(
                        (prev) => {

                            const currentHour =
                                new Date()
                                    .getHours()
                                    .toString()
                                    .padStart(
                                        2,
                                        "0"
                                    ) + ":00"

                            let updated =
                                [...prev]

                            const existingIndex =
                                updated.findIndex(
                                    (
                                        item
                                    ) =>
                                        item.time ===
                                        currentHour
                                )

                            if (
                                existingIndex >= 0
                            ) {

                                updated =
                                    updated.map(
                                        (
                                            item,
                                            index
                                        ) => {

                                            if (
                                                index !==
                                                existingIndex
                                            ) {
                                                return item
                                            }

                                            return {

                                                ...item,

                                                success:
                                                    eventObj.delivery_state ===
                                                        "failed"
                                                        ? item.success
                                                        : item.success + 25,

                                                failed:
                                                    eventObj.delivery_state ===
                                                        "failed"
                                                        ? item.failed + 8
                                                        : item.failed,

                                            }
                                        }
                                    )

                            } else {

                                updated.push({

                                    time:
                                        currentHour,

                                    success:
                                        eventObj.delivery_state ===
                                            "failed"
                                            ? 10
                                            : 25,

                                    failed:
                                        eventObj.delivery_state ===
                                            "failed"
                                            ? 8
                                            : 2,

                                })
                            }

                            writeStoredChartData(updated)

                            return updated
                        }
                    )

                } catch (e) {

                    console.error(
                        "Failed to parse websocket message:",
                        e
                    )
                }
            }

            socket.onerror = (
                error
            ) => {

                console.error(
                    "Dashboard WebSocket Error:",
                    error
                )
            }

            socket.onclose = () => {

                console.log(
                    "Dashboard WebSocket Disconnected"
                )
            }

        } catch (err) {

            console.error(
                "WebSocket connection failed:",
                err
            )
        }

        return () => {

            if (socket) {

                try {

                    socket.close()

                } catch (e) {

                    console.error(e)
                }
            }
        }

    }, [])

    return (
        <div className="space-y-8">

            <div className="flex flex-col gap-3">

                <h1 className="text-4xl md:text-[2.85rem] font-bold tracking-tight text-[#1F2937]">
                    Reliability Overview
                </h1>

                <p className="text-[#6B7280] max-w-3xl leading-7 text-[0.98rem] font-medium">
                    Monitor webhook delivery health,
                    retries,
                    replay safety,
                    and endpoint intelligence in realtime.
                </p>

            </div>

            <motion.div
                className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
                initial={{
                    opacity: 0,
                    y: 6,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.45,
                }}
            >

                <MetricCard
                    title="Total Events"
                    value={metrics?.totalEvents ?? "--"}
                    change="+3.2%"
                    status="positive"
                    loading={loading}
                />

                <MetricCard
                    title="Failed Deliveries"
                    value={metrics?.failed ?? "--"}
                    change="-1.4%"
                    status="negative"
                    loading={loading}
                />

                <MetricCard
                    title="Replay Safety"
                    value={`${metrics?.safety ?? "--"}%`}
                    change="0.2%"
                    status="positive"
                    loading={loading}
                />

                <MetricCard
                    title="Critical Endpoints"
                    value={metrics?.endpointsCount ?? "--"}
                    change="+2.3%"
                    status="negative"
                    loading={loading}
                />

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

                    <DeliveryTrafficChart
                        data={deliveryChartData}
                    />

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

                    <LiveActivityTable
                        activities={activityItems}
                    />

                </div>

            </div>

        </div>
    )
}

export default Dashboard