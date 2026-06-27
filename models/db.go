package models

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	fmt.Println("Connected to Neon database")
	createTables()
}

func createTables() {
	tables := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL DEFAULT '',
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL DEFAULT '',
			role VARCHAR(20) NOT NULL DEFAULT 'student',
			xp INTEGER NOT NULL DEFAULT 0,
			streak INTEGER NOT NULL DEFAULT 0,
			last_active_at TIMESTAMP DEFAULT NOW(),
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS lessons (
			id SERIAL PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			content TEXT NOT NULL DEFAULT '',
			youtube_url VARCHAR(500) NOT NULL DEFAULT '',
			pdf_url VARCHAR(500) NOT NULL DEFAULT '',
			admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS lesson_progress (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
			video_watched BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT NOW(),
			UNIQUE(user_id, lesson_id)
		)`,
		`CREATE TABLE IF NOT EXISTS badges (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			type VARCHAR(50) NOT NULL,
			earned_at TIMESTAMP DEFAULT NOW(),
			UNIQUE(user_id, type)
		)`,
		`CREATE TABLE IF NOT EXISTS user_artifacts (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			artifact_type VARCHAR(50) NOT NULL,
			unlocked BOOLEAN DEFAULT FALSE,
			active BOOLEAN DEFAULT FALSE,
			UNIQUE(user_id, artifact_type)
		)`,
		`CREATE TABLE IF NOT EXISTS artifact_content (
			id SERIAL PRIMARY KEY,
			lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
			type VARCHAR(50) NOT NULL,
			content JSONB DEFAULT '{}',
			created_at TIMESTAMP DEFAULT NOW(),
			UNIQUE(lesson_id, type)
		)`,
		`CREATE TABLE IF NOT EXISTS flagged_qa (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
			question TEXT NOT NULL,
			answer TEXT NOT NULL,
			resolved BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS sessions (
			id SERIAL PRIMARY KEY,
			token VARCHAR(255) UNIQUE NOT NULL,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			created_at TIMESTAMP DEFAULT NOW(),
			expires_at TIMESTAMP
		)`,
	}

	for _, table := range tables {
		if _, err := DB.Exec(table); err != nil {
			log.Printf("Warning creating table: %v", err)
		}
	}
	fmt.Println("Database tables created/verified")
}

type User struct {
	ID           int
	Name         string
	Email        string
	PasswordHash string
	Role         string
	XP           int
	Streak       int
	LastActiveAt string
	CreatedAt    string
}

type Lesson struct {
	ID          int
	Title       string
	Description string
	Content     string
	YoutubeURL  string
	PdfURL      string
	AdminID     int
	CreatedAt   string
	UpdatedAt   string
}

type Badge struct {
	ID       int
	UserID   int
	Type     string
	EarnedAt string
}

type FlaggedQA struct {
	ID       int
	UserID   *int
	LessonID int
	Question string
	Answer   string
	Resolved bool
}

type UserArtifact struct {
	ID           int
	UserID       int
	ArtifactType string
	Unlocked     bool
	Active       bool
}
