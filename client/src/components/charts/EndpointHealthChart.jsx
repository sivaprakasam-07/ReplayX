import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts"

const COLORS = [
    "#8FAF9F",
    "#F59E0B",
    "#EF4444",
]

const EndpointHealthChart = ({
    chartData,
}) => {
    // Handle empty or missing data
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

                    <Tooltip />

                </PieChart>

            </ResponsiveContainer>

        </div>
    )
}

export default EndpointHealthChart