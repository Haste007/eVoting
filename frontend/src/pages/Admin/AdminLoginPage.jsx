import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardLayout } from "../../components/CardLayout";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(`${backendUrl}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("adminAuthenticated", "true");
        navigate("/admin");
      } else {
        setError("Invalid admin credentials");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    }
  };

  return (
    <CardLayout>
      <h1 className="text-2xl font-bold text-center text-white">Admin Login</h1>
      <form onSubmit={handleLogin} className="mt-6 flex flex-col items-center space-y-4">
        <div className="w-3/4">
          <label htmlFor="username" className="block text-sm font-medium text-white">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
            placeholder="Enter admin username"
          />
        </div>
        <div className="w-3/4">
          <label htmlFor="password" className="block text-sm font-medium text-white">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
            placeholder="Enter admin password"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-3/4 px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-md hover:bg-green-800 focus:ring focus:ring-green-300 focus:outline-none"
        >
          Login
        </button>
      </form>
    </CardLayout>
  );
}

export { AdminLoginPage };
