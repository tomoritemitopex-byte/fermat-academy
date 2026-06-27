package handlers

import (
	"fermat-academy/middleware"
	"fermat-academy/models"
	"net/http"
	"strconv"
	"strings"
)

func LandingPage(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	user := middleware.GetSessionUser(r)
	rows, err := models.DB.Query("SELECT id, title, description, created_at FROM lessons ORDER BY created_at DESC LIMIT 6")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var lessons []models.Lesson
	for rows.Next() {
		var l models.Lesson
		rows.Scan(&l.ID, &l.Title, &l.Description, &l.CreatedAt)
		lessons = append(lessons, l)
	}

	renderTemplate(w, "index", PageData{User: user, Title: "Fermat Academy", Data: lessons})
}

func LessonsPage(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetSessionUser(r)
	rows, err := models.DB.Query("SELECT id, title, description, created_at FROM lessons ORDER BY created_at DESC")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var lessons []models.Lesson
	for rows.Next() {
		var l models.Lesson
		rows.Scan(&l.ID, &l.Title, &l.Description, &l.CreatedAt)
		lessons = append(lessons, l)
	}

	if lessons == nil {
		lessons = []models.Lesson{}
	}

	renderTemplate(w, "lessons", PageData{User: user, Title: "Lessons", Data: lessons})
}

func LessonDetail(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetSessionUser(r)
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 3 {
		http.NotFound(w, r)
		return
	}

	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	var lesson models.Lesson
	err = models.DB.QueryRow(
		"SELECT id, title, description, content, youtube_url, pdf_url, created_at, updated_at FROM lessons WHERE id = $1",
		id,
	).Scan(&lesson.ID, &lesson.Title, &lesson.Description, &lesson.Content,
		&lesson.YoutubeURL, &lesson.PdfURL, &lesson.CreatedAt, &lesson.UpdatedAt)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	type LessonData struct {
		Lesson   models.Lesson
		UserXP   int
		Artifacts []models.UserArtifact
	}

	ld := LessonData{Lesson: lesson}
	if user != nil {
		ld.UserXP = user.XP

		rows, err := models.DB.Query(
			"SELECT artifact_type, unlocked, active FROM user_artifacts WHERE user_id = $1 AND unlocked = true AND active = true",
			user.ID,
		)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var a models.UserArtifact
				rows.Scan(&a.ArtifactType, &a.Unlocked, &a.Active)
				ld.Artifacts = append(ld.Artifacts, a)
			}
		}

		models.DB.Exec("INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", user.ID, id)

		if ld.UserXP > 0 {
			models.DB.Exec("UPDATE users SET xp = xp + 1 WHERE id = $1", user.ID)
		}
	}

	renderTemplate(w, "lesson", PageData{User: user, Title: lesson.Title, Data: ld})
}
