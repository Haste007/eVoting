package handlers

import (
	"log"

	"github.com/Haste007/E-Voting/Backend/utils"
	"github.com/gofiber/fiber/v2"
)

// CreateElection adds a new election
func CreateElection(c *fiber.Ctx) error {
	var request struct {
		Name           string `json:"name"`
		Constituencies []struct {
			Name       string   `json:"name"`
			Districts  []string `json:"districts"`
			Candidates []struct {
				PartyID   int `json:"party_id"`
				CitizenID int `json:"citizen_id"`
			} `json:"candidates"`
		} `json:"constituencies"`
	}

	// Parse and validate the request body
	if err := c.BodyParser(&request); err != nil {
		log.Println("Error parsing request:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	if request.Name == "" || len(request.Constituencies) == 0 {
		log.Println("Invalid election structure: Missing name or constituencies")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid election structure"})
	}

	// Save constituencies and get their IDs
	constituencyIDs := make(map[string]int)
	for _, constituency := range request.Constituencies {
		if constituency.Name == "" || len(constituency.Districts) == 0 {
			log.Printf("Invalid constituency structure: %+v\n", constituency)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid constituency structure"})
		}

		var constituencyID int
		query := `
            INSERT INTO constituencies (name)
            VALUES ($1)
            RETURNING id
        `
		if err := utils.DB.QueryRow(query, constituency.Name).Scan(&constituencyID); err != nil {
			log.Println("Error saving constituency:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save constituency"})
		}
		constituencyIDs[constituency.Name] = constituencyID

		// Link districts to the constituency
		for _, districtName := range constituency.Districts {
			var districtID int
			districtQuery := "SELECT id FROM districts WHERE name = $1"
			if err := utils.DB.QueryRow(districtQuery, districtName).Scan(&districtID); err != nil {
				log.Println("Error finding district:", err)
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid district name"})
			}

			linkQuery := `
                INSERT INTO constituency_districts (constituency_id, district_id)
                VALUES ($1, $2)
            `
			if _, err := utils.DB.Exec(linkQuery, constituencyID, districtID); err != nil {
				log.Println("Error linking district to constituency:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to link district to constituency"})
			}
		}
	}

	// Save the election and get its ID
	var electionID int
	electionQuery := `
        INSERT INTO elections (name, date)
        VALUES ($1, NOW())
        RETURNING id
    `
	if err := utils.DB.QueryRow(electionQuery, request.Name).Scan(&electionID); err != nil {
		log.Println("Error saving election:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save election"})
	}

	// Link the election with constituencies and save candidates
	for _, constituency := range request.Constituencies {
		constituencyID := constituencyIDs[constituency.Name]

		// Link the election with the constituency
		linkQuery := `
            INSERT INTO election_constituencies (election_id, constituency_id)
            VALUES ($1, $2)
        `
		if _, err := utils.DB.Exec(linkQuery, electionID, constituencyID); err != nil {
			log.Println("Error linking election with constituency:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to link election with constituencies"})
		}

		// Save candidates for the constituency
		for _, candidate := range constituency.Candidates {
			candidateQuery := `
                INSERT INTO candidates (party_id, citizen_id, constituency_id)
                VALUES ($1, $2, $3)
            `
			if _, err := utils.DB.Exec(candidateQuery, candidate.PartyID, candidate.CitizenID, constituencyID); err != nil {
				log.Println("Error saving candidate:", err, "\n", "query: ", candidateQuery, candidate.PartyID, candidate.CitizenID, constituencyID)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save candidate"})
			}
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"id": electionID, "message": "Election created successfully"})
}

