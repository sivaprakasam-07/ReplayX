const MetricCard = ({
    title,
    value,
    change,
    status,
}) => {
    return (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">

            <div className="flex items-start justify-between">

                <div>
                    <p className="text-sm text-[#6B7280] font-medium">
                        {title}
                    </p>

                    <h2 className="text-4xl font-bold text-[#1F2937] mt-4">
                        {value}
                    </h2>
                </div>

                <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${status === "positive"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                >
                    {change}
                </div>

            </div>
        </div>
    )
}

export default MetricCard