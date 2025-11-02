import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/rentals", label: "Rentals" },
  { to: "/inventory", label: "Inventory" },
  { to: "/students", label: "Students" },
  { to: "/transactions", label: "Transactions" },
];

export default function SidebarLayout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">IoT Rentals</h1>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={`block rounded px-3 py-2 transition ${
                pathname === tab.to
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 bg-gray-950">{children}</main>
    </div>
  );
}
