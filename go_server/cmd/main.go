package main

import (
	"encoding/json"
	"fmt"
	"os/exec"

	"github.com/gin-gonic/gin"
	"github.com/ingradient/ingradient/go_server/config"
	"github.com/ingradient/ingradient/go_server/database"
	"github.com/ingradient/ingradient/go_server/routes"
)

func runPlugin(pluginName, input string) (string, error) {
	// go_server/cmd/main.go가 위치한 곳에서 plugin_executor.py는 상위 디렉토리(go_server) 안에 있으므로 경로를 "../plugin_executor.py"로 설정합니다.
	cmd := exec.Command("python3", "plugin_executor.py", "--plugin", pluginName, "--input", input)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to execute plugin: %w, output: %s", err, output)
	}
	var result map[string]string
	if err := json.Unmarshal(output, &result); err != nil {
		return "", fmt.Errorf("invalid output: %w, output: %s", err, output)
	}
	return result["result"], nil
}

func main() {
	// 설정, DB 초기화
	config.PrintConfig()
	database.InitDB()

	r := gin.Default()

	// CORS 미들웨어 등 추가
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}
		c.Next()
	})

	// ping
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// 정적 파일 서빙
	r.Static("/static", config.UploadDir)

	api := r.Group("/api")
	{
		// datasets
		datasets := api.Group("/datasets")
		{
			datasets.GET("/", routes.ListDatasets)
			datasets.POST("/", routes.CreateDataset)
			datasets.PUT("/:dataset_id", routes.UpsertDataset)
			datasets.GET("/:dataset_id", routes.GetDataset)
			datasets.DELETE("/:dataset_id", routes.DeleteDataset)
		}

		// classes
		classesRouter := api.Group("/classes")
		{
			classesRouter.GET("/", routes.ListClasses)
			classesRouter.POST("/:class_id", routes.UpsertClass)
			classesRouter.GET("/:class_id", routes.GetClass)
			classesRouter.PUT("/:class_id", routes.UpdateClass)
			classesRouter.DELETE("/:class_id", routes.DeleteClass)
		}

		// images
		imagesRouter := api.Group("/images")
		{
			imagesRouter.GET("/", routes.ListImages)
			imagesRouter.GET("/:image_id", routes.GetImage)
			imagesRouter.POST("/:image_id", routes.UpsertImage)
			imagesRouter.DELETE("/:image_id", routes.DeleteImage)
		}

		// labels
		labelsRouter := api.Group("/labels")
		{
			labelsRouter.POST("/", routes.UpdateLabels)
			labelsRouter.GET("/", routes.ListLabels)
		}

		// uploads
		uploadsRouter := api.Group("/uploads")
		{
			uploadsRouter.POST("/upload-file", routes.UploadFile)
			uploadsRouter.POST("/upload-temp", routes.UploadTempFile)
			uploadsRouter.POST("/commit-uploads", routes.CommitUploads)
			uploadsRouter.DELETE("/cancel-uploads", routes.CancelUploads)
			uploadsRouter.GET("/download/:filename", routes.DownloadFile)
		}

		api.GET("/plugins", routes.ListPlugins)
		api.POST("/plugin/:name", func(c *gin.Context) {
			pluginName := c.Param("name")
			var body struct {
				Input string `json:"input"`
			}
			if err := c.ShouldBindJSON(&body); err != nil {
				c.JSON(400, gin.H{"error": "Invalid JSON body"})
				return
			}
			result, err := runPlugin(pluginName, body.Input)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, gin.H{"result": result})
		})
	}

	host := "0.0.0.0"
	port := 8000
	addr := fmt.Sprintf("%s:%d", host, port)
	r.Run(addr)
}
