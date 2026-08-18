# Build stage
FROM golang:1.24-alpine AS builder

# 🟢 FIX 1: Use a reliable Go module proxy to bypass network blocks to proxy.golang.org
ENV GOPROXY=https://goproxy.cn,direct

WORKDIR /app

# 🟢 FIX 2: Copy dependency files first (Optimizes Docker layer caching)
COPY go.mod go.sum ./

# Download dependencies (This step is now cached unless go.mod/go.sum change!)
RUN go mod download && go mod verify

# Copy the rest of the source code
COPY . .

# Tidy up (catches any new dependencies added in the code) and build
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Run stage
FROM alpine:3.19

# Install root certificates and timezone data
RUN apk --no-cache add ca-certificates tzdata

# Set timezone
ENV TZ=Asia/Shanghai

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/server .

# Expose the application port
EXPOSE 8080

# Run the binary
CMD ["./server"]