package config

import (
	"fmt"
	"os"
	"path/filepath"
)

// 예: Python의 config.py 참고
//
//	DB URL, 업로드 경로 등을 미리 정의하고 사용
var (
	DatabaseURL    = getEnv("DATABASE_URL", "sqlite://./static/local.db")
	UploadDir      = getEnv("UPLOAD_DIR", "./static")
	ModelUploadDir string
	TmpFolder      = getEnv("TMP_FOLDER", "./.tmp")
)

func init() {
	// ModelUploadDir = ./static/models
	ModelUploadDir = filepath.Join(UploadDir, "models")

	// 필요하다면 디렉토리 생성
	os.MkdirAll(UploadDir, 0755)
	os.MkdirAll(filepath.Join(UploadDir, "images"), 0755)
	os.MkdirAll(filepath.Join(UploadDir, "thumbnails"), 0755)
	os.MkdirAll(ModelUploadDir, 0755)
	os.MkdirAll(TmpFolder, 0755)
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func PrintConfig() {
	fmt.Println("----- Config -----")
	fmt.Println("DatabaseURL:", DatabaseURL)
	fmt.Println("UploadDir:", UploadDir)
	fmt.Println("ModelUploadDir:", ModelUploadDir)
	fmt.Println("TmpFolder:", TmpFolder)
	fmt.Println("-----------------")
}
