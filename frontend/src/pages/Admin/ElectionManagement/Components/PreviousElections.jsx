import React, { useEffect, useState } from "react";
import { ConstituencyResult } from "./ConstituencyResult";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export function PreviousElections({ onBack }) {
  const [previousElections, setPreviousElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [selectedConstituency, setSelectedConstituency] = useState(null);
  const [error, setError] = useState("");

  // Fetch previous elections
  useEffect(() => {
    const fetchPreviousElections = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/past-elections`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPreviousElections(Array.isArray(data) ? data : []); // Ensure data is an array
        } else {
          setError("Failed to fetch previous elections.");
        }
      } catch (err) {
        setError("Unable to connect to the server.");
      }
    };
    fetchPreviousElections();
  }, []);

  if (selectedElection) {
    const { name, date, constituencies } = selectedElection;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{name}</h3>
        <p className="text-sm text-gray-600 mb-4">Date: {new Date(date).toLocaleDateString()}</p>

        {/* Navbar for Constituencies */}
        <div className="flex space-x-4 overflow-x-auto mb-6">
          {constituencies.map((constituency) => (
            <button
              key={constituency.id}
              onClick={() => setSelectedConstituency(constituency)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                selectedConstituency?.id === constituency.id
                  ? "bg-green-700 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {constituency.name}
            </button>
          ))}
        </div>

        {/* Constituency Result */}
        {selectedConstituency ? (
          <ConstituencyResult constituency={selectedConstituency} />
        ) : (
          <p className="text-sm text-gray-600">Select a constituency to view results.</p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setSelectedElection(null)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Previous Elections</h3>
      {error && <p className="text-red-500 text-center">{error}</p>}
      {previousElections.length > 0 ? (
        <ul className="space-y-4">
          {previousElections.map((election) => (
            <li
              key={election.id}
              className="flex items-center justify-between p-4 bg-gray-100 rounded-md shadow-sm cursor-pointer hover:bg-gray-200"
              onClick={() => setSelectedElection(election)}
            >
              <div>
                <p className="text-lg font-bold text-gray-800">{election.name || "Unnamed Election"}</p>
                <p className="text-sm text-gray-600">
                  Date: {election.date ? new Date(election.date).toLocaleDateString() : "No Date Provided"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-600">No previous elections found.</p>
      )}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Back
        </button>
      </div>
    </div>
  );
}