// GetElection retrieves an election by ID
func GetElection(c *fiber.Ctx) error {
	id := c.Params("id")
	var election struct {
		ID             int    `json:"id"`
		Name           string `json:"name"`
		Date           string `json:"date"`
		TimeLimit      int    `json:"time_limit"`
		Started        bool   `json:"started"`
		Constituencies []struct {
			ID         int    `json:"id"`
			Name       string `json:"name"`
			Candidates []struct {
				PartyID   int `json:"party_id"`
				CitizenID int `json:"citizen_id"`
			} `json:"candidates"`
		} `json:"constituencies"`
	}

	// Fetch election details
	query := `
        SELECT id, name, date, time_limit, started
        FROM elections
        WHERE id = $1
    `
	if err := utils.DB.QueryRow(query, id).Scan(&election.ID, &election.Name, &election.Date, &election.TimeLimit, &election.Started); err != nil {
		log.Println("Error fetching election:", err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Election not found"})
	}

	// Fetch constituencies for the election
	constituencyQuery := `
        SELECT c.id, c.name
        FROM constituencies c
        JOIN election_constituencies ec ON c.id = ec.constituency_id
        WHERE ec.election_id = $1
    `
	rows, err := utils.DB.Query(constituencyQuery, id)
	if err != nil {
		log.Println("Error fetching constituencies:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch constituencies"})
	}
	defer rows.Close()

	for rows.Next() {
		var constituency struct {
			ID         int    `json:"id"`
			Name       string `json:"name"`
			Candidates []struct {
				PartyID   int `json:"party_id"`
				CitizenID int `json:"citizen_id"`
			} `json:"candidates"`
		}
		if err := rows.Scan(&constituency.ID, &constituency.Name); err != nil {
			log.Println("Error parsing constituency row:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse constituencies"})
		}

		// Fetch candidates for the constituency
		candidateQuery := `
            SELECT party_id, citizen_id
            FROM candidates
            WHERE constituency_id = $1
        `
		candidateRows, err := utils.DB.Query(candidateQuery, constituency.ID)
		if err != nil {
			log.Println("Error fetching candidates:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch candidates"})
		}
		defer candidateRows.Close()

		for candidateRows.Next() {
			var candidate struct {
				PartyID   int `json:"party_id"`
				CitizenID int `json:"citizen_id"`
			}
			if err := candidateRows.Scan(&candidate.PartyID, &candidate.CitizenID); err != nil {
				log.Println("Error parsing candidate row:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse candidates"})
			}
			constituency.Candidates = append(constituency.Candidates, candidate)
		}

		election.Constituencies = append(election.Constituencies, constituency)
	}

	return c.JSON(election)
}

