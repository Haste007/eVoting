package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/Haste007/E-Voting/Backend/utils"
	"github.com/gofiber/fiber/v2"
)

func AuthenticateCitizen(c *fiber.Ctx) error {
	var request struct {
		NID   string `json:"nid"`
		Image string `json:"image"` // Base64-encoded image from the client
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Retrieve the saved image path for the given NID
	var imagePath string
	query := "SELECT face FROM citizens WHERE nid = $1"
	if err := utils.DB.QueryRow(query, request.NID).Scan(&imagePath); err != nil {
		log.Println("Error fetching citizen image:", err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Citizen not found"})
	}

	log.Println("Image path retrieved from database:", imagePath)

	// Validate the file path
	if len(imagePath) == 0 || bytes.Contains([]byte(imagePath), []byte{0}) {
		log.Println("Invalid file path:", imagePath)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Invalid file path"})
	}

	// Check if the file exists
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		log.Println("File does not exist:", imagePath)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Image file not found"})
	} else if err != nil {
		log.Println("Error accessing file:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to access image file"})
	}
	// Read the saved image and convert it to base64
	imageData, err := os.ReadFile(imagePath)
	if err != nil {
		log.Println("Error reading saved image:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read saved image"})
	}
	imageBase64 := base64.StdEncoding.EncodeToString(imageData)
	// Prepare the payload for the authentication server
	payload := map[string]string{
		"image1": imageBase64,   // Base64-encoded image from the database
		"image2": request.Image, // Base64-encoded image from the client
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Println("Error creating payload:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create payload"})
	}

	// Send the payload to the authentication server
	resp, err := http.Post("http://localhost:8000/api/authenticate", "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		log.Println("Error sending request to authentication server:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to authenticate"})
	}
	defer resp.Body.Close()

	// Parse the response from the authentication server
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Error reading response from authentication server:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read authentication response"})
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		log.Println("Error parsing authentication response:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse authentication response"})
	}

	// Check the similarity index
	if similarity, ok := result["similarity_index"].(float64); ok && similarity > 0.5 {
		return c.JSON(fiber.Map{"message": "Authentication successful", "nid": request.NID})
	}

	return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Authentication failed", "details": result})
}
