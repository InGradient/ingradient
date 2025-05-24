package routes

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/ingradient/ingradient/go_server/database"
	"github.com/ingradient/ingradient/go_server/dto"
	"github.com/ingradient/ingradient/go_server/models"
)

// ListImages (GET /api/images/)
func ListImages(c *gin.Context) {
	datasetIDs := c.QueryArray("dataset_ids") // ?dataset_ids=xxx&dataset_ids=yyy

	var images []models.Image
	var err error

	// Preload("Classes")를 사용하여 각 이미지의 연결된 Classes 데이터를 미리 로드함.
	if len(datasetIDs) > 0 {
		err = database.DB.Preload("Classes").
			Model(&models.Image{}).
			Joins("JOIN dataset_images di ON di.image_id = images.id").
			Where("di.dataset_id IN ?", datasetIDs).
			Distinct().
			Find(&images).Error
	} else {
		err = database.DB.Preload("Classes").Find(&images).Error
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 필요한 데이터만 선택해서 반환. 예를 들어, 각 이미지에 연결된 클래스 ID 리스트(classIds)
	var results []map[string]interface{}
	for _, img := range images {
		// 연결된 클래스 목록에서 ID만 추출
		classIds := make([]string, 0, len(img.Classes))
		for _, cls := range img.Classes {
			classIds = append(classIds, cls.ID)
		}

		// 필요한 키들을 map에 담아서, 필요하다면 snake_case -> camelCase 변환(여기서는 수동 변환 예시)
		result := map[string]interface{}{
			"id":                img.ID,
			"filename":          img.Filename,
			"fileLocation":      img.FileLocation,
			"thumbnailLocation": img.ThumbnailLocation,
			"width":             img.Width,
			"height":            img.Height,
			"approval":          img.Approval,
			"comment":           img.Comment,
			"classIds":          classIds,
			"properties":        img.Properties,
			// "model":             img.ExtractedFeatures, // img.ExtractedFeatures가 정의되어 있다면
			"uploadAt":  img.UploadAt,
			"updatedAt": img.UpdatedAt,
		}
		results = append(results, result)
	}

	c.JSON(http.StatusOK, results)
}

// GetImage (GET /api/images/:image_id)
func GetImage(c *gin.Context) {
	imageID := c.Param("image_id")
	var img models.Image
	if err := database.DB.Where("id = ?", imageID).First(&img).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	c.JSON(http.StatusOK, img)
}

// UpsertImage (POST /api/images/:image_id)
func UpsertImage(c *gin.Context) {
	// URL 파라미터로 이미지 ID 받기
	imageID := c.Param("image_id")

	// 1) JSON 바디 → ImageUpsertReq 구조체
	var req dto.ImageUpsertReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2) DB에서 이미지 조회
	var img models.Image
	if err := database.DB.Where("id = ?", imageID).First(&img).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// (2-1) 레코드 없으면 새로 생성
			img = models.Image{
				ID:                imageID,
				Filename:          req.Filename,
				FileLocation:      req.FileLocation,
				ThumbnailLocation: req.ThumbnailLocation,
				Approval:          req.Approval,
				Comment:           req.Comment,
				Height:            req.Height,
				Width:             req.Width,
				Type:              req.Type,
				Size:              req.Size,
			}
			if errCreate := database.DB.Create(&img).Error; errCreate != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": errCreate.Error()})
				return
			}
		} else {
			// (2-2) 다른 DB 에러
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		// (2-3) 기존 레코드 업데이트
		img.Filename = req.Filename
		img.FileLocation = req.FileLocation
		img.ThumbnailLocation = req.ThumbnailLocation
		img.Approval = req.Approval
		img.Comment = req.Comment
		img.Height = req.Height
		img.Width = req.Width
		img.Type = req.Type
		img.Size = req.Size

		if errSave := database.DB.Save(&img).Error; errSave != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": errSave.Error()})
			return
		}
	}

	// 3) Many2Many 관계: Datasets
	if req.DatasetIDs != nil {
		database.DB.Model(&img).Association("Datasets").Clear()
		for _, dsID := range req.DatasetIDs {
			var ds models.Dataset
			if err := database.DB.Where("id = ?", dsID).First(&ds).Error; err == nil {
				database.DB.Model(&img).Association("Datasets").Append(&ds)
			}
		}
	}

	// 4) Many2Many 관계: Classes
	if req.ClassIDs != nil {
		database.DB.Model(&img).Association("Classes").Clear()
		for _, clID := range req.ClassIDs {
			var classObj models.Class
			if err := database.DB.Where("id = ?", clID).First(&classObj).Error; err == nil {
				database.DB.Model(&img).Association("Classes").Append(&classObj)
			}
		}
	}

	// 5) 최종 응답
	c.JSON(http.StatusOK, img)
}

// DeleteImage (DELETE /api/images/:image_id)
func DeleteImage(c *gin.Context) {
	imageID := c.Param("image_id")
	selectedDatasetIDs := c.QueryArray("selected_dataset_ids") // ?selected_dataset_ids=xxx

	var img models.Image
	if err := database.DB.Where("id = ?", imageID).First(&img).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	if len(selectedDatasetIDs) > 0 {
		// 특정 dataset과의 연결만 해제
		// 1) img.datasets 중에서 selectedDatasetIDs에 해당하는 부분만 Remove
		for _, dsID := range selectedDatasetIDs {
			var ds models.Dataset
			if err := database.DB.Where("id = ?", dsID).First(&ds).Error; err == nil {
				database.DB.Model(&img).Association("Datasets").Delete(&ds)
			}
		}
		// 연결 해제 후 여전히 연결된 dataset이 없으면 이미지 삭제
		// 다시 DB에서 refresh
		database.DB.Where("id = ?", imageID).First(&img)
		// Preload datasets
		dsCount := database.DB.Model(&img).Association("Datasets").Count()
		if dsCount == 0 {
			// 완전 삭제
			deleteImageFiles(img)
			database.DB.Delete(&img)
			c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Image %s fully deleted", imageID)})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Image %s unlinked from datasets %v", imageID, selectedDatasetIDs)})
	} else {
		// dataset_id 지정이 없으면 파일+DB 완전 삭제
		deleteImageFiles(img)
		database.DB.Delete(&img)
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Image %s and associated files deleted", imageID)})
	}
}

func deleteImageFiles(img models.Image) {
	// 파일 삭제
	if img.FileLocation != "" {
		if err := os.Remove(img.FileLocation); err != nil {
			fmt.Println("Failed to delete file:", err)
		}
	}
	if img.ThumbnailLocation != "" {
		if err := os.Remove(img.ThumbnailLocation); err != nil {
			fmt.Println("Failed to delete thumbnail:", err)
		}
	}
}