// UpdateElection updates an existing election
func UpdateElection(c *fiber.Ctx) error {
	id := c.Params("id")
	var request struct {
		Name           string `json:"name"`
		Date           string `json:"date"`
		TimeLimit      int    `json:"time_limit"`
		Constituencies []struct {
			ID         int `json:"id"` // Constituency ID
			Candidates []struct {
				PartyID   int `json:"party_id"`
				CitizenID int `json:"citizen_id"`
			} `json:"candidates"`
		} `json:"constituencies"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Update the election
	query := `
        UPDATE elections
        SET name = $1, date = $2, time_limit = $3
        WHERE id = $4
    `
	if _, err := utils.DB.Exec(query, request.Name, request.Date, request.TimeLimit, id); err != nil {
		log.Println("Error updating election:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update election"})
	}

	// Clear existing constituencies and candidates for the election
	clearConstituenciesQuery := `
        DELETE FROM election_constituencies
        WHERE election_id = $1
    `
	if _, err := utils.DB.Exec(clearConstituenciesQuery, id); err != nil {
		log.Println("Error clearing constituencies:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to clear constituencies"})
	}

	clearCandidatesQuery := `
        DELETE FROM candidates
        WHERE constituency_id IN (
            SELECT constituency_id
            FROM election_constituencies
            WHERE election_id = $1
        )
    `
	if _, err := utils.DB.Exec(clearCandidatesQuery, id); err != nil {
		log.Println("Error clearing candidates:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to clear candidates"})
	}

	// Insert updated constituencies and candidates
	for _, constituency := range request.Constituencies {
		// Link the election with the constituency
		constituencyQuery := `
            INSERT INTO election_constituencies (election_id, constituency_id)
            VALUES ($1, $2)
        `
		if _, err := utils.DB.Exec(constituencyQuery, id, constituency.ID); err != nil {
			log.Println("Error adding constituencies:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add constituencies to election"})
		}

		// Add candidates for the constituency
		for _, candidate := range constituency.Candidates {
			candidateQuery := `
                INSERT INTO candidates (party_id, citizen_id, constituency_id)
                VALUES ($1, $2, $3)
            `
			if _, err := utils.DB.Exec(candidateQuery, candidate.PartyID, candidate.CitizenID, constituency.ID); err != nil {
				log.Println("Error adding candidates:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add candidates to constituency"})
			}
		}
	}

	return c.JSON(fiber.Map{"message": "Election updated successfully"})
}

// DeleteElection removes an election by ID
func DeleteElection(c *fiber.Ctx) error {
	id := c.Params("id")
	query := "DELETE FROM elections WHERE id = $1"
	if _, err := utils.DB.Exec(query, id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete election"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// StartElection starts an election
func StartElection(c *fiber.Ctx) error {
	id := c.Params("id")

	// Update the started column to TRUE
	query := `
        UPDATE elections
        SET started = TRUE
        WHERE id = $1
    `
	if _, err := utils.DB.Exec(query, id); err != nil {
		log.Println("Error starting election:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to start election"})
	}

	return c.JSON(fiber.Map{"message": "Election started successfully"})
}

// EndElection ends an election and calculates results
func EndElection(c *fiber.Ctx) error {
	id := c.Params("id")

	// Update the started column to FALSE
	query := `
        UPDATE elections
        SET started = FALSE,
		ended = TRUE
        WHERE id = $1
    `
	if _, err := utils.DB.Exec(query, id); err != nil {
		log.Println("Error ending election:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to end election"})
	}

	// Calculate results and populate the election_results table
	resultQuery := `
        INSERT INTO election_results (election_id, constituency_id, party_id, total_votes)
        SELECT
            v.election_id,
            v.constituency_id,
            v.party_id,
            COUNT(v.id) AS total_votes
        FROM votes v
        WHERE v.election_id = $1
        GROUP BY v.election_id, v.constituency_id, v.party_id
    `
	if _, err := utils.DB.Exec(resultQuery, id); err != nil {
		log.Println("Error populating election results:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to calculate election results"})
	}

	return c.JSON(fiber.Map{"message": "Election ended and results calculated successfully"})
}

// GetUpcomingElections fetches all elections that have not happened yet (no entry in the election_results table)
func GetUpcomingElections(c *fiber.Ctx) error {
	query := `
        SELECT e.id, e.name, e.date, e.started
        FROM elections e
        where e.ended = false
    `

	rows, err := utils.DB.Query(query)
	if err != nil {
		log.Println("Error fetching upcoming elections:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch upcoming elections"})
	}
	defer rows.Close()

	var elections []struct {
		ID             int    `json:"id"`
		Name           string `json:"name"`
		Date           string `json:"date"`
		Started        bool   `json:"started"`
		Constituencies []struct {
			ID         int    `json:"id"`
			Name       string `json:"name"`
			Candidates []struct {
				PartyID   int `json:"party_id"`
				CitizenID int `json:"citizen_id"`
			} `json:"candidates"`
		} `json:"constituencies"`
	}

	for rows.Next() {
		var election struct {
			ID             int    `json:"id"`
			Name           string `json:"name"`
			Date           string `json:"date"`
			Started        bool   `json:"started"`
			Constituencies []struct {
				ID         int    `json:"id"`
				Name       string `json:"name"`
				Candidates []struct {
					PartyID   int `json:"party_id"`
					CitizenID int `json:"citizen_id"`
				} `json:"candidates"`
			} `json:"constituencies"`
		}

		if err := rows.Scan(&election.ID, &election.Name, &election.Date, &election.Started); err != nil {
			log.Println("Error scanning election row:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse upcoming elections"})
		}

		// Fetch constituencies for the election
		constituencyQuery := `
            SELECT c.id, c.name
            FROM constituencies c
            JOIN election_constituencies ec ON c.id = ec.constituency_id
            WHERE ec.election_id = $1
        `
		constituencyRows, err := utils.DB.Query(constituencyQuery, election.ID)
		if err != nil {
			log.Println("Error fetching constituencies:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch constituencies"})
		}
		defer constituencyRows.Close()

		for constituencyRows.Next() {
			var constituency struct {
				ID         int    `json:"id"`
				Name       string `json:"name"`
				Candidates []struct {
					PartyID   int `json:"party_id"`
					CitizenID int `json:"citizen_id"`
				} `json:"candidates"`
			}
			if err := constituencyRows.Scan(&constituency.ID, &constituency.Name); err != nil {
				log.Println("Error parsing constituency row:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse constituencies"})
			}

			// Fetch candidates for the constituency
			candidateQuery := `
                SELECT party_id, citizen_id
                FROM candidates
                WHERE constituency_id = $1
            `
			candidateRows, err := utils.DB.Query(candidateQuery, constituency.ID)
			if err != nil {
				log.Println("Error fetching candidates:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch candidates"})
			}
			defer candidateRows.Close()

			for candidateRows.Next() {
				var candidate struct {
					PartyID   int `json:"party_id"`
					CitizenID int `json:"citizen_id"`
				}
				if err := candidateRows.Scan(&candidate.PartyID, &candidate.CitizenID); err != nil {
					log.Println("Error parsing candidate row:", err)
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse candidates"})
				}
				constituency.Candidates = append(constituency.Candidates, candidate)
			}

			election.Constituencies = append(election.Constituencies, constituency)
		}

		elections = append(elections, election)
	}

	return c.JSON(elections)
}

// GetPastElections fetches all elections whose data is available in the election_results table
func GetPastElections(c *fiber.Ctx) error {
	query := `
        SELECT e.id, e.name, e.date
        FROM elections e
        WHERE e.ended = TRUE
    `

	rows, err := utils.DB.Query(query)
	if err != nil {
		log.Println("Error fetching past elections:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch past elections"})
	}
	defer rows.Close()

	var pastElections []struct {
		ID             int    `json:"id"`
		Name           string `json:"name"`
		Date           string `json:"date"`
		Constituencies []struct {
			ID      int    `json:"id"`
			Name    string `json:"name"`
			Results []struct {
				PartyID    int    `json:"party_id"`
				PartyName  string `json:"party_name"`
				Candidate  string `json:"candidate"`
				TotalVotes int    `json:"total_votes"`
			} `json:"results"`
		} `json:"constituencies"`
	}

	for rows.Next() {
		var election struct {
			ID             int    `json:"id"`
			Name           string `json:"name"`
			Date           string `json:"date"`
			Constituencies []struct {
				ID      int    `json:"id"`
				Name    string `json:"name"`
				Results []struct {
					PartyID    int    `json:"party_id"`
					PartyName  string `json:"party_name"`
					Candidate  string `json:"candidate"`
					TotalVotes int    `json:"total_votes"`
				} `json:"results"`
			} `json:"constituencies"`
		}

		if err := rows.Scan(&election.ID, &election.Name, &election.Date); err != nil {
			log.Println("Error scanning election row:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse past elections"})
		}

		// Fetch constituencies for the election
		constituencyQuery := `
            SELECT c.id, c.name
            FROM constituencies c
            JOIN election_constituencies ec ON c.id = ec.constituency_id
            WHERE ec.election_id = $1
        `
		constituencyRows, err := utils.DB.Query(constituencyQuery, election.ID)
		if err != nil {
			log.Println("Error fetching constituencies:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch constituencies"})
		}
		defer constituencyRows.Close()

		for constituencyRows.Next() {
			var constituency struct {
				ID      int    `json:"id"`
				Name    string `json:"name"`
				Results []struct {
					PartyID    int    `json:"party_id"`
					PartyName  string `json:"party_name"`
					Candidate  string `json:"candidate"`
					TotalVotes int    `json:"total_votes"`
				} `json:"results"`
			}
			if err := constituencyRows.Scan(&constituency.ID, &constituency.Name); err != nil {
				log.Println("Error parsing constituency row:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse constituencies"})
			}

			// Fetch results for the constituency
			resultsQuery := `
                SELECT er.party_id, p.name AS party_name, ci.name AS candidate_name, er.total_votes
                FROM election_results er
                JOIN parties p ON er.party_id = p.id
                JOIN candidates c ON c.party_id = er.party_id AND c.constituency_id = er.constituency_id
                JOIN citizens ci ON c.citizen_id = ci.id
                WHERE er.election_id = $1 AND er.constituency_id = $2
                ORDER BY er.total_votes DESC
            `
			resultsRows, err := utils.DB.Query(resultsQuery, election.ID, constituency.ID)
			if err != nil {
				log.Println("Error fetching results:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch results"})
			}
			defer resultsRows.Close()

			for resultsRows.Next() {
				var result struct {
					PartyID    int    `json:"party_id"`
					PartyName  string `json:"party_name"`
					Candidate  string `json:"candidate"`
					TotalVotes int    `json:"total_votes"`
				}
				if err := resultsRows.Scan(&result.PartyID, &result.PartyName, &result.Candidate, &result.TotalVotes); err != nil {
					log.Println("Error parsing results row:", err)
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse results"})
				}
				constituency.Results = append(constituency.Results, result)
			}

			election.Constituencies = append(election.Constituencies, constituency)
		}

		pastElections = append(pastElections, election)
	}

	return c.JSON(pastElections)
}
