// src/components/layout/SidebarLayout.jsx
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";

const tabs = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/rentals", label: "Rentals" },
  { to: "/rental-requests", label: "Rental Requests" },
  { to: "/inventory", label: "Inventory" },
  { to: "/students", label: "Students" },
  { to: "/transactions", label: "Transactions" },
  { to: "/damage-assessments", label: "Damage Assessments" },
];

export default function SidebarLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-6 text-blue-400">IoT Rentals</h1>

          <nav className="space-y-2">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.to); // ✅ more robust check
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`block rounded px-3 py-2 transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-800 text-gray-300"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 bg-red-600 hover:bg-red-700 py-2 rounded text-sm font-medium"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-950 overflow-y-auto">
        <Outlet /> {/* 👈 This renders the nested page */}
      </main>
    </div>
  );
}
