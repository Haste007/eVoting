import React from "react";

function CardLayout({ children }) {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-300 via-green-400 to-green-500">
      <div className="w-full max-w-md p-6 bg-green-600 rounded-lg shadow-lg">
        {children}
      </div>
    </div>
  );
}

export { CardLayout };