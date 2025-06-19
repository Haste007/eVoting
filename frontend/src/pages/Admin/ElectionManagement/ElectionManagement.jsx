import React, { useState } from "react";
import { UpcomingElections } from "./Components/UpcomingElections";
import { NewElectionButton } from "./Components/NewElectionButton";
import { PreviousElectionsButton } from "./Components/PreviousElectionsButton";
import { NewElection } from "./Components/NewElection";
import { PreviousElections } from "./Components/PreviousElections";

export function ElectionManagement() {
  const [view, setView] = useState("default"); // "new", "previous", or "default"

  return (
    <div>
      <h2 className="text-xl font-bold text-center text-white mb-6">
        Election Management
      </h2>

      {view === "default" && (
        <>
          {/* Upcoming Elections */}
          <UpcomingElections />

          {/* Buttons for New Election and Previous Elections */}
          <div className="mt-6 flex justify-center space-x-4">
            <NewElectionButton onClick={() => setView("new")} />
            <PreviousElectionsButton onClick={() => setView("previous")} />
          </div>
        </>
      )}

      {view === "new" && <NewElection onBack={() => setView("default")} />}
      {view === "previous" && <PreviousElections onBack={() => setView("default")} />}
    </div>
  );
}