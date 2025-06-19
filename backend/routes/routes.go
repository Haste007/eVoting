package routes

import (
	"github.com/Haste007/E-Voting/Backend/handlers"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app *fiber.App) {
	// Citizen routes
	app.Post("/api/citizens", handlers.CreateCitizen)
	app.Get("/api/citizens/:nid", handlers.GetCitizen)       // Use NID instead of ID
	app.Put("/api/citizens/:nid", handlers.UpdateCitizen)    // Use NID instead of ID
	app.Delete("/api/citizens/:nid", handlers.DeleteCitizen) // Use NID instead of ID
	app.Get("/api/citizens", handlers.GetAllCitizens)
	app.Get("/api/get-unassigned-citizens", handlers.GetUnassignedCitizens)

	// Party routes
	app.Post("/api/parties", handlers.CreateParty)
	app.Get("/api/parties/:id", handlers.GetParty)
	app.Put("/api/parties/:id", handlers.UpdateParty)
	app.Delete("/api/parties/:id", handlers.DeleteParty)
	app.Post("/api/parties/add-citizen", handlers.AddCitizenToParty)
	app.Get("/api/parties", handlers.GetParties)

	// Election routes
	app.Post("/api/elections", handlers.CreateElection)
	app.Get("/api/elections/:id", handlers.GetElection)
	app.Get("/api/upcomming-elections", handlers.GetUpcomingElections)
	app.Get("/api/past-elections", handlers.GetPastElections) // New route for past elections
	app.Put("/api/elections/:id", handlers.UpdateElection)
	app.Delete("/api/elections/:id", handlers.DeleteElection)
	app.Post("/api/elections/:id/start", handlers.StartElection)
	app.Post("/api/elections/:id/end", handlers.EndElection)

	// Constituency routes
	app.Post("/api/constituencies", handlers.CreateConstituency)
	app.Get("/api/constituencies/:id", handlers.GetConstituency)
	app.Put("/api/constituencies/:id", handlers.UpdateConstituency)
	app.Delete("/api/constituencies/:id", handlers.DeleteConstituency)

	// Vote routes
	app.Post("/api/votes", handlers.CastVote)
	app.Get("/api/voting/ongoing-elections", handlers.GetOngoingElections)                    // Get all ongoing elections
	app.Get("/api/voting/constituency/:electionId/:districtId", handlers.GetConstituencyData) // Get constituency data for a specific election and district

	// Authentication route
	app.Post("/api/authenticate", handlers.AuthenticateCitizen) // New route for authentication

	// Register admin login route
	app.Post("/api/admin/login", handlers.AdminLoginHandler)

}
