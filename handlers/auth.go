package handlers

import (
	"fermat-academy/middleware"
	"fermat-academy/models"
	"html/template"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func renderTemplate(w http.ResponseWriter, tmpl string, data interface{}) {
	funcMap := template.FuncMap{}
	tmplPath := "views/" + tmpl + ".html"
	layoutPath := "views/layout.html"

	t, err := template.New("layout").Funcs(funcMap).ParseFiles(layoutPath, tmplPath)
	if err != nil {
		http.Error(w, "Template error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	err = t.ExecuteTemplate(w, "layout", data)
	if err != nil {
		http.Error(w, "Template execute error: "+err.Error(), http.StatusInternalServerError)
	}
}

type PageData struct {
	User  *models.User
	Title string
	Data  interface{}
	BadgeList     []BadgeItem
	ArtifactPairs []ArtifactPair
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		email := strings.TrimSpace(r.FormValue("email"))
		password := r.FormValue("password")

		if email == "" || password == "" {
			renderTemplate(w, "login", PageData{Title: "Login", Data: map[string]string{"error": "Email and password required"}})
			return
		}

		var user models.User
		err := models.DB.QueryRow(
			"SELECT id, name, email, password_hash, role, xp, streak FROM users WHERE email = $1",
			email,
		).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.XP, &user.Streak)

		if err != nil {
			renderTemplate(w, "login", PageData{Title: "Login", Data: map[string]string{"error": "Invalid email or password"}})
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
		if err != nil {
			renderTemplate(w, "login", PageData{Title: "Login", Data: map[string]string{"error": "Invalid email or password"}})
			return
		}

		middleware.SetSession(w, user.ID)
		if user.Role == "admin" {
			http.Redirect(w, r, "/admin", http.StatusSeeOther)
		} else {
			http.Redirect(w, r, "/", http.StatusSeeOther)
		}
		return
	}

	user := middleware.GetSessionUser(r)
	renderTemplate(w, "login", PageData{User: user, Title: "Login"})
}

func SignupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		name := strings.TrimSpace(r.FormValue("name"))
		email := strings.TrimSpace(r.FormValue("email"))
		password := r.FormValue("password")

		if name == "" || email == "" || password == "" {
			renderTemplate(w, "signup", PageData{Title: "Sign Up", Data: map[string]string{"error": "All fields required"}})
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		var userID int
		err = models.DB.QueryRow(
			"INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'student') RETURNING id",
			name, email, string(hash),
		).Scan(&userID)

		if err != nil {
			if strings.Contains(err.Error(), "duplicate") {
				renderTemplate(w, "signup", PageData{Title: "Sign Up", Data: map[string]string{"error": "Email already registered"}})
				return
			}
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		middleware.SetSession(w, userID)
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	user := middleware.GetSessionUser(r)
	renderTemplate(w, "signup", PageData{User: user, Title: "Sign Up"})
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	middleware.ClearSession(w, r)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}
