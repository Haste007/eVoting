import React, { useState } from "react";
import {ElectionManagement} from "./ElectionManagement/ElectionManagement";
import {PartyManagement} from "./PartyManagement/PartyManagement";
import {CitizenManagement} from "./CitizenManagement/CitizenManagement";

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("election"); // Default tab
  const [citizens, setCitizens] = useState([]); // No dummy data

  const handleRemoveCitizen = (id) => {
    // Remove the citizen from the list
    setCitizens((prevCitizens) => prevCitizens.filter((citizen) => citizen.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case "election":
        return <ElectionManagement />;
      case "party":
        return <PartyManagement />;
      case "citizen":
        return (
          <CitizenManagement
            citizens={citizens}
            handleRemoveCitizen={handleRemoveCitizen}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-800 via-green-900 to-black">
      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-[95%] h-[95%] bg-gradient-to-br from-green-300 via-green-400 to-green-500 rounded-lg shadow-lg p-6 overflow-hidden">
          {/* Internal Scrollable Content */}
          <div className="h-full overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Bottom Navbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-green-700 via-green-800 to-green-900">
        <div className="flex justify-around py-2">
          <button
            onClick={() => setActiveTab("election")}
            className={`text-white px-4 py-2 ${
              activeTab === "election" ? "font-bold underline" : ""
            }`}
          >
            Election Management
          </button>
          <button
            onClick={() => setActiveTab("party")}
            className={`text-white px-4 py-2 ${
              activeTab === "party" ? "font-bold underline" : ""
            }`}
          >
            Party Management
          </button>
          <button
            onClick={() => setActiveTab("citizen")}
            className={`text-white px-4 py-2 ${
              activeTab === "citizen" ? "font-bold underline" : ""
            }`}
          >
            Citizen Management
          </button>
        </div>
      </div>
    </div>
  );
}

export { AdminPanel };