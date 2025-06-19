package models

type Citizen struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	NID      string `json:"nid"`      // National Identity Number
	District string `json:"district"` // District (address)
	Face     string `json:"face"`     // Path to the citizen's face image
}
