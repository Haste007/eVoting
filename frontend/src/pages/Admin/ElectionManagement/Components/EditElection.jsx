import React, { useEffect, useState } from "react";
import { Constituency } from "../../../../models/Constituency";
import { districts as allDistricts } from "../../../../data/districts"; // Import all districts

export function EditElection({ electionId, onBack }) {
  const [electionName, setElectionName] = useState("");
  const [electionDate, setElectionDate] = useState("");
  const [timeLimit, setTimeLimit] = useState(24);
  const [constituencies, setConstituencies] = useState([]);
  const [showConstituencyForm, setShowConstituencyForm] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState(allDistricts); // Track available districts
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [error, setError] = useState("");

  // Fetch election details
  const fetchElectionDetails = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/elections/${electionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setElectionName(data.name);
        setElectionDate(data.date);
        setTimeLimit(data.time_limit);
        setConstituencies(
          data.constituencies.map((c, index) => new Constituency(index + 1, `NA-${index + 1}`, c.districts))
        );
        setAvailableDistricts(
          allDistricts.filter(
            (district) => !data.constituencies.some((c) => c.districts.includes(district))
          )
        );
      } else {
        setError("Failed to fetch election details.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    }
  };

  useEffect(() => {
    fetchElectionDetails();
  }, [electionId]);

  const handleAddConstituency = () => {
    setShowConstituencyForm(true);
  };

  const handleCreateConstituency = () => {
    if (selectedDistricts.length === 0) {
      alert("Please select at least one district for the constituency.");
      return;
    }

    const newConstituencyId = constituencies.length + 1;
    const newConstituency = new Constituency(
      newConstituencyId,
      `NA-${newConstituencyId}`,
      selectedDistricts
    );

    setConstituencies([...constituencies, newConstituency]);
    setAvailableDistricts(
      availableDistricts.filter((district) => !selectedDistricts.includes(district))
    ); // Update available districts
    setSelectedDistricts([]);
    setShowConstituencyForm(false);
  };

  const handleDeleteConstituency = (id) => {
    const constituencyToRemove = constituencies.find((c) => c.id === id);
    setAvailableDistricts([...availableDistricts, ...constituencyToRemove.districts]); // Restore districts
    setConstituencies(constituencies.filter((c) => c.id !== id));
  };

  const handleSaveChanges = async () => {
    if (!electionName || !electionDate || constituencies.length === 0) {
      alert("Please fill in all fields and add at least one constituency.");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/elections/${electionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: electionName,
          date: electionDate,
          time_limit: timeLimit,
          constituencies: constituencies.map((c) => ({
            name: c.name,
            districts: c.districts,
          })),
        }),
      });

      if (response.ok) {
        alert("Election updated successfully!");
        onBack();
      } else {
        alert("Failed to update the election.");
      }
    } catch (err) {
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Election</h3>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <form>
        {/* Election Name */}
        <div className="mb-4">
          <label
            htmlFor="electionName"
            className="block text-sm font-medium text-gray-700"
          >
            Election Name
          </label>
          <input
            type="text"
            id="electionName"
            value={electionName}
            onChange={(e) => setElectionName(e.target.value)}
            className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
            placeholder="Enter election name"
          />
        </div>

        {/* Election Date */}
        <div className="mb-4">
          <label
            htmlFor="electionDate"
            className="block text-sm font-medium text-gray-700"
          >
            Election Date
          </label>
          <input
            type="date"
            id="electionDate"
            value={electionDate}
            onChange={(e) => setElectionDate(e.target.value)}
            className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
          />
        </div>

        {/* Time Limit */}
        <div className="mb-4">
          <label
            htmlFor="timeLimit"
            className="block text-sm font-medium text-gray-700"
          >
            Time Limit (hours)
          </label>
          <input
            type="number"
            id="timeLimit"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
            placeholder="Enter time limit in hours"
          />
        </div>

        {/* Constituencies */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Constituencies
          </h4>
          <ul className="space-y-2">
            {constituencies.map((constituency) => (
              <li
                key={constituency.id}
                className="flex items-center justify-between p-2 bg-gray-100 rounded-md shadow-sm"
              >
                <p className="text-gray-800 font-medium">{constituency.name}</p>
                <button
                  type="button"
                  onClick={() => handleDeleteConstituency(constituency.id)}
                  className="px-2 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleAddConstituency}
            className="mt-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            + Add Constituency
          </button>
        </div>

        {/* Constituency Form */}
        {showConstituencyForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md shadow-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Create Constituency
            </h4>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Districts
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableDistricts.map((district) => (
                  <label key={district} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={district}
                      checked={selectedDistricts.includes(district)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDistricts([...selectedDistricts, district]);
                        } else {
                          setSelectedDistricts(
                            selectedDistricts.filter((d) => d !== district)
                          );
                        }
                      }}
                      className="form-checkbox"
                    />
                    <span className="text-sm text-gray-700">{district}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowConstituencyForm(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateConstituency}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Save Changes Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-md hover:bg-green-800"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}