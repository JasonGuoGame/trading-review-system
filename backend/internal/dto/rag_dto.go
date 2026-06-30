package dto

// RAGAnalyzeRequest is the POST body for /api/rag/analyze.
type RAGAnalyzeRequest struct {
	Query  string `json:"query" binding:"required"`
	Author string `json:"author"` // optional author filter
}

// RAGAnalyzeResponse is the structured response returned to the UI.
type RAGAnalyzeResponse struct {
	Thinking string   `json:"thinking"` // DeepSeek R1 reasoning / thinking process
	Report   string   `json:"report"`   // structured analysis report
	Sources  []string `json:"sources"`  // list of retrieved document summaries
}

// ChromaSubprocessInput is the JSON sent via stdin to the Python chroma_query.py script.
type ChromaSubprocessInput struct {
	QueryText string `json:"query_text"`
	NResults  int    `json:"n_results"`
	Author    string `json:"author,omitempty"`
}

// ChromaSubprocessOutput is the JSON returned from the Python chroma_query.py script.
type ChromaSubprocessOutput struct {
	Documents [][]string                 `json:"documents"`
	Metadatas [][]map[string]interface{} `json:"metadatas"`
	Distances [][]float64                `json:"distances"`
	Error     *string                    `json:"error"`
}

// OllamaChatRequest is the JSON body sent to Ollama's /api/chat endpoint.
type OllamaChatRequest struct {
	Model    string          `json:"model"`
	Messages []OllamaMessage `json:"messages"`
	Stream   bool            `json:"stream"`
}

// OllamaMessage is a single message in the Ollama chat payload.
type OllamaMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OllamaChatResponse is the JSON response from Ollama.
type OllamaChatResponse struct {
	Model   string        `json:"model"`
	Message OllamaMessage `json:"message"`
	Done    bool          `json:"done"`
}
