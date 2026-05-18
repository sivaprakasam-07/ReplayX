import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts"
import React from "react"

const COLORS = [
    "#15803D",
    "#D97706",
    "#DC2626",
]

const EndpointHealthChart = ({
    chartData,
}) => {

    if (!chartData || chartData.length === 0) {
        return (
            <div className="h-[340px] flex items-center justify-center text-[#6B7280]">
                <p>No endpoint data available</p>
            </div>
        )
    }

    return (
        <div className="h-[340px]">

            <ResponsiveContainer
                width="100%"
                height="100%"
            >

                <PieChart>

                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={4}
                        dataKey="value"
                    >

                        {chartData.map(
                            (
                                entry,
                                index
                            ) => (

                                <Cell
                                    key={index}
                                    fill={
                                        COLORS[
                                        index %
                                        COLORS.length
                                        ]
                                    }
                                />

                            )
                        )}

                    </Pie>

                    <Tooltip
                        formatter={(value) => [
                            `${value} endpoints`,
                            "Count",
                        ]}
                    />

                </PieChart>

            </ResponsiveContainer>

        </div>
    )
}

export default React.memo(EndpointHealthChart)