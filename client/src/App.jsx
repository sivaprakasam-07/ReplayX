import { BrowserRouter, Routes, Route } from "react-router-dom"

import Dashboard from "./pages/Dashboard"
import Monitoring from "./pages/Monitoring"
import RetryAnalysis from "./pages/RetryAnalysis"
import ReplayCenter from "./pages/ReplayCenter"
import EndpointHealth from "./pages/EndpointHealth"
import Simulator from "./pages/Simulator"

import DashboardLayout from "./components/layout/DashboardLayout"

const App = () => {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
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