package handlers

import (
	"fermat-academy/middleware"
	"fermat-academy/models"
	"net/http"
)

type BadgeItem struct {
	Name   string
	Icon   string
	Type   string
	Earned bool
}

type ArtifactItem struct {
	Type     string
	Name     string
	Icon     string
	Unlocked bool
	Active   bool
}

type ArtifactPair struct {
	PairName string
	Items    []ArtifactItem
}

func ProfilePage(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetSessionUser(r)
	if user == nil {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	rows, err := models.DB.Query("SELECT type FROM badges WHERE user_id = $1", user.ID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	earnedBadges := make(map[string]bool)
	for rows.Next() {
		var b string
		rows.Scan(&b)
		earnedBadges[b] = true
	}

	badgeList := []BadgeItem{
		{"Rookie", "🎓", "rookie", earnedBadges["rookie"]},
		{"Veteran", "🥇", "veteran", earnedBadges["veteran"]},
		{"Bookworm", "📚", "bookworm", earnedBadges["bookworm"]},
		{"Scholar", "🏆", "scholar", earnedBadges["scholar"]},
		{"On Fire", "🔥", "onfire", earnedBadges["onfire"]},
		{"Dedicated", "💪", "dedicated", earnedBadges["dedicated"]},
		{"Curious", "🧠", "curious", earnedBadges["curious"]},
		{"Legend", "🎖️", "legend", earnedBadges["legend"]},
	}

	aRows, _ := models.DB.Query(
		"SELECT artifact_type, unlocked, active FROM user_artifacts WHERE user_id = $1",
		user.ID,
	)

	artifactMap := make(map[string]map[string]bool)
	if aRows != nil {
		defer aRows.Close()
		for aRows.Next() {
			var at string
			var unlocked, active bool
			aRows.Scan(&at, &unlocked, &active)
			artifactMap[at] = map[string]bool{"unlocked": unlocked, "active": active}
		}
	}

	pairs := []ArtifactPair{
		{
			PairName: "Study Tools",
			Items: []ArtifactItem{
				{"highlighters", "Auto Highlighter", "🖌️", artifactMap["highlighters"]["unlocked"], artifactMap["highlighters"]["active"]},
				{"flashcards", "Flashcards", "🃏", artifactMap["flashcards"]["unlocked"], artifactMap["flashcards"]["active"]},
			},
		},
		{
			PairName: "Learning Materials",
			Items: []ArtifactItem{
				{"textbook", "Textbook PDF", "📖", artifactMap["textbook"]["unlocked"], artifactMap["textbook"]["active"]},
				{"audio", "Audio Lesson", "🎧", artifactMap["audio"]["unlocked"], artifactMap["audio"]["active"]},
			},
		},
	}

	// Handle POST for artifact toggle
	if r.Method == http.MethodPost {
		artifactType := r.FormValue("artifact_type")
		action := r.FormValue("action")

		if action == "toggle" {
			var exists bool
			models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM user_artifacts WHERE user_id=$1 AND artifact_type=$2)",
				user.ID, artifactType).Scan(&exists)
			if exists {
				models.DB.Exec(
					"UPDATE user_artifacts SET active = NOT active WHERE user_id = $1 AND artifact_type = $2",
					user.ID, artifactType,
				)
			}
		}

		http.Redirect(w, r, "/profile", http.StatusSeeOther)
		return
	}

	renderTemplate(w, "profile", PageData{
		User:          user,
		Title:         "Profile",
		BadgeList:     badgeList,
		ArtifactPairs: pairs,
		Data: map[string]interface{}{
			"XP":     user.XP,
			"Streak": user.Streak,
			"Level":  getLevel(user.XP),
		},
	})
}

func getLevel(xp int) int {
	levels := []int{0, 500, 1500, 3500, 7000, 15000, 31000, 63000}
	for i, req := range levels {
		if xp < req {
			return i
		}
	}
	return len(levels)
}
