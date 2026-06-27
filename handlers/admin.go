package handlers

import (
	"fermat-academy/middleware"
	"fermat-academy/models"
	"net/http"
	"strconv"
	"strings"
)

func AdminDashboard(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetSessionUser(r)
	if user == nil || user.Role != "admin" {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

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

	// Get flagged Q&A count
	var flaggedCount int
	models.DB.QueryRow("SELECT COUNT(*) FROM flagged_qa WHERE resolved = false").Scan(&flaggedCount)

	// Get stats for analytics
	var totalStudents, totalLessons int
	models.DB.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'student'").Scan(&totalStudents)
	models.DB.QueryRow("SELECT COUNT(*) FROM lessons").Scan(&totalLessons)

	type AdminData struct {
		Lessons      []models.Lesson
		FlaggedCount int
		TotalStudents int
		TotalLessons  int
	}

	renderTemplate(w, "dashboard", PageData{
		User:  user,
		Title: "Admin Dashboard",
		Data: AdminData{
			Lessons:      lessons,
			FlaggedCount: flaggedCount,
			TotalStudents: totalStudents,
			TotalLessons:  totalLessons,
		},
	})
}

func AdminNewLesson(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetSessionUser(r)
	if user == nil || user.Role != "admin" {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	if r.Method == http.MethodPost {
		title := strings.TrimSpace(r.FormValue("title"))
		description := strings.TrimSpace(r.FormValue("description"))
		content := r.FormValue("content")
		youtubeURL := strings.TrimSpace(r.FormValue("youtube_url"))

		if title == "" {
			renderTemplate(w, "lesson-new", PageData{User: user, Title: "New Lesson", Data: map[string]string{"error": "Title required"}})
			return
		}

		_, err := models.DB.Exec(
			"INSERT INTO lessons (title, description, content, youtube_url, admin_id) VALUES ($1, $2, $3, $4, $5)",
			title, description, content, youtubeURL, user.ID,
		)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, "/admin", http.StatusSeeOther)
		return
	}

	renderTemplate(w, "lesson-new", PageData{User: user, Title: "New Lesson"})
}

func AdminEditLesson(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetSessionUser(r)
	if user == nil || user.Role != "admin" {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.NotFound(w, r)
		return
	}
	idStr := parts[len(parts)-2]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	if r.Method == http.MethodPost {
		title := strings.TrimSpace(r.FormValue("title"))
		description := strings.TrimSpace(r.FormValue("description"))
		content := r.FormValue("content")
		youtubeURL := strings.TrimSpace(r.FormValue("youtube_url"))

		if title == "" {
			http.Redirect(w, r, "/admin/lessons/"+idStr+"/edit", http.StatusSeeOther)
			return
		}

		_, err := models.DB.Exec(
			"UPDATE lessons SET title=$1, description=$2, content=$3, youtube_url=$4 WHERE id=$5",
			title, description, content, youtubeURL, id,
		)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, "/admin", http.StatusSeeOther)
		return
	}

	var lesson models.Lesson
	err = models.DB.QueryRow(
		"SELECT id, title, description, content, youtube_url FROM lessons WHERE id = $1", id,
	).Scan(&lesson.ID, &lesson.Title, &lesson.Description, &lesson.Content, &lesson.YoutubeURL)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	renderTemplate(w, "lesson-edit", PageData{User: user, Title: "Edit Lesson", Data: lesson})
}

func AdminDeleteLesson(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetSessionUser(r)
	if user == nil || user.Role != "admin" {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	models.DB.Exec("DELETE FROM lessons WHERE id = $1", id)
	http.Redirect(w, r, "/admin", http.StatusSeeOther)
}

func AdminFlaggedQA(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetSessionUser(r)
	if user == nil || user.Role != "admin" {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	if r.Method == http.MethodPost {
		idStr := r.FormValue("id")
		id, _ := strconv.Atoi(idStr)
		models.DB.Exec("UPDATE flagged_qa SET resolved = true WHERE id = $1", id)
		w.WriteHeader(http.StatusOK)
		return
	}

	rows, err := models.DB.Query(
		`SELECT fq.id, fq.user_id, fq.lesson_id, fq.question, fq.answer, fq.resolved
		 FROM flagged_qa fq WHERE fq.resolved = false ORDER BY fq.created_at DESC LIMIT 20`,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var flagged []models.FlaggedQA
	for rows.Next() {
		var f models.FlaggedQA
		rows.Scan(&f.ID, &f.UserID, &f.LessonID, &f.Question, &f.Answer, &f.Resolved)
		flagged = append(flagged, f)
	}
	if flagged == nil {
		flagged = []models.FlaggedQA{}
	}

	renderTemplate(w, "flagged-qa", PageData{User: user, Title: "Flagged Q&A", Data: flagged})
}
