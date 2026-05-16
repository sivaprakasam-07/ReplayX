const statusStyles = {
    success: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    retry: "bg-indigo-100 text-indigo-700",
    warning: "bg-amber-100 text-amber-700",
}

const StatusPill = ({ status }) => {
    return (
        <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[status]}`}
        >
            {status}
        </span>
    )
}

export default StatusPill