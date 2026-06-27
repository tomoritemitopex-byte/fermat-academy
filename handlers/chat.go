package handlers

import (
	"bytes"
	"encoding/json"
	"fermat-academy/middleware"
	"fermat-academy/models"
	"net/http"
	"os"
	"strconv"
	"strings"
)

type ChatRequest struct {
	Message  string `json:"message"`
	LessonID int    `json:"lesson_id"`
}

type ChatResponse struct {
	Reply    string `json:"reply"`
	Flagged  bool   `json:"flagged"`
}

func DrFemiChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	user := middleware.GetSessionUser(r)
	var userID *int
	if user != nil {
		userID = &user.ID
	}

	lessonContent := ""
	if req.LessonID > 0 {
		var content string
		err := models.DB.QueryRow(
			"SELECT content FROM lessons WHERE id = $1", req.LessonID,
		).Scan(&content)
		if err == nil {
			lessonContent = content
		}
	}

	reply, flagged := queryNVIDIA(req.Message, lessonContent)

	if flagged && req.LessonID > 0 {
		models.DB.Exec(
			"INSERT INTO flagged_qa (user_id, lesson_id, question, answer) VALUES ($1, $2, $3, $4)",
			userID, req.LessonID, req.Message, reply,
		)
	}

	resp := ChatResponse{Reply: reply, Flagged: flagged}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func AdminChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := middleware.GetSessionUser(r)
	if user == nil || user.Role != "admin" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	contextData := ""
	rows, err := models.DB.Query("SELECT COUNT(*) FROM users WHERE role = 'student'")
	if err == nil {
		rows.Next()
		rows.Scan(&contextData)
		rows.Close()
	}

	reply, _ := queryNVIDIA(req.Message, "Admin analytics context: "+contextData)

	resp := ChatResponse{Reply: reply}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func queryNVIDIA(message, context string) (string, bool) {
	apiKey := os.Getenv("NVIDIA_API_KEY")
	if apiKey == "" {
		return "AI is not configured yet. Please set NVIDIA_API_KEY.", false
	}

	prompt := message
	if context != "" {
		prompt = "Context from lesson notes:\n" + context + "\n\nStudent question: " + message +
			"\n\nAnswer the question using the context above. If the context doesn't contain the answer, answer from general knowledge and flag this."
	}

	body := map[string]interface{}{
		"model":    "meta/llama-3.1-8b-instruct",
		"messages": []map[string]string{{"role": "user", "content": prompt}},
		"temperature": 0.3,
		"max_tokens":  500,
	}

	jsonBody, _ := json.Marshal(body)
	resp, err := http.Post(
		"https://api.nvcf.nvidia.com/v2/llm/chat/completions",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)
	if err != nil {
		return "Sorry, I'm having trouble connecting to the AI service.", false
	}
	defer resp.Body.Close()

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "Sorry, I couldn't process that request.", false
	}

	if len(result.Choices) > 0 {
		reply := strings.TrimSpace(result.Choices[0].Message.Content)
		flagged := strings.Contains(strings.ToLower(prompt), "flag this")
		return reply, flagged
	}

	return "I'm not sure how to answer that.", false
}

var _ = strconv.Itoa
