package models

type Election struct {
	ID             int             `json:"id"`
	Name           string          `json:"name"`           // Name of the election
	Date           string          `json:"date"`           // Date of the election
	Constituencies []Constituency  `json:"constituencies"` // List of constituencies
	Parties        []Party         `json:"parties"`        // List of participating parties
	Results        *ElectionResult `json:"results"`        // Election results (optional)
}
