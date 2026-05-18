import { useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import Monitoring from "./pages/Monitoring"
import RetryAnalysis from "./pages/RetryAnalysis"
import ReplayCenter from "./pages/ReplayCenter"
import EndpointHealth from "./pages/EndpointHealth"
import Simulator from "./pages/Simulator"

import DashboardLayout from "./components/layout/DashboardLayout"
import { subscribeToRealtimeEvents } from "./services/socket"

const App = () => {
  console.log(import.meta.env.VITE_API_BASE_URL)

  useEffect(() => {
    const unsub = subscribeToRealtimeEvents(() => {})
    return () => unsub()
  }, [])

  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/retries" element={<RetryAnalysis />} />
          <Route path="/replay" element={<ReplayCenter />} />
          <Route path="/endpoints" element={<EndpointHealth />} />
          <Route path="/simulator" element={<Simulator />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  )
}

export default App