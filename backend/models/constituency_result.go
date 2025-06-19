package models

type ConstituencyResult struct {
	WinningParty string          `json:"winningParty"` // Name of the winning party
	TotalVotes   int             `json:"totalVotes"`   // Total votes cast in the constituency
	PartyVotes   map[int]int     `json:"partyVotes"`   // PartyID -> Votes received
	Votes        []Vote          `json:"votes"`        // List of all votes cast
	VoterHashes  map[string]bool `json:"-"`            // Map of hashed voter IDs to prevent double voting (not exposed in JSON)
}
