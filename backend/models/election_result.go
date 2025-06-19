package models

type ElectionResult struct {
	TotalVotes          int                        `json:"totalVotes"`          // Total number of votes cast
	ConstituencyResults map[int]ConstituencyResult `json:"constituencyResults"` // ConstituencyID -> ConstituencyResult
}
