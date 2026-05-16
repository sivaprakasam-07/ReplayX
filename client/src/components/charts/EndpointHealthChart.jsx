import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts"

const data = [
    {
        name: "Healthy",
        value: 68,
    },
    {
        name: "Warning",
        value: 21,
    },
    {
        name: "Critical",
        value: 11,
    },
]

const COLORS = [
    "#8FAF9F",
    "#F59E0B",
    "#EF4444",
]

const EndpointHealthChart = () => {
    return (
        <div className="h-[340px]">

            <ResponsiveContainer width="100%" height="100%">

                <PieChart>

                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={4}
                        dataKey="value"
                    >

                        {data.map((entry, index) => (
                            <Cell
                                key={index}
                                fill={COLORS[index]}
                            />
                        ))}

                    </Pie>

                    <Tooltip />

                </PieChart>

            </ResponsiveContainer>

        </div>
    )
}

export default EndpointHealthChart