package handlers

import (
	"github.com/Haste007/E-Voting/Backend/models"
	"github.com/Haste007/E-Voting/Backend/utils"
	"github.com/gofiber/fiber/v2"
)

// CreateConstituency adds a new constituency
func CreateConstituency(c *fiber.Ctx) error {
	var constituency models.Constituency
	if err := c.BodyParser(&constituency); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	query := "INSERT INTO constituencies (name, districts) VALUES ($1, $2) RETURNING id"
	if err := utils.DB.QueryRow(query, constituency.Name, constituency.Districts).Scan(&constituency.ID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create constituency"})
	}

	return c.Status(fiber.StatusCreated).JSON(constituency)
}

// GetConstituency retrieves a constituency by ID
func GetConstituency(c *fiber.Ctx) error {
	id := c.Params("id")
	var constituency models.Constituency
	query := "SELECT id, name, districts FROM constituencies WHERE id = $1"
	if err := utils.DB.QueryRow(query, id).Scan(&constituency.ID, &constituency.Name, &constituency.Districts); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Constituency not found"})
	}

	return c.JSON(constituency)
}

// UpdateConstituency updates an existing constituency
func UpdateConstituency(c *fiber.Ctx) error {
	id := c.Params("id")
	var updatedConstituency models.Constituency
	if err := c.BodyParser(&updatedConstituency); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	query := "UPDATE constituencies SET name = $1, districts = $2 WHERE id = $3"
	if _, err := utils.DB.Exec(query, updatedConstituency.Name, updatedConstituency.Districts, id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update constituency"})
	}

	return c.JSON(updatedConstituency)
}

// DeleteConstituency removes a constituency by ID
func DeleteConstituency(c *fiber.Ctx) error {
	id := c.Params("id")
	query := "DELETE FROM constituencies WHERE id = $1"
	if _, err := utils.DB.Exec(query, id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete constituency"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
