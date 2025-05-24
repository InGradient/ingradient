package routes

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/disintegration/imaging"
	"github.com/ingradient/ingradient/go_server/config"
)

func createThumbnail(originalPath, thumbnailPath string) error {
	// 이미지를 연다.
	img, err := imaging.Open(originalPath)
	if err != nil {
		return fmt.Errorf("failed to open image: %w", err)
	}

	// 예시: 150x150 크기로 썸네일 생성 (비율 유지가 필요하면 다른 함수 사용 가능)
	thumb := imaging.Thumbnail(img, 150, 150, imaging.Lanczos)

	// 썸네일 파일 저장
	err = imaging.Save(thumb, thumbnailPath)
	if err != nil {
		return fmt.Errorf("failed to save thumbnail: %w", err)
	}

	return nil
}

// UploadFile (POST /api/uploads/upload-file)
func UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fileID := uuid.NewString()
	fname := fmt.Sprintf("%s_%s", fileID, file.Filename)

	folderPath := filepath.Join(config.UploadDir, "images")
	thumbnailFolder := filepath.Join(config.UploadDir, "thumbnails")
	os.MkdirAll(folderPath, 0755)
	os.MkdirAll(thumbnailFolder, 0755)

	fileLocation := filepath.Join(folderPath, fname)
	if err := c.SaveUploadedFile(file, fileLocation); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	thumbnailLocation := filepath.Join(thumbnailFolder, fname)

	// createThumbnail 호출
	if err := createThumbnail(fileLocation, thumbnailLocation); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Thumbnail generation failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":                fileID,
		"filename":          file.Filename,
		"fileLocation":      fileLocation,
		"thumbnailLocation": thumbnailLocation,
	})
}

// UploadTempFile (POST /api/uploads/upload-temp)
func UploadTempFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sessionID := c.PostForm("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id is required"})
		return
	}

	tmpSessionFolder := filepath.Join(config.TmpFolder, sessionID)
	os.MkdirAll(tmpSessionFolder, 0755)

	fileID := uuid.NewString()
	tmpFilename := fmt.Sprintf("%s_%s", fileID, file.Filename)
	tmpFilePath := filepath.Join(tmpSessionFolder, tmpFilename)

	if err := c.SaveUploadedFile(file, tmpFilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"fileId":       fileID,
		"filename":     file.Filename,
		"tempLocation": tmpFilePath,
	})
}

// CommitUploads (POST /api/uploads/commit-uploads)
func CommitUploads(c *gin.Context) {
	// multipart/form-data로부터 session_id와 file_ids를 읽음.
	sessionID := c.PostForm("session_id")
	fileIDs := c.PostFormArray("file_ids")

	// 로그로 값 확인
	fmt.Printf("CommitUploads: session_id=%s, file_ids=%v\n", sessionID, fileIDs)

	// session_id 혹은 file_ids가 없으면 에러 응답
	if sessionID == "" || len(fileIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id and file_ids are required"})
		return
	}

	finalFolder := filepath.Join(config.UploadDir, "images")
	thumbnailFolder := filepath.Join(config.UploadDir, "thumbnails")
	os.MkdirAll(finalFolder, 0755)
	os.MkdirAll(thumbnailFolder, 0755)

	tmpSessionFolder := filepath.Join(config.TmpFolder, sessionID)
	movedFilesInfo := []map[string]string{}

	entries, err := os.ReadDir(tmpSessionFolder)
	if err != nil {
		fmt.Printf("CommitUploads: error reading tmp folder %s: %v\n", tmpSessionFolder, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("CommitUploads: found %d entries in tmp folder\n", len(entries))

	for _, fileID := range fileIDs {
		var matchedFileName string
		for _, e := range entries {
			// 파일 이름이 fileID로 시작하는지 확인
			if !e.IsDir() && len(e.Name()) > len(fileID) && e.Name()[:len(fileID)] == fileID {
				matchedFileName = e.Name()
				break
			}
		}
		if matchedFileName == "" {
			fmt.Printf("CommitUploads: No matching file for fileID: %s\n", fileID)
			continue
		}
		tmpFilePath := filepath.Join(tmpSessionFolder, matchedFileName)
		finalFilePath := filepath.Join(finalFolder, matchedFileName)

		// 파일 이동
		if err := os.Rename(tmpFilePath, finalFilePath); err != nil {
			fmt.Printf("CommitUploads: rename error %s -> %s: %v\n", tmpFilePath, finalFilePath, err)
		} else {
			fmt.Printf("CommitUploads: moved file %s to %s\n", tmpFilePath, finalFilePath)
		}

		// 썸네일 생성 (필요 시 createThumbnail 함수 호출)
		thumbnailPath := filepath.Join(thumbnailFolder, matchedFileName)
		// 만약 createThumbnail 같은 함수가 있다면 호출
		// err := createThumbnail(finalFilePath, thumbnailPath)
		// if err != nil { ... }

		// 파일 이름을 uuid_원본이름 형태에서 원본 이름만 추출
		tokens := strings.SplitN(matchedFileName, "_", 2)
		actualFilename := matchedFileName
		if len(tokens) == 2 {
			actualFilename = tokens[1]
		}

		movedFilesInfo = append(movedFilesInfo, map[string]string{
			"id":                fileID,
			"filename":          actualFilename,
			"fileLocation":      finalFilePath,
			"thumbnailLocation": thumbnailPath,
		})
	}

	fmt.Printf("CommitUploads: movedFilesInfo: %+v\n", movedFilesInfo)
	c.JSON(http.StatusOK, gin.H{
		"status":     "ok",
		"movedFiles": movedFilesInfo,
	})
}

// CancelUploads (DELETE /api/uploads/cancel-uploads)
func CancelUploads(c *gin.Context) {
	sessionID := c.PostForm("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id is required"})
		return
	}
	tmpSessionFolder := filepath.Join(config.TmpFolder, sessionID)
	os.RemoveAll(tmpSessionFolder)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// DownloadFile (GET /api/uploads/download/:filename)
func DownloadFile(c *gin.Context) {
	filename := c.Param("filename")
	filePath := filepath.Join(config.UploadDir, filename)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// 실제 파일 다운로드 응답
	c.File(filePath)
}
