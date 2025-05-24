package database

import (
	"fmt"
	"log"
	"strings"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/ingradient/ingradient/go_server/config"
	"github.com/ingradient/ingradient/go_server/models"
)

var DB *gorm.DB

func InitDB() {
	db, err := gorm.Open(sqlite.Open("local.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}

	// AutoMigrate 모든 모델 및 association 테이블
	if err := db.AutoMigrate(
		&models.DatasetClasses{},
		&models.DatasetImages{},
		&models.ClassImages{},
		&models.ProjectDatasets{},
		&models.ProjectUsers{},
		&models.User{},
		&models.Project{},
		&models.Dataset{},
		&models.Class{},
		&models.Image{},
		&models.BoundingBox{},
		&models.KeyPoint{},
		&models.Segmentation{},
		&models.AIModel{},
		&models.ImageFeature{},
	); err != nil {
		log.Fatal("failed to migrate:", err)
	}

	DB = db
}

// Python의 "sqlite:///./ingradient.db" 형태를
// gorm의 sqlite.Open()이 기대하는 "./ingradient.db" 형태로 바꾼다.
func parseSQLitePath(url string) string {
	// 가령 "sqlite://./ingradient.db" → "./ingradient.db" 로 치환
	splitted := strings.Split(url, "sqlite://")
	if len(splitted) == 2 {
		return splitted[1]
	}
	// 문제가 있으면 url 그대로
	return url
}

// 필요하다면 기본 모델을 DB에 삽입하는 함수(에러 처리는 생략)
func insertDefaultModel() {
	// 이미 있는지 체크
	var count int64
	DB.Model(&models.AIModel{}).Where("name = ?", "DinoV2").Count(&count)
	if count == 0 {
		// 모델 파일이 있는지 여부 확인 후, 없으면 다운로드(여기선 생략)
		defaultModel := models.AIModel{
			ID:           "some-uuid-or-nanoid",
			Name:         "DinoV2",
			FileLocation: config.ModelUploadDir + "/model_uint8.onnx",
			InputWidth:   224,
			InputHeight:  224,
			Purpose:      "feature_extract",
		}
		DB.Create(&defaultModel)
		fmt.Println("Inserted default model DinoV2")
	}
}
