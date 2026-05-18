import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import MetricCard from "../components/cards/MetricCard"
import EventTable from "../components/tables/EventTable"
import EventModal from "../components/common/EventModal"
import StatusPill from "../components/common/StatusPill"
import EventToast from "../components/common/EventToast"

import {
    getEvents,
    getEventById,
    getEventIntelligence,
} from "../services/api/monitoringApi"
import api from "../services/api/axios"
import { subscribeToRealtimeEvents, isRetryLifecycleMessage } from "../services/socket"

const Monitoring = () => {
    // fallback dedupe set when toast.isActive isn't available
    const activeToastIds = new Set()

    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedEvent, setSelectedEvent] = useState(null)
    const [analysis, setAnalysis] = useState(null)
    const [eventLoading, setEventLoading] = useState(false)

    const [modalOpen, setModalOpen] = useState(false)
    const [metrics, setMetrics] = useState(null)
    const [page, setPage] = useState(0)
    const [totalEvents, setTotalEvents] = useState(0)
    const PAGE_SIZE = 25

    const fetchMetrics = async () => {
        try {
            const response = await api.get("/dashboard/metrics")
            setMetrics(response.data)
        } catch (error) {
            console.error("Failed to fetch metrics", error)
        }
    }

    const fetchEvents = async ({ silent = false, pageOverride } = {}) => {
        try {
            if (!silent) {
                setLoading(true)
            }
            const currentPage = pageOverride != null ? pageOverride : page
            const skip = currentPage * PAGE_SIZE
            const data = await getEvents(PAGE_SIZE, skip)
            const fetched = data?.events || data || []
            const list = Array.isArray(fetched) ? fetched : []
            const total = data?.total ?? list.length

            if (list.length > 0 || currentPage === 0) {
                setEvents(list)
                setTotalEvents(total)
                setError(null)
                try {
                    localStorage.setItem("replayx:monitoring:events", JSON.stringify(list))
                } catch (error) {
                    console.error(error)
                }
            }

            return list
        } catch (err) {
            console.error(err)
            setError("Failed to fetch monitoring events")
            return []
        } finally {
            if (!silent) {
                setLoading(false)
            }
        }
    }

    useEffect(() => {

        const STORAGE_KEY = "replayx:monitoring:events"
        let active = true

        const readStored = () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY)
                if (!raw) return []
                const parsed = JSON.parse(raw)
                return Array.isArray(parsed) ? parsed : []
            } catch (e) {
                return []
            }
        }

        const setup = async () => {

            if (!active) {
                return null
            }

            // Hydrate from localStorage first for instant UX
            const cached = readStored()
            if (cached.length > 0) setEvents(cached)

            const [list] = await Promise.all([
                fetchEvents(),
                fetchMetrics(),
            ])
            if (list.length === 0 && cached.length > 0) {
                setEvents(cached)
            }

            const unsubscribe = subscribeToRealtimeEvents(async (message) => {
                if (isRetryLifecycleMessage(message)) {
                    const idParts = [message.type, message.operation_id || message.event_id || message.id || "unknown"].filter(Boolean)
                    const toastId = idParts.join("-")

                    const hasIsActive = typeof toast.isActive === "function"
                    const already = hasIsActive ? toast.isActive(toastId) : activeToastIds.has(toastId)

                    if (!already) {
                        if (!hasIsActive) {
                            activeToastIds.add(toastId)
                            setTimeout(() => activeToastIds.delete(toastId), 3500)
                        }

                        toast.custom(() => (
                            <EventToast
                                type={message.status === "success" ? "success" : "error"}
                                message={message.message || (message.status === "success" ? "Retry completed successfully" : "Retry failed")}
                            />
                        ), { id: toastId, duration: 3000 })
                    }
                }

                if (message.event_id || message.type === "NEW_SIMULATION" || isRetryLifecycleMessage(message)) {
                    await Promise.all([
                        fetchEvents({ silent: true }),
                        fetchMetrics(),
                    ])
                }
            })

            return unsubscribe
        }

        let unsubscribe = null
        setup().then((cleanup) => {
            if (!active) {
                if (cleanup) {
                    cleanup()
                }
                return
            }
            unsubscribe = cleanup
        })

        return () => {
            active = false
            if (unsubscribe) {
                unsubscribe()
            }
        }

    }, [])

    const handleSelectEvent = async (
        eventId
    ) => {

        console.log("Selected Event:", eventId)
        setModalOpen(true)
        setEventLoading(true)
        setSelectedEvent(null)
        setAnalysis(null)

        try {

            const eventDetails =
                await getEventById(eventId)

            console.log("Event Details:", eventDetails)

            const intelligence =
                await getEventIntelligence(
                    eventId
                )

            console.log("Intelligence:", intelligence)

            setSelectedEvent(
                eventDetails
            )

            setAnalysis(
                intelligence
            )

        } catch (err) {

            console.error(
                "Failed to fetch event intelligence",
                err
            )
        } finally {
            setEventLoading(false)
        }
    }

    return (
        <div className="space-y-8">

            <div>
                <h1 className="text-4xl font-bold tracking-tight text-[#1F2937]">
                    Realtime Monitoring
                </h1>

                <p className="text-[#6B7280] mt-2">
                    Monitor live webhook events,
                    delivery states, retries,
                    and endpoint performance.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                    title="Safe Replays"
                    value={metrics?.safe_replays ?? "--"}
                    change="+8.2%"
                    status="positive"
                />

                <MetricCard
                    title="Failed Requests"
                    value={metrics?.failed_deliveries ?? "--"}
                    change="-4.1%"
                    status="positive"
                />

                <MetricCard
                    title="Avg Latency"
                    value={metrics?.avg_latency_ms ? `${metrics.avg_latency_ms}ms` : "--"}
                    change="-1.8%"
                    status="positive"
                />

                <MetricCard
                    title="Total Events"
                    value={metrics?.total_events ?? "--"}
                    change="+2.4%"
                    status="negative"
                />

            </div>

            <div className="space-y-5">

                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-2xl font-bold text-[#1F2937]">
                                Live Event Stream
                            </h2>

                            <p className="text-sm text-[#6B7280] mt-1">
                                Realtime webhook delivery monitoring
                            </p>
                        </div>

                        <div className="flex items-center gap-4">

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const prev = Math.max(0, page - 1)
                                        setPage(prev)
                                        fetchEvents({ silent: true, pageOverride: prev })
                                    }}
                                    disabled={page === 0}
                                    className="px-3 py-1 text-sm rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8FAFC] disabled:opacity-30"
                                >
                                    Prev
                                </button>
                                <span className="text-sm text-[#6B7280]">
                                    {totalEvents > 0
                                        ? `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalEvents)} of ${totalEvents}`
                                        : "0 events"}
                                </span>
                                <button
                                    onClick={() => {
                                        const next = page + 1
                                        setPage(next)
                                        fetchEvents({ silent: true, pageOverride: next })
                                    }}
                                    disabled={(page + 1) * PAGE_SIZE >= totalEvents}
                                    className="px-3 py-1 text-sm rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8FAFC] disabled:opacity-30"
                                >
                                    Next
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-sm font-semibold text-green-600">Live</span>
                            </div>

                        </div>

                    </div>

                {loading ? (

                    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center text-[#6B7280] shadow-sm">
                        Loading monitoring events...
                    </div>

                ) : error ? (

                    <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center text-red-600 shadow-sm">
                        {error}
                    </div>

                ) : (

                    <EventTable
                        events={events}
                        onSelectEvent={
                            handleSelectEvent
                        }
                    />

                )}

            </div>

            <EventModal
                isOpen={modalOpen}
                onClose={() =>
                    setModalOpen(false)
                }
                eventDetails={selectedEvent}
                analysis={analysis}
                loading={eventLoading}
            />

        </div>
    )
}

export default Monitoring