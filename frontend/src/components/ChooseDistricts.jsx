import React, { useState } from "react";

export function ChooseDistricts({ availableDistricts, onAddDistrict }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter districts based on the search term
  const filteredDistricts = availableDistricts.filter((district) =>
    district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 p-4 rounded-md shadow-md">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Choose Districts</h4>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search districts..."
        className="w-full px-4 py-2 mb-4 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
      />
      <ul className="max-h-40 overflow-y-auto space-y-2">
        {filteredDistricts.map((district) => (
          <li
            key={district}
            className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm"
          >
            <span className="text-sm text-gray-700">{district}</span>
            <button
              type="button"
              onClick={() => onAddDistrict(district)}
              className="px-2 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}