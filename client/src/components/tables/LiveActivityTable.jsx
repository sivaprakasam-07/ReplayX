import { activityData } from "../../data/activityData"
import StatusPill from "../common/StatusPill"

const LiveActivityTable = () => {
    return (
        <div className="space-y-4">

            {activityData.map((activity) => (
                <div
                    key={activity.id}
                    className="flex items-start justify-between pb-4 border-b border-[#F1F5F9] last:border-none"
                >

                    <div className="space-y-1">

                        <p className="text-sm font-semibold text-[#1F2937]">
                            {activity.title}
                        </p>

                        <p className="text-xs text-[#6B7280]">
                            {activity.description}
                        </p>

                    </div>

                    <StatusPill status={activity.status} />

                </div>
            ))}

        </div>
    )
}

export default LiveActivityTable