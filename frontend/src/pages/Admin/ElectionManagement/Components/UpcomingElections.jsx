import React, { useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export function UpcomingElections() {
  const [elections, setElections] = useState([]);
  const [error, setError] = useState("");

  // Fetch upcoming elections
  const fetchUpcomingElections = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/upcomming-elections`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setElections(Array.isArray(data) ? data : []); // Ensure data is an array, even if null or unexpected
      } else {
        setError("Failed to fetch upcoming elections.");
        setElections([]); // Set to an empty array in case of failure
      }
    } catch (err) {
      setError("Unable to connect to the server.");
      setElections([]); // Set to an empty array in case of error
    }
  };

  useEffect(() => {
    fetchUpcomingElections();
  }, []);

  // Start an election
  const handleStartElection = async (id) => {
    try {
      const response = await fetch(`${backendUrl}/api/elections/${id}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Election started successfully!");
        fetchUpcomingElections();
      } else {
        alert("Failed to start the election.");
      }
    } catch (err) {
      alert("Unable to connect to the server.");
    }
  };

  // Stop an election
  const handleStopElection = async (id) => {
    try {
      const response = await fetch(`${backendUrl}/api/elections/${id}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Election stopped successfully!");
        fetchUpcomingElections();
      } else {
        alert("Failed to stop the election.");
      }
    } catch (err) {
      alert("Unable to connect to the server.");
    }
  };

  // Remove an election
  const handleRemoveElection = async (id) => {
    try {
      const response = await fetch(`${backendUrl}/api/elections/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Election removed successfully!");
        fetchUpcomingElections();
      } else {
        alert("Failed to remove the election.");
      }
    } catch (err) {
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Upcoming Elections</h3>
      {error && <p className="text-red-500 text-center">{error}</p>}
      {elections && elections.length > 0 ? (
        <table className="w-full text-left border-collapse bg-green-900">
          <thead>
            <tr>
              <th className="border-b py-2 px-4">Name</th>
              <th className="border-b py-2 px-4">Date</th>
              <th className="border-b py-2 px-4">Constituencies</th>
              <th className="border-b py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {elections.map((election) => (
              <tr key={election.id}>
                <td className="border-b py-2 px-4">{election.name || "Unnamed Election"}</td>
                <td className="border-b py-2 px-4">
                  {election.date ? new Date(election.date).toLocaleDateString() : "No Date Provided"}
                </td>
                <td className="border-b py-2 px-4">
                  {election.constituencies && election.constituencies.length > 0 ? (
                    <ul>
                      {election.constituencies.map((constituency) => (
                        <li key={constituency.id}>
                          <strong>{constituency.name || "Unnamed Constituency"}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No constituencies</p>
                  )}
                </td>
                <td className="border-b py-2 px-4">
                  {election.started ? (
                    <button
                      onClick={() => handleStopElection(election.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Stop
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartElection(election.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 mr-2"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleRemoveElection(election.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-600">No upcoming elections found.</p>
      )}
    </div>
  );
}