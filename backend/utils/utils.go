package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
)

var secretKey = []byte("your-secret-key") // Replace with a secure key

// HashVoterID hashes the voter ID using HMAC-SHA256
func HashVoterID(voterID string) string {
	h := hmac.New(sha256.New, secretKey)
	h.Write([]byte(voterID))
	return hex.EncodeToString(h.Sum(nil))
}
