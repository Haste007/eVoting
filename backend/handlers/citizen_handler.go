package handlers

import (
	"encoding/base64"
	"log"
	"os"
	"path/filepath"

	"github.com/Haste007/E-Voting/Backend/utils"
	"github.com/gofiber/fiber/v2"
)

// CreateCitizen adds a new citizen
func CreateCitizen(c *fiber.Ctx) error {
	var citizen struct {
		Name     string `json:"name"`
		NID      string `json:"nid"`
		District string `json:"district"` // District name provided by the caller
		Face     string `json:"face"`     // Base64 encoded face image
	}

	if err := c.BodyParser(&citizen); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Find the district ID based on the district name
	var districtID int
	query := "SELECT id FROM districts WHERE name = $1"
	if err := utils.DB.QueryRow(query, citizen.District).Scan(&districtID); err != nil {
		log.Println("Error finding district:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid district name"})
	}

	// Decode the base64 face image
	decodedImage, err := base64.StdEncoding.DecodeString(citizen.Face)
	if err != nil {
		log.Println("Error decoding face image:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid face image"})
	}

	// Save the image to the images/citizen_images folder
	imagePath := filepath.Join("images", "citizen_images", citizen.NID+".jpg")
	if err := os.MkdirAll(filepath.Dir(imagePath), os.ModePerm); err != nil {
		log.Println("Error creating directory for face image:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save face image"})
	}

	if err := os.WriteFile(imagePath, decodedImage, 0644); err != nil {
		log.Println("Error saving face image:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save face image"})
	}

	// Insert the citizen into the citizens table
	insertQuery := "INSERT INTO citizens (name, nid, district_id, face) VALUES ($1, $2, $3, $4) RETURNING id"
	var citizenID int
	if err := utils.DB.QueryRow(insertQuery, citizen.Name, citizen.NID, districtID, imagePath).Scan(&citizenID); err != nil {
		log.Println("Error creating citizen:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create citizen"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id":       citizenID,
		"name":     citizen.Name,
		"nid":      citizen.NID,
		"district": citizen.District,
		"face":     imagePath,
	})
}

// UpdateCitizen updates an existing citizen by NID
func UpdateCitizen(c *fiber.Ctx) error {
	nid := c.Params("nid")
	var updatedCitizen struct {
		Name     string `json:"name"`
		District string `json:"district"` // District name provided by the caller
		Face     string `json:"face"`
	}

	if err := c.BodyParser(&updatedCitizen); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Find the district ID based on the district name
	var districtID int
	query := "SELECT id FROM districts WHERE name = $1"
	if err := utils.DB.QueryRow(query, updatedCitizen.District).Scan(&districtID); err != nil {
		log.Println("Error finding district:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid district name"})
	}

	// Update the citizen in the citizens table
	updateQuery := "UPDATE citizens SET name = $1, district_id = $2, face = $3 WHERE nid = $4"
	if _, err := utils.DB.Exec(updateQuery, updatedCitizen.Name, districtID, updatedCitizen.Face, nid); err != nil {
		log.Println("Error updating citizen:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update citizen"})
	}

	return c.JSON(fiber.Map{
		"name":     updatedCitizen.Name,
		"nid":      nid,
		"district": updatedCitizen.District,
		"face":     updatedCitizen.Face,
	})
}

// GetCitizen retrieves a citizen by NID
func GetCitizen(c *fiber.Ctx) error {
	nid := c.Params("nid")
	var citizen struct {
		ID         int    `json:"id"`
		Name       string `json:"name"`
		NID        string `json:"nid"`
		District   string `json:"district"`
		DistrictID int    `json:"district_id"`
		Face       string `json:"face"`
	}

	query := `
        SELECT c.id, c.name, c.nid,c.district_id, d.name AS district, c.face
        FROM citizens c
        LEFT JOIN districts d ON c.district_id = d.id
        WHERE c.nid = $1
    `
	if err := utils.DB.QueryRow(query, nid).Scan(&citizen.ID, &citizen.Name, &citizen.NID, &citizen.DistrictID, &citizen.District, &citizen.Face); err != nil {
		log.Println("Error fetching citizen:", err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Citizen not found"})
	}

	return c.JSON(citizen)
}

// GetAllCitizens retrieves all citizens
func GetAllCitizens(c *fiber.Ctx) error {
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
    `
	rows, err := utils.DB.Query(query)
	if err != nil {
		log.Println("Error fetching citizens:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch citizens"})
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
			log.Println("Error parsing citizen:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse citizens"})
		}
		citizens = append(citizens, citizen)
	}

	return c.JSON(citizens)
}

// DeleteCitizen deletes a citizen by NID
func DeleteCitizen(c *fiber.Ctx) error {
	nid := c.Params("nid")

	// Delete the citizen from the citizens table
	deleteQuery := "DELETE FROM citizens WHERE nid = $1"
	result, err := utils.DB.Exec(deleteQuery, nid)
	if err != nil {
		log.Println("Error deleting citizen:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete citizen"})
	}

	// Check if any row was affected
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Println("Error checking rows affected:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify deletion"})
	}
	if rowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Citizen not found"})
	}

	return c.JSON(fiber.Map{"message": "Citizen deleted successfully", "nid": nid})
}
