package dto

import (
	"gorm.io/datatypes"
)

type ImageUpsertReq struct {
	Filename          string `json:"filename"`
	FileLocation      string `json:"fileLocation"`
	ThumbnailLocation string `json:"thumbnailLocation"`
	Approval          string `json:"approval"`
	Comment           string `json:"comment"`
	Height            int    `json:"height"`
	Width             int    `json:"width"`
	Type              string `json:"type"`
	Size              int    `json:"size"`
	// Properties 타입을 datatypes.JSON으로 설정
	Properties datatypes.JSON `json:"properties"`
	DatasetIDs []string       `json:"datasetIds"`
	ClassIDs   []string       `json:"classIds"`
}
