package utils

import (
	"database/sql"
	"errors"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func ConnectDB() error {
	var err error
	connStr := os.Getenv("DB_CONN_STRING")
	if connStr == "" {
		return errors.New("DB_CONN_STRING environment variable not set")
	}
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return err
	}

	if err = DB.Ping(); err != nil {
		return err
	}

	log.Println("Connected to the database successfully!")
	return nil
}
