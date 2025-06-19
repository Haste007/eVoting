package models

type Party struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Logo      string    `json:"logo"`      // Path to the party's logo
	President string    `json:"president"` // Name of the party president
	Members   []Citizen `json:"members"`   // List of party members (citizens)
}
