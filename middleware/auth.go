package middleware

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fermat-academy/models"
	"net/http"
	"time"
)

type contextKey string

const UserKey contextKey = "user"

func GenerateToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func SetSession(w http.ResponseWriter, userID int) (string, error) {
	token := GenerateToken()
	expires := time.Now().Add(72 * time.Hour)

	_, err := models.DB.Exec(
		"INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
		token, userID, expires,
	)
	if err != nil {
		return "", err
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Expires:  expires,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	return token, nil
}

func ClearSession(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err == nil {
		models.DB.Exec("DELETE FROM sessions WHERE token = $1", cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		Path:     "/",
		HttpOnly: true,
	})
}

func GetSessionUser(r *http.Request) *models.User {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return nil
	}

	var user models.User
	var tokenExpires sql.NullTime
	err = models.DB.QueryRow(
		`SELECT u.id, u.name, u.email, u.password_hash, u.role, u.xp, u.streak
		 FROM sessions s
		 JOIN users u ON u.id = s.user_id
		 WHERE s.token = $1 AND s.expires_at > NOW()`,
		cookie.Value,
	).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role,
		&user.XP, &user.Streak)
	if err != nil {
		return nil
	}
	_ = tokenExpires
	return &user
}

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := GetSessionUser(r)
		if user != nil {
			ctx := context.WithValue(r.Context(), UserKey, user)
			r = r.WithContext(ctx)
		}
		next(w, r)
	}
}

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := GetSessionUser(r)
		if user == nil {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}
		ctx := context.WithValue(r.Context(), UserKey, user)
		r = r.WithContext(ctx)
		next(w, r)
	}
}

func RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := GetSessionUser(r)
		if user == nil || user.Role != "admin" {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}
		ctx := context.WithValue(r.Context(), UserKey, user)
		r = r.WithContext(ctx)
		next(w, r)
	}
}
