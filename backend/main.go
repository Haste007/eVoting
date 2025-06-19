package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"

	"github.com/Haste007/E-Voting/Backend/routes"
	"github.com/Haste007/E-Voting/Backend/utils"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Initialize Fiber app
	app := fiber.New()

	// Middleware
	app.Use(logger.New()) // Logs requests
	app.Use(cors.New())   // Enables CORS

	// Connect to the database
	if err := utils.ConnectDB(); err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}

	// Serve static files (frontend)
	// app.Static("/", "./public")
	app.Static("/images", "./images")

	// API Routes
	routes.RegisterRoutes(app)

	// Start the server
	log.Fatal(app.Listen(":5000"))
}
