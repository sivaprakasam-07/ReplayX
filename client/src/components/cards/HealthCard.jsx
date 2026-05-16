const HealthCard = ({
    title,
    value,
    description,
}) => {
    return (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">

            <p className="text-sm font-medium text-[#6B7280]">
                {title}
            </p>

            <h2 className="text-3xl font-bold text-[#1F2937] mt-3">
                {value}
            </h2>

            <p className="text-sm text-[#6B7280] mt-2">
                {description}
            </p>

        </div>
    )
}

export default HealthCard