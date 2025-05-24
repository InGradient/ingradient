package routes

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

type PluginInfo struct {
	Name        string   `json:"name"`
	Title       string   `json:"title"`
	Version     string   `json:"version"`
	Task        string   `json:"task"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

func ListPlugins(c *gin.Context) {
	root := filepath.Join("..", "plugins") // plugins 디렉토리 상대 경로
	entries, err := os.ReadDir(root)
	if err != nil {
		log.Println("Error reading plugins directory:", err)
		c.JSON(500, gin.H{"error": "Failed to read plugins directory"})
		return
	}

	var plugins []PluginInfo

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		manifestPath := filepath.Join(root, entry.Name(), "manifest.json")
		data, err := ioutil.ReadFile(manifestPath)
		if err != nil {
			log.Printf("Failed to read manifest for %s: %v\n", entry.Name(), err)
			continue
		}

		var info PluginInfo
		if err := json.Unmarshal(data, &info); err != nil {
			log.Printf("Invalid manifest.json in %s: %v\n", entry.Name(), err)
			continue
		}

		plugins = append(plugins, info)
	}

	c.JSON(200, gin.H{"plugins": plugins})
}
