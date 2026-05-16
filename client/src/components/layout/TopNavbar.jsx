const TopNavbar = () => {
    return (
        <div className="h-20 border-b border-[#E5E7EB] bg-white px-8 flex items-center justify-between shadow-[0_1px_0_rgba(255,255,255,0.8)]">

            <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
                    Webhook Reliability Platform
                </h1>

                <p className="text-sm font-medium text-[#6B7280] mt-1">
                    Realtime monitoring & replay intelligence
                </p>
            </div>

            <div className="flex items-center gap-4">

                <div className="bg-[#F8FAFC] px-4 py-2 rounded-2xl border border-[#E5E7EB] shadow-sm min-w-36">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                        Active Endpoints
                    </p>

                    <h3 className="text-lg font-semibold text-[#1F2937] mt-0.5">
                        128
                    </h3>
                </div>

                <div className="w-10 h-10 rounded-full bg-[#EEF2FF] text-[#5B6CFF] flex items-center justify-center font-semibold border border-[#E0E7FF] shadow-sm">
                    R
                </div>

            </div>
        </div>
    )
}

export default TopNavbar