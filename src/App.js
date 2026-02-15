import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import JobDetail from "./pages/JobDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { JobProvider } from "./context/JobContext";

export default function App() {
  return (
    <JobProvider>
      <BrowserRouter>
        <Header />
        <div className="pt-24 max-w-7xl mx-auto px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/job/:slug" element={<JobDetail />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </BrowserRouter>
    </JobProvider>
  );
}
