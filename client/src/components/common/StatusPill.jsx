const StatusPill = ({
    status,
}) => {

    const normalizedStatus =
        status?.toLowerCase()

    const styles = {
        healthy:
            "bg-[#DCFCE7] text-[#15803D]",

        success:
            "bg-[#DCFCE7] text-[#15803D]",

        warning:
            "bg-[#FEF3C7] text-[#D97706]",

        pending:
            "bg-[#FEF3C7] text-[#D97706]",

        critical:
            "bg-[#FEE2E2] text-[#DC2626]",

        failed:
            "bg-[#FEE2E2] text-[#DC2626]",

        retrying:
            "bg-[#DBEAFE] text-[#2563EB]",
    }

    return (
        <span
            className={`
                inline-flex
                items-center
                px-3
                py-1
                rounded-full
                text-xs
                font-semibold
                ${styles[normalizedStatus]}
            `}
        >
            {status}
        </span>
    )
}

export default StatusPill