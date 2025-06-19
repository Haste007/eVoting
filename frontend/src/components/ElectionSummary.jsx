import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

backendUrl = import.meta.env.VITE_BACKEND_URL;

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function ElectionSummary({ electionId, onBack }) {
  const [electionDetails, setElectionDetails] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // Track the active constituency tab
  const [error, setError] = useState("");

  // Fetch election results from the backend
  const fetchElectionResults = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/elections/${electionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setElectionDetails(data);
      } else {
        setError("Failed to fetch election results.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    }
  };

  useEffect(() => {
    fetchElectionResults();
  }, [electionId]);

  if (!electionDetails) {
    return <p className="text-center text-gray-600">Loading election results...</p>;
  }

  const activeConstituency = electionDetails.constituencies[activeTab];
  const chartData = {
    labels: Object.keys(activeConstituency.partyVotes), // Party names
    datasets: [
      {
        label: "Votes",
        data: Object.values(activeConstituency.partyVotes), // Votes for each party
        backgroundColor: ["#4CAF50", "#2196F3", "#FFC107", "#FF5722"], // Colors for the bars
        borderColor: ["#388E3C", "#1976D2", "#FFA000", "#E64A19"], // Border colors
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Hide the legend
      },
      tooltip: {
        enabled: true, // Enable tooltips
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Parties",
        },
      },
      y: {
        title: {
          display: true,
          text: "Votes",
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        {electionDetails.name} Summary
      </h3>
      <p className="text-sm text-gray-600 mb-4">Date: {electionDetails.date}</p>

      {/* Total Votes */}
      <p className="text-gray-700 mb-4">
        <strong>Total Votes:</strong> {electionDetails.totalVotes}
      </p>

      {/* Constituency Tabs */}
      <div className="mb-4">
        <div className="flex space-x-2 border-b">
          {electionDetails.constituencies.map((constituency, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === index
                  ? "text-white bg-blue-600"
                  : "text-blue-600 bg-gray-100"
              } rounded-t-md`}
            >
              {constituency.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Constituency Details */}
      <div className="mb-4">
        <h4 className="text-md font-bold text-gray-800 mb-2">
          {activeConstituency.name} Results
        </h4>
        <p className="text-gray-700 mb-2">
          <strong>Winner:</strong> {activeConstituency.winningParty}
        </p>
        <ul className="space-y-2">
          {Object.entries(activeConstituency.partyVotes).map(([party, votes]) => (
            <li key={party} className="text-gray-700">
              {party}: {votes} votes
            </li>
          ))}
        </ul>
      </div>

      {/* Graph */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-800 mb-2">Results Graph:</h4>
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Back Button */}
      <div className="mt-6 flex justify-end">
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

export { ElectionSummary };