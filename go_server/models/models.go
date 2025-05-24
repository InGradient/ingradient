package models

import (
	"time"

	"gorm.io/datatypes"
)

// ---------------- Enums ---------------- //
type RoleEnum string

const (
	RoleViewer RoleEnum = "viewer"
	RoleEditor RoleEnum = "editor"
	RoleOwner  RoleEnum = "owner"
)

// ---------------- User ---------------- //
type User struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex" json:"username"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	// M:N 관계: User ↔ Project (중간 테이블 project_users 사용)
	Projects []Project `gorm:"many2many:project_users;" json:"projects"`
}

// ---------------- Project ---------------- //
type Project struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`

	// M:N 관계: Project ↔ User via project_users, Project ↔ Dataset via project_datasets
	Users    []User    `gorm:"many2many:project_users;" json:"users"`
	Datasets []Dataset `gorm:"many2many:project_datasets;" json:"datasets"`
}

// ---------------- Dataset ---------------- //
type Dataset struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	UploadedAt  time.Time `gorm:"autoCreateTime" json:"uploaded_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// M:N 관계: Dataset ↔ Class, Dataset ↔ Image, Dataset ↔ Project
	Classes  []Class   `gorm:"many2many:dataset_classes;" json:"classes"`
	Images   []Image   `gorm:"many2many:dataset_images;" json:"images"`
	Projects []Project `gorm:"many2many:project_datasets;" json:"projects"`
}

// ---------------- Class ---------------- //
type Class struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	// M:N 관계: Class ↔ Dataset, Class ↔ Image
	Datasets []Dataset `gorm:"many2many:dataset_classes;" json:"datasets"`
	Images   []Image   `gorm:"many2many:class_images;" json:"images"`

	// 추가: 1:N 관계 (BoundingBox, KeyPoint, Segmentation)
	BoundingBoxes []BoundingBox  `gorm:"foreignKey:ClassID" json:"bounding_boxes"`
	KeyPoints     []KeyPoint     `gorm:"foreignKey:ClassID" json:"key_points"`
	Segmentations []Segmentation `gorm:"foreignKey:ClassID" json:"segmentations"`
}

// ---------------- Image ---------------- //
type Image struct {
	ID                string    `gorm:"primaryKey" json:"id"`
	Filename          string    `json:"filename"`
	FileLocation      string    `json:"file_location"`
	ThumbnailLocation string    `json:"thumbnail_location"`
	UploadAt          time.Time `gorm:"autoCreateTime" json:"upload_at"`
	UpdatedAt         time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	Approval   string `json:"approval"`
	Comment    string `json:"comment"`
	LabeledBy  string `json:"labeled_by"`
	EditedBy   string `json:"edited_by"`
	UploadedBy string `json:"uploaded_by"`

	Height int    `json:"height"`
	Width  int    `json:"width"`
	Type   string `json:"type"`
	Size   int    `json:"size"`

	Properties datatypes.JSON `json:"properties" gorm:"type:json;default:'{\"description\":\"\", \"comment\":\"\"}'"`

	// M:N 관계: Image ↔ Dataset, Image ↔ Class
	Datasets []Dataset `gorm:"many2many:dataset_images;" json:"datasets"`
	Classes  []Class   `gorm:"many2many:class_images;" json:"classes"`

	// 1:N 관계
	BoundingBoxes []BoundingBox  `gorm:"foreignKey:ImageID" json:"bounding_boxes"`
	KeyPoints     []KeyPoint     `gorm:"foreignKey:ImageID" json:"key_points"`
	Segmentations []Segmentation `gorm:"foreignKey:ImageID" json:"segmentations"`

	ImageFeatures []ImageFeature `gorm:"foreignKey:ImageID" json:"image_features"`
}

// ---------------- BoundingBox ---------------- //
type BoundingBox struct {
	ID      string  `gorm:"primaryKey" json:"id"`
	ImageID string  `json:"image_id"`
	ClassID string  `json:"class_id"`
	XMin    float64 `json:"x_min"`
	YMin    float64 `json:"y_min"`
	XMax    float64 `json:"x_max"`
	YMax    float64 `json:"y_max"`

	Confidence float64   `json:"confidence"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// ---------------- KeyPoint ---------------- //
type KeyPoint struct {
	ID         string    `gorm:"primaryKey" json:"id"`
	ImageID    string    `json:"image_id"`
	ClassID    string    `json:"class_id"`
	X          float64   `json:"x"`
	Y          float64   `json:"y"`
	Confidence float64   `json:"confidence"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// ---------------- Segmentation ---------------- //
type Segmentation struct {
	ID         string    `gorm:"primaryKey" json:"id"`
	ImageID    string    `json:"image_id"`
	ClassID    string    `json:"class_id"`
	Mask       string    `json:"mask"` // 예: JSON 문자열, RLE 등
	Confidence float64   `json:"confidence"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// ---------------- AIModel ---------------- //
type AIModel struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	Name         string    `json:"name"`
	FileLocation string    `json:"file_location"`
	InputWidth   int       `json:"input_width"`
	InputHeight  int       `json:"input_height"`
	Purpose      string    `json:"purpose"`
	UploadedAt   time.Time `gorm:"autoCreateTime" json:"uploaded_at"`

	ImageFeatures []ImageFeature `gorm:"foreignKey:ModelID" json:"image_features"`
}

// ---------------- ImageFeature ---------------- //
type ImageFeature struct {
	ImageID      string    `gorm:"primaryKey" json:"image_id"`
	ModelID      string    `gorm:"primaryKey" json:"model_id"`
	FeatureID    string    `json:"feature_id"`
	FeatureIntID int       `json:"feature_int_id"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
}
