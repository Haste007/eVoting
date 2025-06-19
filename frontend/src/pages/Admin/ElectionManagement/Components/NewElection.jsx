import React, { useState } from "react";
import { ConstituencyForm } from "./ConstituencyForm";
import { districts } from "../../../../data/districts";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export function NewElection({ onBack }) {
  const [electionName, setElectionName] = useState("");
  const [constituencies, setConstituencies] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([...districts]); // Load districts from districts.jsx
  const [showConstituencyForm, setShowConstituencyForm] = useState(false);

  const handleAddConstituency = (newConstituency) => {
    const constituencyIndex = constituencies.length + 1; // Determine the index for the new constituency
    const constituencyName = `NA-${constituencyIndex}`; // Automatically name the constituency

    setConstituencies([
      ...constituencies,
      { ...newConstituency, name: constituencyName }, // Add the constituency with the generated name
    ]);
    setShowConstituencyForm(false);
  };

  const handleDeleteConstituency = (index) => {
    const removedConstituency = constituencies[index];
    setConstituencies(constituencies.filter((_, i) => i !== index));

    // Return districts to the available pool
    setAvailableDistricts([...availableDistricts, ...removedConstituency.districts]);
  };

  const handleCreateElection = async () => {
    if (!electionName || constituencies.length === 0) {
      alert("Please provide an election name and add at least one constituency.");
      return;
    }

    // Prepare the request payload
    const payload = {
      name: electionName,
      constituencies: constituencies.map((constituency) => ({
        name: constituency.name,
        districts: constituency.districts,
        candidates: constituency.candidates.map((candidate) => ({
          party_id: candidate.partyId,
          citizen_id: candidate.citizenId,
        })),
      })),
    };

    try {
      const response = await fetch(`${backendUrl}/api/elections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Election created successfully!");
        onBack();
      } else {
        alert("Failed to create the election.");
      }
    } catch (err) {
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">New Election</h3>
      <form>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Election Name</label>
          <input
            type="text"
            value={electionName}
            onChange={(e) => setElectionName(e.target.value)}
            className="w-full px-4 py-2 mt-1 text-sm border rounded-md bg-white text-black"
            placeholder="Enter election name"
          />
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Constituencies</h4>
          <ul className="space-y-2">
            {constituencies.map((constituency, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-gray-200 text-gray-800 rounded-md">
                <p>{constituency.name}</p>
                <button
                  type="button"
                  onClick={() => handleDeleteConstituency(index)}
                  className="px-2 py-1 text-sm text-white bg-red-600 rounded-md"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowConstituencyForm(true)}
            className="mt-2 px-4 py-2 text-sm text-white bg-green-600 rounded-md"
          >
            + Add Constituency
          </button>
        </div>

        {showConstituencyForm && (
          <ConstituencyForm
            onSave={handleAddConstituency}
            onCancel={() => setShowConstituencyForm(false)}
            availableDistricts={availableDistricts}
            onUpdateAvailableDistricts={setAvailableDistricts}
          />
        )}

        <div className="flex justify-end mt-6 space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateElection}
            className="px-4 py-2 text-sm text-white bg-green-700 rounded-md"
          >
            Create Election
          </button>
        </div>
      </form>
    </div>
  );
}