import React, { useState, useEffect } from "react";

export function ConstituencyForm({ onSave, onCancel, availableDistricts, onUpdateAvailableDistricts }) {
  const [currentCandidates, setCurrentCandidates] = useState([]);
  const [currentDistricts, setCurrentDistricts] = useState([]);
  const [availableParties, setAvailableParties] = useState([]);
  const [showAddCandidateDialog, setShowAddCandidateDialog] = useState(false);
  const [showChooseDistrictDialog, setShowChooseDistrictDialog] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [partyMembers, setPartyMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // Fetch available parties from the database


  useEffect(() => {
    const fetchParties = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/parties`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableParties(data || []);
        } else {
          alert("Failed to fetch parties.");
        }
      } catch (err) {
        alert("Unable to connect to the server.");
      }
    };

    fetchParties();
  }, []);

  // Handle adding a candidate
  const handleAddCandidate = () => {
    if (!selectedParty || !selectedMember) {
      alert("Please select both a party and a member.");
      return;
    }

    setCurrentCandidates([
      ...currentCandidates,
      { party: selectedParty, member: selectedMember },
    ]);

    // Remove the selected party from the available parties
    setAvailableParties(availableParties.filter((party) => party.id !== selectedParty.id));

    // Reset the dialog state
    setSelectedParty(null);
    setSelectedMember(null);
    setPartyMembers([]);
    setShowAddCandidateDialog(false);
  };

  // Handle removing a candidate
  const handleRemoveCandidate = (index) => {
    const removedCandidate = currentCandidates[index];
    setCurrentCandidates(currentCandidates.filter((_, i) => i !== index));

    // Add the removed party back to the available parties
    setAvailableParties([...availableParties, removedCandidate.party]);
  };

  // Handle selecting a party
  const handleSelectParty = async (party) => {
    setSelectedParty(party);

    // Fetch members of the selected party
    try {
      const response = await fetch(`${backendUrl}/api/parties/${party.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPartyMembers(data.members || []);
      } else {
        alert("Failed to fetch party members.");
      }
    } catch (err) {
      alert("Unable to connect to the server.");
    }
  };

  // Handle adding a district
  const handleAddDistrict = (district) => {
    setCurrentDistricts([...currentDistricts, district]);
    onUpdateAvailableDistricts(availableDistricts.filter((d) => d !== district));
    setShowChooseDistrictDialog(false);
  };

  // Handle removing a district
  const handleRemoveDistrict = (district) => {
    setCurrentDistricts(currentDistricts.filter((d) => d !== district));
    onUpdateAvailableDistricts([...availableDistricts, district]);
  };

  // Handle saving the constituency
  const handleSave = () => {
    if (!currentDistricts || currentDistricts.length === 0 || currentCandidates.length === 0) {
      alert("Please add at least one district and one candidate.");
      return;
    }

    onSave({
      districts: currentDistricts,
      candidates: currentCandidates.map((candidate) => ({
        partyId: candidate.party.id,
        citizenId: candidate.member.id,
      })),
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-md shadow-md">
      <div className="mb-4">
        <h4 className="text-lg font-medium text-gray-700">New Constituency</h4>
      </div>

      {/* Current Candidates */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700">Current Candidates</h5>
        <ul className="space-y-2">
          {currentCandidates.map((candidate, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-2 bg-gray-100 text-gray-700 rounded-md"
            >
              <span>
                {candidate.party.name} - {candidate.member.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveCandidate(index)}
                className="px-2 py-1 text-sm text-white bg-red-600 rounded-md"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setShowAddCandidateDialog(true)}
          className="mt-2 px-4 py-2 text-sm text-white bg-green-600 rounded-md"
        >
          + Add Candidate
        </button>
      </div>

      {/* Current Districts */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700">Current Districts</h5>
        <ul className="space-y-2">
          {currentDistricts.map((district, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-2 bg-gray-100 text-gray-700 rounded-md"
            >
              <span>{district}</span>
              <button
                type="button"
                onClick={() => handleRemoveDistrict(district)}
                className="px-2 py-1 text-sm text-white bg-red-600 rounded-md"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setShowChooseDistrictDialog(true)}
          className="mt-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md"
        >
          + Add District
        </button>
      </div>

      {/* Save and Cancel Buttons */}
      <div className="flex justify-end mt-4 space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-white bg-red-600 rounded-md"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm text-white bg-green-600 rounded-md"
        >
          Save Constituency
        </button>
      </div>

      {/* Add Candidate Dialog */}
      {showAddCandidateDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-md w-96">
            <h5 className="text-lg font-medium text-gray-700 mb-4">Add Candidate</h5>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Select Party</label>
              <select
                value={selectedParty?.id || ""}
                onChange={(e) =>
                  handleSelectParty(
                    availableParties.find((party) => party.id === parseInt(e.target.value))
                  )
                }
                className="w-full px-4 py-2 mt-1 text-sm border rounded-md bg-white text-black"
              >
                <option value="">-- Select Party --</option>
                {availableParties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedParty && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Select Member</label>
                <select
                  value={selectedMember?.id || ""}
                  onChange={(e) =>
                    setSelectedMember(
                      partyMembers.find((member) => member.id === parseInt(e.target.value))
                    )
                  }
                  className="w-full px-4 py-2 mt-1 text-sm border rounded-md bg-white text-black"
                >
                  <option value="">-- Select Member --</option>
                  {partyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddCandidateDialog(false)}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCandidate}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md"
              >
                Add Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Choose District Dialog */}
      {showChooseDistrictDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-md w-96">
            <h5 className="text-lg font-medium text-gray-700 mb-4">Choose District</h5>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Select District</label>
              <select
                onChange={(e) => handleAddDistrict(e.target.value)}
                className="w-full px-4 py-2 mt-1 text-sm border rounded-md bg-white text-black"
              >
                <option value="">-- Select District --</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowChooseDistrictDialog(false)}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}