package handlers

import (
	"fermat-academy/middleware"
	"fermat-academy/models"
	"net/http"
)

type LeaderboardEntry struct {
	Rank          int
	Name          string
	XP            int
	ArtifactTypes []string
}

func LeaderboardPage(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetSessionUser(r)

	rows, err := models.DB.Query(
		`SELECT u.name, u.xp FROM users u
		 WHERE u.role = 'student' AND u.xp > 0
		 ORDER BY u.xp DESC LIMIT 100`,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var entries []LeaderboardEntry
	rank := 1
	for rows.Next() {
		var entry LeaderboardEntry
		rows.Scan(&entry.Name, &entry.XP)
		entry.Rank = rank
		rank++

		aRows, _ := models.DB.Query(
			"SELECT artifact_type FROM user_artifacts WHERE user_id = (SELECT id FROM users WHERE name = $1) AND active = true",
			entry.Name,
		)
		if aRows != nil {
			for aRows.Next() {
				var at string
				aRows.Scan(&at)
				entry.ArtifactTypes = append(entry.ArtifactTypes, at)
			}
			aRows.Close()
		}

		entries = append(entries, entry)
	}
	if entries == nil {
		entries = []LeaderboardEntry{}
	}

	renderTemplate(w, "leaderboard", PageData{User: user, Title: "Leaderboard", Data: entries})
}
