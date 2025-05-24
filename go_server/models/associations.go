package models

// DatasetClasses - "dataset_classes" 테이블 구조 (Dataset ↔ Class)
type DatasetClasses struct {
	DatasetID string `gorm:"primaryKey;column:dataset_id"`
	ClassID   string `gorm:"primaryKey;column:class_id"`
}

// TableName 커스텀
func (DatasetClasses) TableName() string {
	return "dataset_classes"
}

// DatasetImages - "dataset_images" 테이블 구조 (Dataset ↔ Image)
type DatasetImages struct {
	DatasetID string `gorm:"primaryKey;column:dataset_id"`
	ImageID   string `gorm:"primaryKey;column:image_id"`
}

func (DatasetImages) TableName() string {
	return "dataset_images"
}

// ClassImages - "class_images" 테이블 구조 (Class ↔ Image)
type ClassImages struct {
	ClassID string `gorm:"primaryKey;column:class_id"`
	ImageID string `gorm:"primaryKey;column:image_id"`
}

func (ClassImages) TableName() string {
	return "class_images"
}

// ProjectDatasets - "project_datasets" 테이블 (Project ↔ Dataset)
type ProjectDatasets struct {
	ProjectID string `gorm:"primaryKey;column:project_id"`
	DatasetID string `gorm:"primaryKey;column:dataset_id"`
}

func (ProjectDatasets) TableName() string {
	return "project_datasets"
}

// ProjectUsers - "project_users" 테이블 (Project ↔ User)
type ProjectUsers struct {
	ProjectID string   `gorm:"primaryKey;column:project_id"`
	UserID    string   `gorm:"primaryKey;column:user_id"`
	Role      RoleEnum `gorm:"type:varchar(20);default:'viewer'"`
}

func (ProjectUsers) TableName() string {
	return "project_users"
}
