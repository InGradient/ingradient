package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/ingradient/ingradient/go_server/database"
	"github.com/ingradient/ingradient/go_server/models"
)

// ListClasses (GET /api/classes/)
func ListClasses(c *gin.Context) {
	var classes []models.Class
	if err := database.DB.Find(&classes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Python 예시처럼 camelCase 변환 등을 하려면 별도 함수를 쓰거나 수작업
	// 여기서는 단순히 직렬화만
	c.JSON(http.StatusOK, classes)
}

// UpsertClass (POST /api/classes/:class_id)
func UpsertClass(c *gin.Context) {
	classID := c.Param("class_id")

	var reqData map[string]interface{}
	if err := c.ShouldBindJSON(&reqData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// dataset_ids, image_ids 추출
	newDatasetIDs, _ := reqData["dataset_ids"].([]interface{})
	newImageIDs, _ := reqData["image_ids"].([]interface{})

	// 해당 class가 있는지 확인
	var classObj models.Class
	err := database.DB.Where("id = ?", classID).First(&classObj).Error
	if err == gorm.ErrRecordNotFound {
		// 없으면 새로 생성
		classObj.ID = classID
		if nameVal, ok := reqData["name"].(string); ok {
			classObj.Name = nameVal
		}
		if colorVal, ok := reqData["color"].(string); ok {
			classObj.Color = colorVal
		}

		if errCreate := database.DB.Create(&classObj).Error; errCreate != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": errCreate.Error()})
			return
		}
	} else if err == nil {
		// 있으면 업데이트
		if nameVal, ok := reqData["name"].(string); ok {
			classObj.Name = nameVal
		}
		if colorVal, ok := reqData["color"].(string); ok {
			classObj.Color = colorVal
		}
		if errSave := database.DB.Save(&classObj).Error; errSave != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": errSave.Error()})
			return
		}
	} else {
		// DB 에러
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Many2Many 관계 업데이트 (예: class <-> datasets, class <-> images)
	// GORM에서 다대다를 업데이트하려면 적절히 Association을 사용해야 합니다.
	// (중간 테이블이 dataset_classes, class_images 라고 가정)
	if newDatasetIDs != nil {
		// 1) 기존 관계 초기화 (Clear)
		database.DB.Model(&classObj).Association("Datasets").Clear()
		// 2) 새 Datasets 찾아서 Append
		for _, dsID := range newDatasetIDs {
			dsStr, _ := dsID.(string)
			var ds models.Dataset
			if err := database.DB.Where("id = ?", dsStr).First(&ds).Error; err == nil {
				database.DB.Model(&classObj).Association("Datasets").Append(&ds)
			}
		}
	}

	if newImageIDs != nil {
		database.DB.Model(&classObj).Association("Images").Clear()
		for _, imgID := range newImageIDs {
			imgStr, _ := imgID.(string)
			var img models.Image
			if err := database.DB.Where("id = ?", imgStr).First(&img).Error; err == nil {
				database.DB.Model(&classObj).Association("Images").Append(&img)
			}
		}
	}

	c.JSON(http.StatusOK, classObj)
}

// GetClass (GET /api/classes/:class_id)
func GetClass(c *gin.Context) {
	classID := c.Param("class_id")
	var classObj models.Class
	if err := database.DB.Where("id = ?", classID).First(&classObj).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
		return
	}

	c.JSON(http.StatusOK, classObj)
}

// UpdateClass (PUT /api/classes/:class_id)
func UpdateClass(c *gin.Context) {
	classID := c.Param("class_id")
	var classObj models.Class
	if err := database.DB.Where("id = ?", classID).First(&classObj).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
		return
	}

	var reqData map[string]interface{}
	if err := c.ShouldBindJSON(&reqData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if nameVal, ok := reqData["name"].(string); ok {
		classObj.Name = nameVal
	}
	if colorVal, ok := reqData["color"].(string); ok {
		classObj.Color = colorVal
	}
	if errSave := database.DB.Save(&classObj).Error; errSave != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": errSave.Error()})
		return
	}

	c.JSON(http.StatusOK, classObj)
}

// DeleteClass (DELETE /api/classes/:class_id)
func DeleteClass(c *gin.Context) {
	classID := c.Param("class_id")
	var classObj models.Class
	if err := database.DB.Where("id = ?", classID).First(&classObj).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
		return
	}

	if err := database.DB.Delete(&classObj).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Class " + classID + " deleted"})
}
