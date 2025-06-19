package handlers

import (
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
)

type AdminLoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AdminLoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

func AdminLoginHandler(c *fiber.Ctx) error {
	var req AdminLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(AdminLoginResponse{Success: false, Message: "Invalid request body"})
	}

	// For security, use environment variables for admin credentials
	adminUser := os.Getenv("ADMIN_USER")
	adminPass := os.Getenv("ADMIN_PASS")

	if req.Username == adminUser && req.Password == adminPass {
		return c.JSON(AdminLoginResponse{Success: true})
	}
	return c.Status(http.StatusUnauthorized).JSON(AdminLoginResponse{Success: false, Message: "Invalid credentials"})
}
