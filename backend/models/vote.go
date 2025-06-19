package models

type Vote struct {
	PartyID int    `json:"partyId"` // ID of the party receiving the vote
	Time    string `json:"time"`    // Timestamp of the vote
}
