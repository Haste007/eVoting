package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"log"
	"time"

	"github.com/Haste007/E-Voting/Backend/utils"
	"github.com/gofiber/fiber/v2"
)

// CastVote handles the casting of a vote
func CastVote(c *fiber.Ctx) error {
	type VoteRequest struct {
		ElectionID     int    `json:"electionId"`
		ConstituencyID int    `json:"constituencyId"`
		PartyID        int    `json:"partyId"`
		VoterID        string `json:"voterId"`
	}

	var voteRequest VoteRequest
	if err := c.BodyParser(&voteRequest); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Hash the VoterID using SHA-256
	hashedVoterID := hashVoterID(voteRequest.VoterID)

	// Check if the voter has already voted in this election and constituency
	var existingVoteCount int
	checkVoteQuery := `
        SELECT COUNT(*)
        FROM votes
        WHERE election_id = $1 AND constituency_id = $2 AND voter_hash = $3
    `
	err := utils.DB.QueryRow(checkVoteQuery, voteRequest.ElectionID, voteRequest.ConstituencyID, hashedVoterID).Scan(&existingVoteCount)
	if err != nil {
		log.Println("Error checking existing vote:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check existing vote"})
	}

	if existingVoteCount > 0 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Voter has already cast a vote"})
	}

	// Insert the vote into the database
	insertVoteQuery := `
        INSERT INTO votes (election_id, constituency_id, party_id, voter_hash, vote_time)
        VALUES ($1, $2, $3, $4, $5)
    `
	_, err = utils.DB.Exec(insertVoteQuery, voteRequest.ElectionID, voteRequest.ConstituencyID, voteRequest.PartyID, hashedVoterID, time.Now())
	if err != nil {
		log.Println("Error inserting vote:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to cast vote"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Vote cast successfully"})
}

// hashVoterID hashes the voter ID using SHA-256
func hashVoterID(voterID string) string {
	hash := sha256.New()
	hash.Write([]byte(voterID))
	return hex.EncodeToString(hash.Sum(nil))
}

// GetOngoingElections fetches all elections where started = true and ended = false
func GetOngoingElections(c *fiber.Ctx) error {
	query := `
        SELECT id, name, date
        FROM elections
        WHERE started = TRUE AND ended = FALSE
    `

	rows, err := utils.DB.Query(query)
	if err != nil {
		log.Println("Error fetching ongoing elections:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch ongoing elections"})
	}
	defer rows.Close()

	var elections []struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
		Date string `json:"date"`
	}

	for rows.Next() {
		var election struct {
			ID   int    `json:"id"`
			Name string `json:"name"`
			Date string `json:"date"`
		}
		if err := rows.Scan(&election.ID, &election.Name, &election.Date); err != nil {
			log.Println("Error scanning election row:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse ongoing elections"})
		}
		elections = append(elections, election)
	}

	return c.JSON(elections)
}

// GetConstituencyData fetches constituency data for a specific election and district
func GetConstituencyData(c *fiber.Ctx) error {
	electionID := c.Params("electionId")
	districtID := c.Params("districtId")

	query := `
        SELECT 
            c.id AS constituency_id, 
            c.name AS constituency_name, 
            p.id AS party_id, 
            p.name AS party_name, 
            p.logo AS party_logo, 
            ct.id AS candidate_id,
            ci.name AS candidate_name
        FROM constituencies c
        JOIN constituency_districts cd ON c.id = cd.constituency_id
        JOIN candidates ct ON c.id = ct.constituency_id
        JOIN citizens ci ON ct.citizen_id = ci.id
        JOIN parties p ON ct.party_id = p.id
        WHERE cd.district_id = $1 
          AND c.id IN (
              SELECT constituency_id
              FROM election_constituencies
              WHERE election_id = $2
          )
    `

	rows, err := utils.DB.Query(query, districtID, electionID)
	if err != nil {
		log.Println("Error fetching constituency data:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch constituency data"})
	}
	defer rows.Close()

	var candidates []struct {
		ConstituencyID   int    `json:"constituency_id"`
		ConstituencyName string `json:"constituency_name"`
		PartyID          int    `json:"party_id"`
		PartyName        string `json:"party_name"`
		PartyLogo        string `json:"party_logo"`
		CandidateID      int    `json:"candidate_id"`
		CandidateName    string `json:"candidate_name"`
	}

	for rows.Next() {
		var candidate struct {
			ConstituencyID   int    `json:"constituency_id"`
			ConstituencyName string `json:"constituency_name"`
			PartyID          int    `json:"party_id"`
			PartyName        string `json:"party_name"`
			PartyLogo        string `json:"party_logo"`
			CandidateID      int    `json:"candidate_id"`
			CandidateName    string `json:"candidate_name"`
		}
		if err := rows.Scan(
			&candidate.ConstituencyID,
			&candidate.ConstituencyName,
			&candidate.PartyID,
			&candidate.PartyName,
			&candidate.PartyLogo,
			&candidate.CandidateID,
			&candidate.CandidateName,
		); err != nil {
			log.Println("Error scanning constituency row:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse constituency data"})
		}
		candidates = append(candidates, candidate)
	}

	return c.JSON(candidates)
}
