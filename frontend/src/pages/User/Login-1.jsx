import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardLayout } from "../../components/CardLayout";

backendUrl = import.meta.env.VITE_BACKEND_URL;

function Login() {
  const [nid, setNid] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${backendUrl}/api/citizens/${nid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.nid) {
          localStorage.setItem("citizenId", data.nid); // Save citizen ID for use across pages
          if (data.id === 1) {
            navigate("/admin"); // Redirect to the admin panel if ID is 1
          } else {
            navigate("/voting"); // Redirect to the voting page
          }
        } else {
          setError("Citizen not found. Please check your NID.");
        }
      } else {
        setError("Error fetching Citizen details. Please try again later.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again later.");
    }
  };

  return (
    <CardLayout>
      <h1 className="text-2xl font-bold text-center text-white">Citizen Login</h1>
      <form
        onSubmit={handleLogin}
        className="mt-6 flex flex-col items-center space-y-4"
      >
        <div className="w-3/4">
          <label
            htmlFor="nid"
            className="block text-sm font-medium text-white"
          >
            National Identity Number
          </label>
          <input
            type="text"
            id="nid"
            name="nid"
            value={nid}
            onChange={(e) => setNid(e.target.value)}
            required
            pattern="\d{5}-\d{7}-\d{1}" // Regex for the required format
            title="Enter a valid NIN in the format 11111-2222222-3"
            className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
            placeholder="11111-2222222-3"
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

export { Login };