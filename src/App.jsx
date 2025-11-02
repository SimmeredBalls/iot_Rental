import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./components/layout/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Rentals from "./pages/Rentals";
import Inventory from "./pages/Inventory";
import Students from "./pages/Students";
import Transactions from "./pages/Transactions";

export default function App() {
  return (
    <BrowserRouter>
      <SidebarLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/students" element={<Students />} />
          <Route path="/transactions" element={<Transactions />} />
        </Routes>
      </SidebarLayout>
    </BrowserRouter>
  );
}
