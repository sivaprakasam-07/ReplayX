import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from "recharts"

import { retryData } from "../../data/retryData"

const RetryTimelineChart = ({ data, predictedData }) => {
    const chartData = data || retryData

    const hasPredicted = predictedData || chartData.some(d => d.predicted_retries != null)

    return (
        <div className="h-[340px] w-full">

            <ResponsiveContainer width="100%" height="100%">

                <LineChart data={chartData}>

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

                    {hasPredicted && <Legend />}

                    <Line
                        type="monotone"
                        dataKey="retries"
                        stroke="#5B6CFF"
                        strokeWidth={3}
                        dot={false}
                        name="Actual Retries"
                    />

                    <Line
                        type="monotone"
                        dataKey="recovered"
                        stroke="#8FAF9F"
                        strokeWidth={3}
                        dot={false}
                        name="Recovered"
                    />

                    {hasPredicted && (
                        <>
                            <Line
                                type="monotone"
                                dataKey="predicted_retries"
                                stroke="#5B6CFF"
                                strokeWidth={2}
                                strokeDasharray="6 4"
                                dot={false}
                                name="Predicted Retries"
                            />
                            <Line
                                type="monotone"
                                dataKey="predicted_recovered"
                                stroke="#8FAF9F"
                                strokeWidth={2}
                                strokeDasharray="6 4"
                                dot={false}
                                name="Predicted Recovered"
                            />
                        </>
                    )}

                </LineChart>

            </ResponsiveContainer>

        </div>
    )
}

export default RetryTimelineChart