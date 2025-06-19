import React, { useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export function AddParty({ onClose, onPartyAdded }) {
  const [unassignedCitizens, setUnassignedCitizens] = useState([]);
  const [filteredCitizens, setFilteredCitizens] = useState([]);
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [logoBase64, setLogoBase64] = useState(""); // State to store the base64 logo

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
          setUnassignedCitizens(data);
          setFilteredCitizens(data); // Initialize filtered list
        } else {
          setError("Failed to fetch unassigned citizens.");
        }
      } catch (err) {
        setError("Unable to connect to the server.");
      }
    };

    fetchUnassignedCitizens();
  }, []);

  // Filter citizens based on search term
  useEffect(() => {
    const filtered = unassignedCitizens.filter((citizen) =>
      citizen.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCitizens(filtered);
  }, [searchTerm, unassignedCitizens]);

  // Handle image upload and convert to base64
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result.split(",")[1]); // Extract base64 string (after the comma)
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (!selectedLeader) {
      alert("Please select a party leader.");
      return;
    }

    if (!logoBase64) {
      alert("Please upload a party logo.");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/parties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          logo: logoBase64, // Send the base64-encoded logo
          president: selectedLeader.id,
          members: [], // No members added during creation
        }),
      });

      if (response.ok) {
        const newParty = await response.json();
        onPartyAdded(newParty);
        onClose();
      } else {
        alert("Failed to add party.");
      }
    } catch (err) {
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-green-600 rounded-lg shadow-lg p-6 w-[90%] max-w-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Party</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Party Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
              placeholder="Enter party name"
            />
          </div>
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
              Party Logo
            </label>
            <input
              type="file"
              id="logo"
              name="logo"
              accept="image/*"
              onChange={handleLogoUpload}
              className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
            />
            {logoBase64 && (
              <p className="text-sm text-green-500 mt-2">Logo uploaded successfully!</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Party Leader</label>
            <input
              type="text"
              placeholder="Search for a leader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
            />
            <ul className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {filteredCitizens.map((citizen) => (
                <li
                  key={citizen.id}
                  className={`p-2 rounded-md cursor-pointer ${
                    selectedLeader?.id === citizen.id ? "bg-green-300" : "bg-gray-100"
                  }`}
                  onClick={() => setSelectedLeader(citizen)}
                >
                  <p className="text-gray-800 font-medium">{citizen.name}</p>
                  <p className="text-sm text-gray-600">NIN: {citizen.nid}</p>
                </li>
              ))}
              {filteredCitizens.length === 0 && (
                <p className="text-sm text-gray-600">No citizens found.</p>
              )}
            </ul>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Add Party
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}