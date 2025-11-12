// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./components/layout/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Rentals from "./pages/Rentals";
import Inventory from "./pages/Inventory";
import Students from "./pages/Students";
import Transactions from "./pages/Transactions";
import RentalExtensions from "./pages/RentalExtensions";
import DamageAssessments from "./pages/DamageAssessments";
import Login from "./pages/Login";
import RentalRequests from "./pages/RentalRequests";

// 🔒 Route guard
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes with Sidebar Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SidebarLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="rentals" element={<Rentals />} />
          <Route path="rental-requests" element={<RentalRequests />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="students" element={<Students />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="rental-extensions" element={<RentalExtensions />} />
          <Route path="damage-assessments" element={<DamageAssessments />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
