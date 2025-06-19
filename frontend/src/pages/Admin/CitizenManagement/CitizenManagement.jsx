import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export function CitizenManagement() {
  const [citizens, setCitizens] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch citizens from the backend
  const fetchCitizens = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/citizens`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data === null || data.length === 0) {
          console.warn("No citizens found in the database.");
          setCitizens([]); // Set to an array with an empty object if no citizens
        } else {
          setCitizens(data);
        }
      } else {
        setError("Failed to fetch citizens.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    }
  };
  useEffect(() => {;
    fetchCitizens();
  }, []);

  // Handle removing a citizen
  const handleRemoveCitizen = async (nid) => {
    try {
      const response = await fetch(`${backendUrl}/api/citizens/${nid}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Citizen removed successfully!");
        await fetchCitizens(); // Reload the data from the API
      } else {
        setError("Failed to remove citizen.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    }
  };

  return (
    <div className="h-full">
      <h2 className="text-xl font-bold text-center text-white">
        Citizen Management
      </h2>
      <div className="mt-4 bg-white rounded-lg shadow-lg p-4 h-[80%] overflow-y-auto">
        {error && <p className="text-red-500 text-center">{error}</p>}
        {citizens.length > 0 ? (
          <ul className="space-y-4">
            {citizens.map((citizen) => (
              <li
                key={citizen.id}
                className="flex items-center justify-between p-4 bg-gray-100 rounded-md shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  {citizen.face ? (
                    <img
                      src={`${backendUrl}/${citizen.face}`} // Use the full URL for the image
                      alt={`${citizen.name}'s face`}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-300 border-2 border-gray-300">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="text-gray-600 text-xl"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      {citizen.name}
                    </p>
                    <p className="text-sm text-gray-600">NID: {citizen.nid}</p>
                    <p className="text-sm text-gray-600">
                      District: {citizen.district}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCitizen(citizen.nid)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-600">No citizens found.</p>
        )}
      </div>
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => navigate("/register")}
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Register
        </button>
      </div>
    </div>
  );
}