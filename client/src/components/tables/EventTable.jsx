import StatusPill from "../common/StatusPill"
import { motion, AnimatePresence } from "framer-motion"

const EventTable = ({ events = [], onSelectEvent }) => {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">

            <div className="overflow-x-auto">

                <table className="w-full">

                    <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">

                        <tr>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Event ID
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Event Type
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Customer ID
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#6B7280]">
                                Status
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        <AnimatePresence initial={false}>

                            {events.length > 0 ? (

                                events.map((event) => (

                                    <motion.tr
                                        key={event.event_id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.25 }}
                                        layout
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onSelectEvent?.(event.event_id)}
                                        onKeyDown={(keyboardEvent) => {
                                            if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                                                keyboardEvent.preventDefault()
                                                onSelectEvent?.(event.event_id)
                                            }
                                        }}
                                        className="border-b border-[#F1F5F9] hover:bg-[#FAFBFC] transition-colors cursor-pointer"
                                    >

                                        <td className="px-6 py-4 text-sm font-semibold text-[#1F2937]">
                                            {event.event_id}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-[#6B7280]">
                                            {event.event_type}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-[#6B7280]">
                                            {event.customer_id}
                                        </td>

                                        <td className="px-6 py-4">
                                            <StatusPill
                                                status={
                                                    event.delivery_state ||
                                                    "success"
                                                }
                                            />
                                        </td>

                                    </motion.tr>

                                ))

                            ) : (

                                <tr>

                                    <td
                                        colSpan={4}
                                        className="px-6 py-10 text-center text-sm text-[#6B7280]"
                                    >
                                        No events available
                                    </td>

                                </tr>

                            )}

                        </AnimatePresence>

                    </tbody>

                </table>

            </div>

        </div>
    )
}

export default EventTable