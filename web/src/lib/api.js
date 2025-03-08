import axios from "axios";
import qs from "qs"; 

/**
 * =========================
 *  1) Dataset CRUD
 * =========================
 */

// [GET] 모든 Dataset 목록
export async function listDatasets() {
  const res = await axios.get(`/api/datasets`);
  return res.data;
}

// [POST] 새로운 Dataset 생성
// dataset: { id, name, description? }
export async function createDataset(dataset) {
  const res = await axios.post(`/api/datasets`, dataset);
  return res.data;
}

// [GET] 단일 Dataset 조회
export async function getDataset(datasetId) {
  const res = await axios.get(`/api/datasets/${datasetId}`);
  return res.data;
}

// [PUT] Dataset 수정
// updatedData: { name?, description? }
export async function updateDataset(datasetId, updatedData) {
  const res = await axios.put(`/api/datasets/${datasetId}`, updatedData);
  return res.data;
}

export async function upsertDataset(datasetId, updatedData) {
  const res = await axios.put(`/api/datasets/${datasetId}`, updatedData);
  return res.data;
}

// [DELETE] Dataset 삭제
export async function deleteDataset(datasetId) {
  const res = await axios.delete(`/api/datasets/${datasetId}`);
  return res.data;
}

/**
 * =========================
 *  2) Class CRUD
 * =========================
 */

// [GET] 모든 Class 목록
export async function listClasses() {
  const res = await axios.get(`/api/classes`);
  return res.data;
}

// [POST] 새로운 Class 생성
// cls: { id, name, color?, dataset_id? }
export async function createClass(cls) {
  console.log("Create Class:", cls);
  const res = await axios.post(`/api/classes`, cls);
  return res.data;
}

// [GET] 단일 Class 조회
export async function getClass(classId) {
  const res = await axios.get(`/api/classes/${classId}`);
  return res.data;
}

// [PUT] Class 수정
// updatedData: { name?, color?, dataset_id? }
export async function updateClass(classId, updatedData) {
  console.log("Updated Class Data:", updatedData);
  const res = await axios.put(`/api/classes/${classId}`, updatedData);
  return res.data;
}

export async function upsertClass(classId, updatedData) {
  console.log("Upsert Class ", classId, updatedData)
  const res = await axios.post(`/api/classes/${classId}`, updatedData);
  return res.data;
}

// [DELETE] Class 삭제
export async function deleteClass(classId) {
  const res = await axios.delete(`/api/classes/${classId}`);
  return res.data;
}

/**
 * =========================
 *  3) Image CRUD
 * =========================
 */

// [GET] 모든 Image 목록
export async function listImages(datasetIds = []) {
  const res = await axios.get("/api/images", {
    params: { dataset_ids: datasetIds },
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }), // ✅ 배열 직렬화
  });
  return res.data;
}

export async function upsertImage(imageId, updatedData) {
  const res = await axios.post(`/api/images/${imageId}`, updatedData);
  return res.data;
}

// [POST] 새로운 Image 생성 (DB에만 추가)
// img: { id, filename, upload_path, image_url, dataset_id, class_id, etc. }
export async function createImage(id, file, userId, datasetIds = []) {
  const formData = new FormData();
  formData.append('file', file);  // 파일 추가
  formData.append('id', id);
  formData.append('user_id', userId);
  formData.append('dataset_ids', JSON.stringify(datasetIds)); // 배열은 JSON으로 변환

  console.log("API createImage FormData:", [...formData.entries()]);

  try {
    const res = await axios.post(`/api/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data' // ✅ FormData 전송
      }
    });
    return res.data;
  } catch (error) {
    console.error("API Error (createImage):", error);
    return { error: error.response?.data || error.message };
  }
}

// [GET] 단일 Image 조회
export async function getImage(imageId) {
  const res = await axios.get(`/api/images/${imageId}`);
  return res.data;
}

// [PUT] Image 수정
// updatedData: { dataset_id?, class_id?, approval?, comment?, ... }
export async function updateImage(imageId, updatedData) {
  const res = await axios.put(`/api/images/${imageId}`, updatedData);
  return res.data;
}

export async function deleteImage(imageId, selectedDatasetIds = []) {
  const res = await axios.delete(`/api/images/${imageId}`, {
    params: { selected_dataset_ids: selectedDatasetIds },
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
  });
  return res.data;
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post(`/api/upload-file`, formData);
  return res.data;
}