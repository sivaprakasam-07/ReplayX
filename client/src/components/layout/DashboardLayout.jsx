import React from "react"
import Sidebar from "./Sidebar"
import TopNavbar from "./TopNavbar"

const DashboardLayout = ({ children }) => {

    return (
        <div className="flex min-h-screen bg-[#F5F7FA] text-[#1F2937] font-sans antialiased">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                <TopNavbar />

                <main className="flex-1 p-8 lg:p-10">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default React.memo(DashboardLayout)