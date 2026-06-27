package main

import (
	"fermat-academy/handlers"
	"fermat-academy/models"
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	models.InitDB()

	mux := http.NewServeMux()

	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	mux.HandleFunc("/", handlers.LandingPage)
	mux.HandleFunc("/login", handlers.LoginHandler)
	mux.HandleFunc("/signup", handlers.SignupHandler)
	mux.HandleFunc("/logout", handlers.LogoutHandler)
	mux.HandleFunc("/lessons", handlers.LessonsPage)
	mux.HandleFunc("/lessons/", handlers.LessonDetail)
	mux.HandleFunc("/leaderboard", handlers.LeaderboardPage)
	mux.HandleFunc("/profile", handlers.ProfilePage)
	mux.HandleFunc("/admin", handlers.AdminDashboard)
	mux.HandleFunc("/admin/lessons/new", handlers.AdminNewLesson)
	mux.HandleFunc("/admin/lessons/", handlers.AdminEditLesson)
	mux.HandleFunc("/admin/delete", handlers.AdminDeleteLesson)
	mux.HandleFunc("/admin/flagged-qa", handlers.AdminFlaggedQA)
	mux.HandleFunc("/api/chat/drfemi", handlers.DrFemiChat)
	mux.HandleFunc("/api/chat/admin", handlers.AdminChat)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Printf("Fermat Academy running on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
