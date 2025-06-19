package models

type Constituency struct {
	ID              int            `json:"id"`
	Name            string         `json:"name"`            // Name of the constituency (e.g., NA-1)
	Districts       []string       `json:"districts"`       // List of districts covered by the constituency
	Representatives map[int]string `json:"representatives"` // PartyID -> Representative name
}
