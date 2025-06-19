import React from "react";

export function PreviousElectionsButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
    >
      View Previous Elections
    </button>
  );
}