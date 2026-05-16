import { motion, AnimatePresence } from "framer-motion"

const EventModal = ({
    isOpen,
    onClose,
    eventDetails,
    analysis,
}) => {

    if (!isOpen) return null

    return (
        <AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            >

                <motion.div
                    initial={{
                        opacity: 0,
                        scale: 0.95,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                    }}
                    exit={{
                        opacity: 0,
                        scale: 0.95,
                        y: 20,
                    }}
                    transition={{
                        duration: 0.25,
                    }}
                    className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                >

                    <div className="flex items-center justify-between px-8 py-6 border-b border-[#E5E7EB]">

                        <div>
                            <h2 className="text-2xl font-bold text-[#1F2937]">
                                Event Intelligence
                            </h2>

                            <p className="text-sm text-[#6B7280] mt-1">
                                Detailed webhook reliability analysis
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors"
                        >
                            ✕
                        </button>

                    </div>

                    <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E5E7EB]">

                                <h3 className="text-lg font-bold text-[#1F2937] mb-4">
                                    Event Details
                                </h3>

                                <div className="space-y-3">

                                    <div>
                                        <p className="text-sm text-[#6B7280]">
                                            Event ID
                                        </p>

                                        <p className="font-semibold text-[#1F2937]">
                                            {eventDetails?.event?.event_id}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-[#6B7280]">
                                            Event Type
                                        </p>

                                        <p className="font-semibold text-[#1F2937]">
                                            {eventDetails?.event?.event_type}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-[#6B7280]">
                                            Customer ID
                                        </p>

                                        <p className="font-semibold text-[#1F2937]">
                                            {eventDetails?.event?.customer_id}
                                        </p>
                                    </div>

                                </div>

                            </div>

                            <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E5E7EB]">

                                <h3 className="text-lg font-bold text-[#1F2937] mb-4">
                                    Intelligence Analysis
                                </h3>

                                <div className="space-y-3">

                                    <div>
                                        <p className="text-sm text-[#6B7280]">
                                            Delivery State
                                        </p>

                                        <p className="font-semibold text-[#1F2937]">
                                            {analysis?.delivery_state}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-[#6B7280]">
                                            Failure Reason
                                        </p>

                                        <p className="font-semibold text-[#1F2937]">
                                            {analysis?.failure_reason}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-[#6B7280]">
                                            Recommended Action
                                        </p>

                                        <p className="font-semibold text-[#1F2937]">
                                            {analysis?.recommended_action}
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">

                                <p className="text-sm text-green-700">
                                    Replay Safety
                                </p>

                                <h2 className="text-3xl font-bold text-green-800 mt-2">
                                    {analysis?.safe_to_replay
                                        ? "Safe"
                                        : "Blocked"}
                                </h2>

                            </div>

                            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">

                                <p className="text-sm text-indigo-700">
                                    Risk Score
                                </p>

                                <h2 className="text-3xl font-bold text-indigo-800 mt-2">
                                    {analysis?.risk_score}
                                </h2>

                            </div>

                        </div>

                        <div className="bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] p-6">

                            <h3 className="text-lg font-bold text-[#1F2937] mb-5">
                                Delivery History
                            </h3>

                            <div className="space-y-4">

                                {eventDetails?.delivery_history?.map(
                                    (
                                        delivery,
                                        index
                                    ) => (

                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E5E7EB]"
                                        >

                                            <div>
                                                <p className="font-semibold text-[#1F2937]">
                                                    Attempt #{delivery.attempt_number}
                                                </p>

                                                <p className="text-sm text-[#6B7280] mt-1">
                                                    {delivery.failure_reason || "Successful delivery"}
                                                </p>
                                            </div>

                                            <div className="text-sm font-medium text-[#1F2937]">
                                                {delivery.delivery_status}
                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>

                    </div>

                </motion.div>

            </motion.div>

        </AnimatePresence>
    )
}

export default EventModal