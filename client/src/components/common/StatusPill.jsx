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

        delivered:
            "bg-[#DCFCE7] text-[#15803D]",

        warning:
            "bg-[#FEF3C7] text-[#D97706]",

        pending:
            "bg-[#FEF3C7] text-[#D97706]",

        retrying:
            "bg-[#DBEAFE] text-[#2563EB]",

        critical:
            "bg-[#FEE2E2] text-[#DC2626]",

        failed:
            "bg-[#FEE2E2] text-[#DC2626]",

        blocked:
            "bg-[#FEE2E2] text-[#DC2626]",

        duplicate:
            "bg-[#F3E8FF] text-[#9333EA]",

        recovered:
            "bg-[#D1FAE5] text-[#047857]",

        expired:
            "bg-[#FEF3C7] text-[#B45309]",

        unsafe_to_replay:
            "bg-[#FEE2E2] text-[#DC2626]",

        unstable:
            "bg-[#FEE2E2] text-[#DC2626]",

        degraded:
            "bg-[#FEF3C7] text-[#D97706]",

        stable:
            "bg-[#DCFCE7] text-[#15803D]",

        low:
            "bg-[#DCFCE7] text-[#15803D]",

        medium:
            "bg-[#FEF3C7] text-[#D97706]",

        high:
            "bg-[#FEE2E2] text-[#DC2626]",
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