package routes

import (
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/ingradient/ingradient/go_server/database"
	"github.com/ingradient/ingradient/go_server/models"

	"github.com/gin-gonic/gin"
)

// ListDatasets GET /api/datasets
func ListDatasets(c *gin.Context) {
	var datasets []models.Dataset
	// Preload("Classes")를 사용하여 각 데이터셋의 Classes를 미리 로드합니다.
	if err := database.DB.Preload("Classes").Find(&datasets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 원하는 형태의 응답 데이터 구성 (예: Python과 같이 classIds만 추출)
	var results []map[string]interface{}
	for _, ds := range datasets {
		// 각 데이터셋에서 연결된 클래스 ID만 추출
		var classIds []string
		for _, cls := range ds.Classes {
			classIds = append(classIds, cls.ID)
		}

		// 필요한 필드들로 map을 구성합니다.
		dsMap := map[string]interface{}{
			"id":          ds.ID,
			"name":        ds.Name,
			"description": ds.Description,
			// time.Time을 ISO 포맷 문자열로 변환하고 싶다면, 아래와 같이 처리할 수 있음
			"uploadedAt": func() string {
				if !ds.UploadedAt.IsZero() {
					return ds.UploadedAt.Format(time.RFC3339)
				}
				return ""
			}(),
			"updatedAt": func() string {
				if !ds.UpdatedAt.IsZero() {
					return ds.UpdatedAt.Format(time.RFC3339)
				}
				return ""
			}(),
			"classIds": classIds,
		}

		results = append(results, dsMap)
	}

	c.JSON(http.StatusOK, results)
}

// CreateDataset POST /api/datasets
func CreateDataset(c *gin.Context) {
	var input struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.ID == "" {
		input.ID = uuid.New().String()
	}

	ds := models.Dataset{
		ID:          input.ID,
		Name:        input.Name,
		Description: input.Description,
		UploadedAt:  time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := database.DB.Create(&ds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ds)
}

// UpsertDataset POST /api/datasets/:dataset_id
func UpsertDataset(c *gin.Context) {
	datasetID := c.Param("dataset_id")
	var updatedData map[string]interface{}
	if err := c.ShouldBindJSON(&updatedData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// class_ids, image_ids 처리(관계 갱신) 같은 것은
	// GORM에서 별도로 로직을 짜야 합니다.

	// 우선 해당 dataset이 존재하는지 체크
	var ds models.Dataset
	err := database.DB.Where("id = ?", datasetID).First(&ds).Error
	if err != nil {
		// 없으면 새로 생성
		if err := createNewDataset(datasetID, updatedData, c); err != nil {
			// createNewDataset 내부에서 이미 c.JSON 했다고 가정
			return
		}
	} else {
		// 있으면 업데이트
		// updatedData의 key가 SnakeCase인지 CamelCase인지 맞춰 사용
		// 여기선 그냥 "name", "description" 정도만 있다고 가정
		if val, ok := updatedData["name"]; ok {
			ds.Name = val.(string)
		}
		if val, ok := updatedData["description"]; ok {
			ds.Description = val.(string)
		}
		ds.UpdatedAt = time.Now()

		if err := database.DB.Save(&ds).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// 관계 테이블 업데이트 필요 시 처리
		// ...

		c.JSON(http.StatusOK, ds)
	}
}

func createNewDataset(datasetID string, data map[string]interface{}, c *gin.Context) error {
	ds := models.Dataset{
		ID: datasetID,
	}
	if val, ok := data["name"]; ok {
		ds.Name = val.(string)
	}
	if val, ok := data["description"]; ok {
		ds.Description = val.(string)
	}
	ds.UploadedAt = time.Now()
	ds.UpdatedAt = time.Now()

	if err := database.DB.Create(&ds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return err
	}

	c.JSON(http.StatusOK, ds)
	return nil
}

// GetDataset GET /api/datasets/:dataset_id
func GetDataset(c *gin.Context) {
	datasetID := c.Param("dataset_id")
	var ds models.Dataset
	if err := database.DB.Where("id = ?", datasetID).First(&ds).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dataset not found"})
		return
	}

	// 필요하면 dataset → images/classes 로딩
	// if err := database.DB.Model(&ds).Association("Images").Find(&ds.Images); err != nil { ... }

	c.JSON(http.StatusOK, ds)
}

// DeleteDataset DELETE /api/datasets/:dataset_id
func DeleteDataset(c *gin.Context) {
	datasetID := c.Param("dataset_id")
	var ds models.Dataset
	if err := database.DB.Where("id = ?", datasetID).First(&ds).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dataset not found"})
		return
	}

	// Python 코드에서는 연결된 이미지 삭제/thumbnail 삭제 등 로직이 있음
	// Go에서도 비슷하게 처리해주려면, dataset_images 테이블 등을 먼저 읽고
	// 이미지가 여러 dataset과 연결되었는지 체크 후 파일 삭제 or 그냥 관계만 해제 등...
	// 여기서는 간단히 dataset만 지우는 예시
	if err := database.DB.Delete(&ds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Dataset %s deleted", datasetID)})
}
