import React, { useEffect, useState } from "react";
import { PartyEdit } from "./Components/PartyEdit";
import { AddParty } from "./Components/AddParty";



export function PartyManagement() {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showAddPartyForm, setShowAddPartyForm] = useState(false);
  const [error, setError] = useState("");
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  const refreshParties = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/parties`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (response.ok) {
        const data = await response.json();
        setParties(data || []);
      } else {
        setError("Failed to fetch parties.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    }
  };

  // Fetch parties and their members from the backend
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
          setParties(data || []);
        } else {
          setError("Failed to fetch parties.");
        }
      } catch (err) {
        setError("Unable to connect to the server.");
      }
    };

    fetchParties();
  }, []);

  const handleEditParty = (party) => {
    setSelectedParty(party);
  };

  const handleCloseDialog = () => {
    setSelectedParty(null);
    refreshParties(); // Refresh the parties to ensure updated data
  };

  const handlePartyAdded = (newParty) => {
    refreshParties();
    };

  return (
    <div>
      <h2 className="text-xl font-bold text-center text-white">Party Management</h2>
      <div className="mt-4 bg-white rounded-lg shadow-lg p-4 h-[80%] overflow-y-auto">
        {error && <p className="text-red-500 text-center">{error}</p>}
        {parties.length > 0 ? (
          <ul className="space-y-4">
            {parties.map((party) => (
              <li
                key={party.id}
                className="flex items-center justify-between p-4 bg-gray-100 rounded-md shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={party.logo || "/images/PakistanFlag.jpg"}
                    alt={`${party.name} logo`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = "/images/PakistanFlag.jpg"; // Fallback to default image
                    }}
                  />
                  <div>
                    <p className="text-lg font-bold text-gray-800">{party.name}</p>
                    <p className="text-sm text-gray-600">President: {party.president}</p>
                    <p className="text-sm text-gray-600">
                      Members:{" "}
                      {(party.members || []).map((member) => member.name).join(", ") || "None"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditParty(party)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-600">No parties found.</p>
        )}
      </div>

      {/* Add New Party Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => setShowAddPartyForm(true)}
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Add New Party
        </button>
      </div>

      {/* Add Party Form */}
      {showAddPartyForm && (
        <AddParty
          onClose={() => setShowAddPartyForm(false)}
          onPartyAdded={handlePartyAdded}
        />
      )}

      {/* Party Edit Dialog */}
      {selectedParty && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <PartyEdit
          party={selectedParty}
          onClose={handleCloseDialog}
          onPartyDeleted={(deletedPartyId) => {
            setParties((prevParties) => prevParties.filter((party) => party.id !== deletedPartyId));
            setSelectedParty(null);
          }}
          onPartyUpdated={refreshParties} // Refresh parties when updated
        />
      </div>
      )}
    </div>
  );
}