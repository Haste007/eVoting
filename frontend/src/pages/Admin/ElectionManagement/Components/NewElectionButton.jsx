import React from "react";

export function NewElectionButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
    >
      Add New Election
    </button>
  );
}