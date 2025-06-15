import axios from "axios";
import qs from "qs"; 

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL 
  ? `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}:${process.env.NEXT_PUBLIC_SERVER_PORT}`
  : "http://localhost:8000";

axios.defaults.baseURL = API_BASE_URL;

/**
 * =========================
 *  Authentication APIs
 * =========================
 */

export async function register(email, password) {
  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const response = await axios.post("/auth/register", formData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    console.error("Registration error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
}

export async function login(email, password, rememberMe = false) {
  try {
    const res = await axios.post("/auth/login", {
      email,
      password,
      rememberMe,
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  } catch (error) {
    console.error("Login error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
}

/**
 * =========================
 *  1) Dataset CRUD
 * =========================
 */

// [GET] 모든 Dataset 목록
export async function listDatasets() {
  const res = await axios.get(`/api/datasets/`);
  return res.data;
}

// [POST] 새로운 Dataset 생성
// dataset: { id, name, description? }
export async function createDataset(dataset) {
  const res = await axios.post(`/api/datasets/`, dataset);
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
  const res = await axios.get(`/api/classes/`);
  return res.data;
}

// [POST] 새로운 Class 생성
// cls: { id, name, color?, dataset_id? }
export async function createClass(cls) {
  const res = await axios.post(`/api/classes/`, cls);
  return res.data;
}

// [GET] 단일 Class 조회
export async function getClass(classId) {
  console.log("Class ID :", classId)
  const res = await axios.get(`/api/classes/${classId}`);
  return res.data;
}

// [PUT] Class 수정
// updatedData: { name?, color?, dataset_id? }
export async function updateClass(classId, updatedData) {
  const res = await axios.put(`/api/classes/${classId}`, updatedData);
  return res.data;
}

export async function upsertClass(classId, updatedData) {
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
  const res = await axios.get("/api/images/", {
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

  try {
    const res = await axios.post(`/api/images/`, formData, {
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


/**
 * =========================
 *  4) Upload APIs
 * =========================
 */

// (선택) 단일 파일 업로드
// export async function uploadFile(file) {
//   const formData = new FormData();
//   formData.append("file", file);

//   // 예: /api/upload-file 엔드포인트
//   const res = await axios.post(`/api/upload-file`, formData);
//   return res.data;
// }

/**
 * Helper: concurrency-limited async pool
 */
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

/**
 * Concurrency-aware uploadFiles
 */
export function uploadFiles(
  droppedFiles,
  sessionId,
  onProgress,
  onFileComplete,
  concurrency = 5
) {
  const controllers = [];
  let uploadedCount = 0;

  async function uploadSingle({ file, index }) {
    const controller = new AbortController();
    controllers[index] = controller;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", sessionId);

    return axios
      .post("/api/uploads/upload-temp", formData, {
      signal: controller.signal,
      onUploadProgress: (evt) => {
        if (evt.total) {
          const progress = (evt.loaded / evt.total) * 100;
          onProgress({ index, progress });
        }
      },
    })
      .then((res) => {
        uploadedCount += 1;
        onFileComplete({
          index,
          status: "success",
          fileId: res.data.fileId,
          filename: res.data.filename,
        });
      })
      .catch((error) => {
        uploadedCount += 1;
        onFileComplete({
          index,
          status: "failure",
          error: error.message,
        });
      });
  }

  const fileObjs = droppedFiles.map((file, idx) => ({ file, index: idx }));
  const promises = asyncPool(concurrency, fileObjs, uploadSingle);

  return { controllers, promises };
}

/**
 * 업로드 완료된 임시 파일들 ID를 서버에 보내 최종 폴더로 옮기기
 */
export async function confirmUploads(sessionId, fileIds) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  // 각 fileId를 개별적으로 'file_ids'라는 이름으로 추가
  console.log("fileIds :", fileIds)
  fileIds.forEach((id) => formData.append("file_ids", id));

  // axios는 자동으로 Content-Type을 multipart/form-data로 설정할 것입니다.
  // 명시적으로 설정할 필요는 없습니다.
  return axios.post("/api/uploads/commit-uploads", formData);
}

/**
 * 업로드 취소: 임시로 업로드된 파일 IDs 삭제 요청
 */
export async function cancelUploads(sessionId) {
  const formData = new FormData();
  formData.append("session_id", sessionId);

  // DELETE 메서드로 FormData 전송하려면, axios.delete에 { data: formData } 사용
  return axios.delete("/api/uploads/cancel-uploads", { data: formData });
}

/**
 * =========================
 *  5) Labels CRUD
 * =========================
 */
export async function listLabels(imageId) {
  if (!imageId) return { boundingBoxes: [], keyPoints: [], segmentations: [] };

  const res = await axios.get(`/api/labels/`, {
    params: { image_id: imageId },
  });

  return res.data;
}

export async function saveLabels({ imageId, boundingBoxes = [], keyPoints = [], segmentations = [] }) {
  try {
    const res = await axios.post(`/api/labels/`, {
      imageId,
      boundingBoxes,
      keyPoints,
      segmentations,
    });
    return res.data;
  } catch (error) {
    console.error("API Error (saveLabels):", error);
    return { error: error.response?.data || error.message };
  }
}

/**
 * =========================
 *  5) Model CRUD & Inference
 * =========================
 */

// [POST] 모델 파일 업로드
// modelFile: File 객체, modelName: 문자열, inputWidth, inputHeight: 숫자, purpose: 문자열
export async function uploadModel(modelFile, modelName, inputWidth, inputHeight, purpose) {
  const formData = new FormData();
  formData.append("model_file", modelFile);  // 파일 전송
  formData.append("model_name", modelName);
  formData.append("input_width", inputWidth);
  formData.append("input_height", inputHeight);
  formData.append("purpose", purpose);  // 추가된 purpose 필드

  try {
    const res = await axios.post(`/api/model/upload/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("API Error (uploadModel):", error);
    return { error: error.response?.data || error.message };
  }
}

// [GET] 등록된 모델 목록 조회
// purpose 값이 주어지면 해당 목적에 맞는 모델만 반환, 아니면 전체 모델 반환
export async function listModels(purpose = "") {
  try {
    const res = await axios.get(`/api/model/list`, {
      params: { purpose }
    });
    return res.data;
  } catch (error) {
    console.error("API Error (listModels):", error);
    return { error: error.response?.data || error.message };
  }
}


// [POST] 모델 feature 추출
// modelId: 모델의 ID (문자열), imageId: 이미지의 ID (문자열)
export async function extractFeatures(modelId, imageId) {
  const formData = new FormData();
  formData.append("model_id", modelId);
  formData.append("image_id", imageId);

  try {
    const res = await axios.post(`/api/model/extract_features`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("API Error (extractFeatures):", error);
    return { error: error.response?.data || error.message };
  }
}

/**
 * [GET] 이미지 feature 차원 축소 호출
 * 
 * @param {string[]} imageIds - 조회할 데이터셋 ID 목록
 * @param {string} modelId - 차원 축소할 feature를 가진 모델의 ID
 * @param {string} [method="umap"] - 차원 축소 방법 (기본: "umap")
 * @returns {Promise<object>} - { featureCoordinates: { image_id: [x, y], ... } }
 */
export async function compressFeatures(imageIds, modelId, method = "umap") {
  try {
    const res = await axios.get(`/api/model/compress_features`, {
      params: { 
        image_ids: imageIds,
        model_id: modelId,
        method: method
      },
      // 배열 파라미터의 직렬화를 위해 qs 사용
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
    });
    return res.data;
  } catch (error) {
    console.error("API Error (compressFeatures):", error);
    return { error: error.response?.data || error.message };
  }
}

/*
 * =========================
 *  Project CRUD (requires auth)
 * =========================
 */

function authHeader() {
  const token =
    (typeof window !== "undefined" && (localStorage.getItem("token") || sessionStorage.getItem("token"))) ||
    null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// [GET] Logged-in user projects
export async function listProjects() {
  const res = await axios.get(`/api/projects/`, {
    headers: {
      ...authHeader(),
    },
  });
  return res.data;
}

// [POST] Create new project { name, description }
export async function createProject(project) {
  const res = await axios.post(`/api/projects/`, project, {
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
  });
  return res.data;
}

// [GET] Single project by id
export async function getProject(projectId) {
  const res = await axios.get(`/api/projects/${projectId}`, {
    headers: { ...authHeader() },
  });
  return res.data;
}

// [PUT] Update project { name?, description? }
export async function updateProject(projectId, updatedData) {
  const res = await axios.put(`/api/projects/${projectId}`, updatedData, {
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
  });
  return res.data;
}

// [DELETE] Delete project
export async function deleteProject(projectId) {
  const res = await axios.delete(`/api/projects/${projectId}`, {
    headers: { ...authHeader() },
  });
  return res.data;
}

// [GET] Datasets for a given project
export async function listProjectDatasets(projectId) {
  const res = await axios.get(`/api/projects/${projectId}/datasets`, {
    headers: { ...authHeader() },
  });
  return res.data;
}

export async function attachDatasetToProject(projectId, datasetId) {
  const res = await axios.post(`/api/projects/${projectId}/datasets/${datasetId}`, null, {
    headers: { ...authHeader() },
  });
  return res.data;
}