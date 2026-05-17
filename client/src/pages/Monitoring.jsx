import { useEffect, useState } from "react"

import MetricCard from "../components/cards/MetricCard"
import EventTable from "../components/tables/EventTable"
import EventModal from "../components/common/EventModal"
import StatusPill from "../components/common/StatusPill"

import {
    getEvents,
    getEventById,
    getEventIntelligence,
} from "../services/api/monitoringApi"
import api from "../services/api/axios"

const Monitoring = () => {

    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedEvent, setSelectedEvent] = useState(null)
    const [analysis, setAnalysis] = useState(null)
    const [eventLoading, setEventLoading] = useState(false)

    const [modalOpen, setModalOpen] = useState(false)
    const [metrics, setMetrics] = useState(null)

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await api.get('/dashboard/metrics');
                setMetrics(response.data);
            } catch (error) {
                console.error("Failed to fetch metrics", error);
            }
        };
        fetchMetrics();
    }, []);

    useEffect(() => {

        let socket = null

        const STORAGE_KEY = "replayx:monitoring:events"

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

        const writeStored = (list) => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
            } catch (e) {
                /* ignore */
            }
        }

        const setup = async () => {

            // Hydrate from localStorage first for instant UX
            const cached = readStored()
            if (cached.length > 0) setEvents(cached)

            try {
                setLoading(true)

                const data = await getEvents()
                console.log("Events Data:", data)

                // Normalize paginated response or direct array
                const fetched = data?.events || data || []
                const list = Array.isArray(fetched) ? fetched : []

                // If backend returned items, prefer them and persist
                if (list.length > 0) {
                    setEvents(list)
                    writeStored(list)
                } else if (cached.length > 0) {
                    // backend empty but we have cached data — keep cache
                    setEvents(cached)
                }

            } catch (err) {
                console.error(err)
                setError("Failed to fetch monitoring events")
            } finally {
                setLoading(false)
            }

            // Connect websocket after initial fetch/hydration
            const wsUrl = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000/ws/events"

            try {
                socket = new WebSocket(wsUrl)

                socket.onopen = () => {
                    console.log("WebSocket Connected")
                }

                socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data)
                        console.log("Realtime Event:", message)

                        // Extract event object from message shape
                        const incoming = message.data?.event || message
                        const eventObj = incoming?.event || incoming

                        if (!eventObj || !eventObj.event_id) return

                        setEvents((prev) => {
                            // Prevent duplicates
                            const exists = prev.some((e) => e.event_id === eventObj.event_id)
                            if (exists) return prev

                            const updated = [eventObj, ...prev]
                            writeStored(updated)
                            return updated
                        })

                    } catch (e) {
                        console.error("Failed to parse websocket message:", e)
                    }
                }

                socket.onerror = (error) => {
                    console.error("WebSocket Error:", error)
                }

                socket.onclose = () => {
                    console.log("WebSocket Disconnected")
                }

            } catch (err) {
                console.error("WebSocket connection failed:", err)
            }
        }

        setup()

        return () => {
            if (socket) {
                try {
                    socket.close()
                } catch (e) {
                    /* ignore */
                }
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

                    <div className="flex items-center gap-2">

                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>

                        <span className="text-sm font-semibold text-green-600">
                            Live
                        </span>

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