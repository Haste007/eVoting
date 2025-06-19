package handlers

import (
	"encoding/base64"
	"log"
	"os"
	"path/filepath"

	"github.com/Haste007/E-Voting/Backend/models"
	"github.com/Haste007/E-Voting/Backend/utils"
	"github.com/gofiber/fiber/v2"
)

// CreateParty adds a new party
func CreateParty(c *fiber.Ctx) error {
	var request struct {
		Name      string `json:"name"`
		Logo      string `json:"logo"` // Base64 encoded logo image
		President int    `json:"president"`
		Members   []int  `json:"members"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Decode the base64 logo image
	decodedLogo, err := base64.StdEncoding.DecodeString(request.Logo)
	if err != nil {
		log.Println("Error decoding logo image:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid logo image"})
	}

	// Save the logo image to the images/party_logos folder
	logoPath := filepath.Join("images", "party_logos", request.Name+".jpg")
	if err := os.MkdirAll(filepath.Dir(logoPath), os.ModePerm); err != nil {
		log.Println("Error creating directory for logo image:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save logo"})
	}

	if err := os.WriteFile(logoPath, decodedLogo, 0644); err != nil {
		log.Println("Error saving logo image:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save logo image"})
	}

	// Insert the party into the database
	var partyID int
	query := "INSERT INTO parties (name, logo, president) VALUES ($1, $2, $3) RETURNING id"
	if err := utils.DB.QueryRow(query, request.Name, logoPath, request.President).Scan(&partyID); err != nil {
		log.Println("Error creating party:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create party"})
	}

	// Add the president as a member of the party
	leaderQuery := "INSERT INTO party_members (party_id, citizen_id) VALUES ($1, $2)"
	if _, err := utils.DB.Exec(leaderQuery, partyID, request.President); err != nil {
		log.Println("Error adding president as a member:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add president as a member of the party"})
	}

	// Add other members to the party
	for _, memberID := range request.Members {
		memberQuery := "INSERT INTO party_members (party_id, citizen_id) VALUES ($1, $2)"
		if _, err := utils.DB.Exec(memberQuery, partyID, memberID); err != nil {
			log.Println("Error adding member to party:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add members to party"})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id":        partyID,
		"name":      request.Name,
		"logo":      logoPath,
		"president": request.President,
	})
}

// UpdateParty updates an existing party
func UpdateParty(c *fiber.Ctx) error {
	id := c.Params("id")
	var updatedParty models.Party
	if err := c.BodyParser(&updatedParty); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	query := "UPDATE parties SET name = $1, logo = $2, president = $3 WHERE id = $4"
	if _, err := utils.DB.Exec(query, updatedParty.Name, updatedParty.Logo, updatedParty.President, id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update party"})
	}

	return c.JSON(updatedParty)
}

// DeleteParty removes a party by ID
func DeleteParty(c *fiber.Ctx) error {
	id := c.Params("id")
	query := "DELETE FROM parties WHERE id = $1"
	if _, err := utils.DB.Exec(query, id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete party"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// AddCitizenToParty adds a citizen to a party
func AddCitizenToParty(c *fiber.Ctx) error {
	var request struct {
		CitizenID int `json:"citizen_id"`
		PartyID   int `json:"party_id"`
	}

	// Parse the request body
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Check if the citizen is already part of a party
	var existingPartyID int
	checkQuery := "SELECT party_id FROM party_members WHERE citizen_id = $1"
	err := utils.DB.QueryRow(checkQuery, request.CitizenID).Scan(&existingPartyID)
	if err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Citizen is already part of a party"})
	}

	// Add the citizen to the party
	insertQuery := "INSERT INTO party_members (party_id, citizen_id) VALUES ($1, $2)"
	_, err = utils.DB.Exec(insertQuery, request.PartyID, request.CitizenID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add citizen to party"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Citizen added to party successfully"})
}

// GetUnassignedCitizens fetches citizens not already part of a party
func GetUnassignedCitizens(c *fiber.Ctx) error {
	var citizens []struct {
		ID       int    `json:"id"`
		Name     string `json:"name"`
		NID      string `json:"nid"`
		District string `json:"district"`
		Face     string `json:"face"`
	}

	query := `
        SELECT c.id, c.name, c.nid, d.name AS district, c.face
        FROM citizens c
        LEFT JOIN districts d ON c.district_id = d.id
        WHERE c.id NOT IN (SELECT citizen_id FROM party_members)
    `
	rows, err := utils.DB.Query(query)
	if err != nil {
		log.Println("Error fetching unassigned citizens:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch unassigned citizens"})
	}
	defer rows.Close()

	for rows.Next() {
		var citizen struct {
			ID       int    `json:"id"`
			Name     string `json:"name"`
			NID      string `json:"nid"`
			District string `json:"district"`
			Face     string `json:"face"`
		}
		if err := rows.Scan(&citizen.ID, &citizen.Name, &citizen.NID, &citizen.District, &citizen.Face); err != nil {
			log.Println("Error parsing citizen row:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse citizens"})
		}
		citizens = append(citizens, citizen)
	}

	return c.JSON(citizens)
}

// GetParties fetches all parties and their members
func GetParties(c *fiber.Ctx) error {
	var parties []struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		Logo      string `json:"logo"`
		President string `json:"president"` // Fetch president's name
		Members   []struct {
			ID       int    `json:"id"`
			Name     string `json:"name"`
			NID      string `json:"nid"`
			District string `json:"district"`
			Face     string `json:"face"`
		} `json:"members"`
	}

	// Fetch all parties with the president's name
	partyQuery := `
        SELECT p.id, p.name, p.logo, c.name AS president
        FROM parties p
        JOIN citizens c ON p.president = c.id
    `
	rows, err := utils.DB.Query(partyQuery)
	if err != nil {
		log.Println("Error fetching parties:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch parties"})
	}
	defer rows.Close()

	for rows.Next() {
		var party struct {
			ID        int    `json:"id"`
			Name      string `json:"name"`
			Logo      string `json:"logo"`
			President string `json:"president"`
			Members   []struct {
				ID       int    `json:"id"`
				Name     string `json:"name"`
				NID      string `json:"nid"`
				District string `json:"district"`
				Face     string `json:"face"`
			} `json:"members"`
		}

		if err := rows.Scan(&party.ID, &party.Name, &party.Logo, &party.President); err != nil {
			log.Println("Error parsing party row:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse parties"})
		}

		// Fetch members for each party
		memberQuery := `
            SELECT c.id, c.name, c.nid, d.name AS district, c.face
            FROM citizens c
            LEFT JOIN districts d ON c.district_id = d.id
            JOIN party_members pm ON c.id = pm.citizen_id
            WHERE pm.party_id = $1
        `
		memberRows, err := utils.DB.Query(memberQuery, party.ID)
		if err != nil {
			log.Println("Error fetching party members:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch party members"})
		}
		defer memberRows.Close()

		for memberRows.Next() {
			var member struct {
				ID       int    `json:"id"`
				Name     string `json:"name"`
				NID      string `json:"nid"`
				District string `json:"district"`
				Face     string `json:"face"`
			}
			if err := memberRows.Scan(&member.ID, &member.Name, &member.NID, &member.District, &member.Face); err != nil {
				log.Println("Error parsing party member row:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse party members"})
			}
			party.Members = append(party.Members, member)
		}

		parties = append(parties, party)
	}

	return c.JSON(parties)
}

// GetParty retrieves a party by ID
func GetParty(c *fiber.Ctx) error {
	id := c.Params("id")
	var party struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		Logo      string `json:"logo"`
		President string `json:"president"`
		Members   []struct {
			ID       int    `json:"id"`
			Name     string `json:"name"`
			NID      string `json:"nid"`
			District string `json:"district"`
			Face     string `json:"face"`
		} `json:"members"`
	}

	// Fetch the party with the president's name
	partyQuery := `
        SELECT p.id, p.name, p.logo, c.name AS president
        FROM parties p
        JOIN citizens c ON p.president = c.id
        WHERE p.id = $1
    `
	if err := utils.DB.QueryRow(partyQuery, id).Scan(&party.ID, &party.Name, &party.Logo, &party.President); err != nil {
		log.Println("Error fetching party:", err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Party not found"})
	}

	// Fetch members for the party
	memberQuery := `
        SELECT c.id, c.name, c.nid, d.name AS district, c.face
        FROM citizens c
        LEFT JOIN districts d ON c.district_id = d.id
        JOIN party_members pm ON c.id = pm.citizen_id
        WHERE pm.party_id = $1
    `
	memberRows, err := utils.DB.Query(memberQuery, party.ID)
	if err != nil {
		log.Println("Error fetching party members:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch party members"})
	}
	defer memberRows.Close()

	for memberRows.Next() {
		var member struct {
			ID       int    `json:"id"`
			Name     string `json:"name"`
			NID      string `json:"nid"`
			District string `json:"district"`
			Face     string `json:"face"`
		}
		if err := memberRows.Scan(&member.ID, &member.Name, &member.NID, &member.District, &member.Face); err != nil {
			log.Println("Error parsing party member row:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse party members"})
		}
		party.Members = append(party.Members, member)
	}

	return c.JSON(party)
}
