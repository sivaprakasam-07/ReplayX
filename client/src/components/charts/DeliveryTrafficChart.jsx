import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts"

import { deliveryData } from "../../data/deliveryData"

const DeliveryTrafficChart = () => {
    return (
        <div className="h-[300px] w-full">

            <ResponsiveContainer width="100%" height="100%">

                <AreaChart data={deliveryData}>

                    <defs>

                        <linearGradient
                            id="successGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor="#5B6CFF"
                                stopOpacity={0.3}
                            />

                            <stop
                                offset="95%"
                                stopColor="#5B6CFF"
                                stopOpacity={0}
                            />
                        </linearGradient>

                        <linearGradient
                            id="failedGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor="#EF4444"
                                stopOpacity={0.25}
                            />

                            <stop
                                offset="95%"
                                stopColor="#EF4444"
                                stopOpacity={0}
                            />
                        </linearGradient>

                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E5E7EB"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="time"
                        tick={{
                            fill: "#6B7280",
                            fontSize: 12,
                        }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <YAxis
                        tick={{
                            fill: "#6B7280",
                            fontSize: 12,
                        }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip />

                    <Area
                        type="monotone"
                        dataKey="success"
                        stroke="#5B6CFF"
                        strokeWidth={3}
                        fill="url(#successGradient)"
                    />

                    <Area
                        type="monotone"
                        dataKey="failed"
                        stroke="#EF4444"
                        strokeWidth={2}
                        fill="url(#failedGradient)"
                    />

                </AreaChart>

            </ResponsiveContainer>

        </div>
    )
}

export default DeliveryTrafficChart