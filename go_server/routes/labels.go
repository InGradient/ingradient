package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ingradient/ingradient/go_server/database"
	"github.com/ingradient/ingradient/go_server/models"
)

// UpdateLabels (POST /api/labels/)
func UpdateLabels(c *gin.Context) {
	var reqData struct {
		ImageID       string                `json:"imageId"`
		BoundingBoxes []models.BoundingBox  `json:"boundingBoxes"`
		KeyPoints     []models.KeyPoint     `json:"keyPoints"`
		Segmentations []models.Segmentation `json:"segmentations"`
	}
	if err := c.ShouldBindJSON(&reqData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if reqData.ImageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image_id is required"})
		return
	}

	// 기존 bounding box, keypoint, segmentation 삭제
	database.DB.Where("image_id = ?", reqData.ImageID).Delete(&models.BoundingBox{})
	database.DB.Where("image_id = ?", reqData.ImageID).Delete(&models.KeyPoint{})
	database.DB.Where("image_id = ?", reqData.ImageID).Delete(&models.Segmentation{})

	// 새로 삽입
	for i := range reqData.BoundingBoxes {
		reqData.BoundingBoxes[i].ImageID = reqData.ImageID
		database.DB.Create(&reqData.BoundingBoxes[i])
	}
	for i := range reqData.KeyPoints {
		reqData.KeyPoints[i].ImageID = reqData.ImageID
		database.DB.Create(&reqData.KeyPoints[i])
	}
	for i := range reqData.Segmentations {
		reqData.Segmentations[i].ImageID = reqData.ImageID
		database.DB.Create(&reqData.Segmentations[i])
	}

	c.JSON(http.StatusOK, gin.H{
		"imageId":       reqData.ImageID,
		"boundingBoxes": reqData.BoundingBoxes,
		"keyPoints":     reqData.KeyPoints,
		"segmentations": reqData.Segmentations,
	})
}

// ListLabels (GET /api/labels/?image_id=xxx)
func ListLabels(c *gin.Context) {
	imageID := c.Query("image_id")
	if imageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image_id query param is required"})
		return
	}

	var bboxes []models.BoundingBox
	var kps []models.KeyPoint
	var segs []models.Segmentation

	database.DB.Where("image_id = ?", imageID).Find(&bboxes)
	database.DB.Where("image_id = ?", imageID).Find(&kps)
	database.DB.Where("image_id = ?", imageID).Find(&segs)

	c.JSON(http.StatusOK, gin.H{
		"boundingBoxes": bboxes,
		"keyPoints":     kps,
		"segmentations": segs,
	})
}
