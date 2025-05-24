package utils

import (
	"strings"
	"unicode"
)

// ToSnakeCase converts a camelCase (or PascalCase) string to snake_case.
func ToSnakeCase(s string) string {
	var result []rune
	for i, r := range s {
		if unicode.IsUpper(r) {
			if i > 0 {
				result = append(result, '_')
			}
			result = append(result, unicode.ToLower(r))
		} else {
			result = append(result, r)
		}
	}
	return string(result)
}

func ToCamelCase(s string) string {
	parts := strings.Split(s, "_")
	if len(parts) == 0 {
		return s
	}
	// 첫 단어는 그대로 소문자 사용
	camel := parts[0]
	for i := 1; i < len(parts); i++ {
		if len(parts[i]) > 0 {
			// 첫 글자를 대문자로 만들고 나머지는 그대로 붙임
			camel += strings.Title(parts[i])
		}
	}
	return camel
}

// ConvertCamelMapToSnake converts all keys in the given map from camelCase to snake_case.
// 예: { "datasetIds": [...], "fileLocation": "xxx" } => { "dataset_ids": [...], "file_location": "xxx" }
func ConvertCamelMapToSnake(data map[string]interface{}) map[string]interface{} {
	newMap := make(map[string]interface{})
	for key, val := range data {
		newKey := ToSnakeCase(key)
		// 값이 또 map[string]interface{}인 경우는 재귀적으로 변환
		if subMap, ok := val.(map[string]interface{}); ok {
			newMap[newKey] = ConvertCamelMapToSnake(subMap)
		} else if list, ok := val.([]interface{}); ok {
			// 배열 안에 map이 있다면 재귀적으로 처리
			for i, elem := range list {
				if elemMap, ok := elem.(map[string]interface{}); ok {
					list[i] = ConvertCamelMapToSnake(elemMap)
				}
			}
			newMap[newKey] = list
		} else {
			newMap[newKey] = val
		}
	}
	return newMap
}

// ConvertSnakeMapToCamel converts all keys in the given map from snake_case to camelCase.
// 예: { "file_location": "xxx", "thumbnail_location": "yyy" } => { "fileLocation": "xxx", "thumbnailLocation": "yyy" }
func ConvertSnakeMapToCamel(data map[string]interface{}) map[string]interface{} {
	newMap := make(map[string]interface{})
	for key, val := range data {
		newKey := ToCamelCase(key)
		switch v := val.(type) {
		case map[string]interface{}:
			newMap[newKey] = ConvertSnakeMapToCamel(v)
		case []interface{}:
			for i, elem := range v {
				if elemMap, ok := elem.(map[string]interface{}); ok {
					v[i] = ConvertSnakeMapToCamel(elemMap)
				}
			}
			newMap[newKey] = v
		default:
			newMap[newKey] = val
		}
	}
	return newMap
}
