import { useEffect, useState } from "react"

import MetricCard from "../components/cards/MetricCard"
import EventTable from "../components/tables/EventTable"
import EventModal from "../components/common/EventModal"

import { getEvents, getEventById } from "../services/api/eventsApi"
import { analyzeEvent } from "../services/api/intelligenceApi"

const Monitoring = () => {

    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedEvent, setSelectedEvent] = useState(null)
    const [analysis, setAnalysis] = useState(null)

    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {

        const fetchEvents = async () => {

            try {

                setLoading(true)

                const data = await getEvents()

                setEvents(data)

            } catch (err) {

                console.error(err)

                setError(
                    "Failed to fetch monitoring events"
                )

            } finally {

                setLoading(false)

            }
        }

        fetchEvents()

    }, [])

    const handleSelectEvent = async (
        eventId
    ) => {

        try {

            const eventDetails =
                await getEventById(eventId)

            const intelligence =
                await analyzeEvent(eventId)

            setSelectedEvent(eventDetails)

            setAnalysis(intelligence)

            setModalOpen(true)

        } catch (err) {

            console.error(
                "Failed to fetch event intelligence",
                err
            )
        }
    }

    return (
        <div className="space-y-8">

            <div>
                <h1 className="text-4xl font-bold tracking-tight text-[#1F2937]">
                    Realtime Monitoring
                </h1>

                <p className="text-[#6B7280] mt-2">
                    Monitor live webhook events, delivery states, retries, and endpoint performance.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                    title="Active Deliveries"
                    value="1,248"
                    change="+8.2%"
                    status="positive"
                />

                <MetricCard
                    title="Failed Requests"
                    value="84"
                    change="-4.1%"
                    status="positive"
                />

                <MetricCard
                    title="Avg Latency"
                    value="214ms"
                    change="-1.8%"
                    status="positive"
                />

                <MetricCard
                    title="Retry Queue"
                    value="19"
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
            />

        </div>
    )
}

export default Monitoring