import MetricCard from "../components/cards/MetricCard"
import EventTable from "../components/tables/EventTable"

const Monitoring = () => {
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
              Streaming Live
            </span>
          </div>

        </div>

        <EventTable />

      </div>

    </div>
  )
}

export default Monitoring