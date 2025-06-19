import React, { useEffect, useState } from "react";

function PartyEdit({ party, onClose, onPartyDeleted, onPartyUpdated }) {
  const [unassignedCitizens, setUnassignedCitizens] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(""); // For search input
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch unassigned citizens
  useEffect(() => {
    const fetchUnassignedCitizens = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/get-unassigned-citizens`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUnassignedCitizens(data || []);
        } else {
          setError("Failed to fetch unassigned citizens.");
          setUnassignedCitizens([]);
        }
      } catch (err) {
        setError("Unable to connect to the server.");
        setUnassignedCitizens([]);
      }
    };

    fetchUnassignedCitizens();
  }, []);

  // Handle adding a citizen to the party
  const handleAddCitizen = async (citizenId) => {
    try {
      const response = await fetch(`${backendUrl}/api/parties/add-citizen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ citizen_id: citizenId, party_id: party.id }),
      });

      if (response.ok) {
        alert("Citizen added to the party successfully!");
        setUnassignedCitizens((prev) => prev.filter((citizen) => citizen.id !== citizenId));
        onPartyUpdated();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to add citizen to the party.");
      }
    } catch (err) {
      alert("Unable to connect to the server.");
    }
  };

  // Handle deleting the party
  const handleDeleteParty = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this party?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${backendUrl}/api/parties/${party.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Party deleted successfully!");
        onPartyDeleted(party.id);
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete the party.");
      }
    } catch (err) {
      alert("Unable to connect to the server.");
    }
  };

  // Filter and truncate unassigned citizens for display
  const filteredCitizens = unassignedCitizens.filter(
    (citizen) =>
      citizen.name.toLowerCase().includes(search.toLowerCase()) ||
      citizen.nid.toLowerCase().includes(search.toLowerCase())
  );
  const truncatedCitizens = filteredCitizens.slice(0, 2);

  return (
    <div className="w-[90%] max-w-lg bg-green-600 rounded-lg shadow-lg p-6">
      {/* Party Logo and Name */}
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={party.icon || "/images/PakistanFlag.jpg"}
          alt={`${party.name} logo`}
          className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
        />
        <h2 className="text-xl font-bold text-gray-800">{party.name}</h2>
      </div>

      {/* Party President */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700">President</h3>
        <p className="text-white-600">{party.president}</p>
      </div>

      {/* Party Members */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700">Members</h3>
        <ul className="mt-2 space-y-2">
          {(party.members || []).map((member, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-2 bg-gray-100 rounded-md shadow-sm"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-300 border-2 border-gray-300">
                  <span className="text-gray-600 text-sm font-bold">
                    {member.name[0]}
                  </span>
                </div>
                <div>
                  <p className="text-gray-800 font-medium">{member.name}</p>
                  <p className="text-sm text-gray-600">NIN: {member.nid}</p>
                </div>
              </div>
            </li>
          ))}
          {(!party.members || party.members.length === 0) && (
            <p className="text-sm text-gray-600">No members found.</p>
          )}
        </ul>
      </div>

      {/* Unassigned Citizens */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700">Add Members</h3>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          placeholder="Search by name or NIN"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 mb-2 border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
        />
        <ul
          className="space-y-2 max-h-32 overflow-y-auto"
          style={{ minHeight: "48px" }}
        >
          {truncatedCitizens.map((citizen) => (
            <li
              key={citizen.id}
              className="flex items-center justify-between p-2 bg-gray-100 rounded-md shadow-sm"
            >
              <div>
                <p className="text-gray-800 font-medium">{citizen.name}</p>
                <p className="text-sm text-gray-600">NIN: {citizen.nid}</p>
              </div>
              <button
                onClick={() => handleAddCitizen(citizen.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </li>
          ))}
          {truncatedCitizens.length === 0 && (
            <li className="text-sm text-gray-600">No unassigned citizens found.</li>
          )}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleDeleteParty}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Delete Party
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export { PartyEdit };