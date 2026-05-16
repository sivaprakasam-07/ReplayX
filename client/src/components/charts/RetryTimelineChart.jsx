import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts"

import { retryData } from "../../data/retryData"

const RetryTimelineChart = () => {
    return (
        <div className="h-[340px] w-full">

            <ResponsiveContainer width="100%" height="100%">

                <LineChart data={retryData}>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E5E7EB"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: "#6B7280",
                            fontSize: 12,
                        }}
                    />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: "#6B7280",
                            fontSize: 12,
                        }}
                    />

                    <Tooltip />

                    <Line
                        type="monotone"
                        dataKey="retries"
                        stroke="#5B6CFF"
                        strokeWidth={3}
                        dot={false}
                    />

                    <Line
                        type="monotone"
                        dataKey="recovered"
                        stroke="#8FAF9F"
                        strokeWidth={3}
                        dot={false}
                    />

                </LineChart>

            </ResponsiveContainer>

        </div>
    )
}

export default RetryTimelineChart