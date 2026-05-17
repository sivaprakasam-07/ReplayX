import { CheckCircle2, XCircle } from "lucide-react"

const variants = {
    success: {
        container: "border-emerald-200 bg-emerald-50 text-emerald-900",
        icon: "text-emerald-600",
    },
    error: {
        container: "border-rose-200 bg-rose-50 text-rose-900",
        icon: "text-rose-600",
    },
}

const EventToast = ({ type = "success", message }) => {
    const styles = variants[type] || variants.success
    const Icon = type === "error" ? XCircle : CheckCircle2

    return (
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${styles.container}`}>
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} />
            <div>
                <p className="text-sm font-semibold leading-5">{message}</p>
            </div>
        </div>
    )
}

export default EventToast