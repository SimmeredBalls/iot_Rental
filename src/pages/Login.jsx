// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) navigate("/dashboard");
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("admins")
        .select("admin_id, email, name, password_hash, role")
        .eq("email", email)
        .single();

      if (error || !data) {
        setError("Invalid email or password.");
      } else if (data.password_hash !== password) {
        // TEMP: Compare directly; replace with hashing check later
        setError("Invalid email or password.");
      } else {
        // ✅ Save token + redirect
        localStorage.setItem("adminToken", data.admin_id);
        localStorage.setItem("adminRole", data.role);
        localStorage.setItem("adminName", data.name);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 rounded-xl p-8 shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-400">
          IoT Rental Admin Login
        </h2>

        {error && (
          <p className="bg-red-700/40 text-red-300 text-sm p-2 rounded mb-4 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 rounded px-3 py-2 text-sm focus:outline-none"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 rounded px-3 py-2 text-sm focus:outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm font-medium"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
