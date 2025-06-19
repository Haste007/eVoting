import React, { useState, useEffect } from "react";
import { CardLayout } from "../../components/CardLayout";

function Voting() {
  const [elections, setElections] = useState([]); // Initialize as an empty array
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voteCast, setVoteCast] = useState(false);
  const [error, setError] = useState("");

  const citizenID = localStorage.getItem("citizenId");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;


  // Fetch ongoing elections
  useEffect(() => {
    const fetchElections = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/voting/ongoing-elections`);
        if (!response.ok) throw new Error("Failed to fetch ongoing elections");
        const data = await response.json();
        setElections(data || []); // Ensure data is an array
      } catch (err) {
        setError(err.message);
      }
    };

    fetchElections();
  }, []);

  // Fetch constituency data for the selected election
  const fetchConstituencyData = async (election) => {
    try {
      const citizenResponse = await fetch(`${backendUrl}/api/citizens/${citizenID}`);
      if (!citizenResponse.ok) throw new Error("Failed to fetch citizen data");
      const citizenData = await citizenResponse.json();
      const districtID = citizenData.district_id;

      const response = await fetch(
        `${backendUrl}/api/voting/constituency/${election.id}/${districtID}`
      );
      if (!response.ok) throw new Error("Failed to fetch constituency data");
      const data = await response.json();
      setCandidates(data || []); // Ensure data is an array
      setSelectedElection(election);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVote = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const confirmVote = async () => {
    try {
      const votePayload = {
        electionId: selectedElection.id,
        constituencyId: selectedCandidate.constituency_id,
        partyId: selectedCandidate.party_id,
        voterId: citizenID,
      };

      const response = await fetch(`${backendUrl}/api/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(votePayload),
      });

      if (!response.ok) throw new Error("Failed to cast vote");

      setVoteCast(true);
      setSelectedCandidate(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelVote = () => {
    setSelectedCandidate(null);
  };

  if (!elections) {
    return (
      <CardLayout>
        <h1 className="text-2xl font-bold text-center text-white">Voting</h1>
        <div className="mt-6 p-4 bg-gray-200 text-gray-800 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-bold">No Elections Currently Occurring</h3>
          <p>Please check back later for ongoing elections.</p>
        </div>
      </CardLayout>
    );
  }

  return (
    <CardLayout>
      <h1 className="text-2xl font-bold text-center text-white">Voting</h1>
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      {elections.length > 0 ? (
        <div className="mt-6">
          <div className="flex space-x-4 overflow-x-auto">
            {elections.map((election) => (
              <button
                key={election.id}
                onClick={() => fetchConstituencyData(election)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  selectedElection?.id === election.id
                    ? "bg-green-700 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {election.name}
              </button>
            ))}
          </div>

          {selectedElection && candidates.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-center text-white">
                {candidates[0].constituency_name}
              </h2>

              {voteCast ? (
                <div className="mt-6 p-4 bg-green-700 text-white rounded-lg shadow-md text-center">
                  <h3 className="text-lg font-bold">Vote Casted</h3>
                  <p>Thank you for voting!</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.party_id}
                      className="p-4 bg-green-700 rounded-lg shadow-md text-white flex items-center justify-between cursor-pointer hover:bg-green-800"
                      onClick={() => handleVote(candidate)}
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={backendUrl + '/' + candidate.party_logo || "images/PakistanFlag.jpg"}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white"
                                                  />
                        <div>
                          <p className="text-lg font-bold">{candidate.candidate_name}</p>
                          <p className="text-sm">Party: {candidate.party_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 p-4 bg-gray-200 text-gray-800 rounded-lg shadow-md text-center">
              <h3 className="text-lg font-bold">Voting Home Screen</h3>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 p-4 bg-gray-200 text-gray-800 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-bold">No Elections Currently Occurring</h3>
          <p>Please check back later for ongoing elections.</p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {selectedCandidate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-gray-800">Confirm Your Vote</h3>
            <p className="mt-2 text-gray-600">
              Are you sure you want to vote for{" "}
              <span className="font-semibold">{selectedCandidate.candidate_name}</span> (
              {selectedCandidate.party_name})?
            </p>
            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={cancelVote}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmVote}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-md hover:bg-green-800"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </CardLayout>
  );
}

export { Voting };