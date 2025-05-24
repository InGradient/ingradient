// File: ./utils/fileHandler.js

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { SERVER_BASE_URL } from "@/config";
import { uploadFile } from "@/lib/api";

/**
 * Converts a File object to a DataURL.
 * @param {File} file 
 * @returns {Promise<string>} DataURL string
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Loads an image from a DataURL and extracts its natural width and height.
 * @param {string} dataURL 
 * @returns {Promise<{width: number, height: number}>}
 */
export function getImageSize(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataURL;
  });
}

/**
 * (이전 방식: 파일 중복 체크 및 시뮬레이션 업로드)
 * Handles file upload simulation with duplicate check.
 * @param {Object} params - The parameters for file upload.
 * @param {FileList|Array} params.files - Files to be uploaded.
 * @param {string} params.type - Type of file ("json", etc.).
 * @param {Object} params.errorMessages - Error messages for different error types.
 * @param {Function} params.setState - State setter function to update the file list.
 * @param {Array} params.existingFiles - The list of already uploaded files.
 */
export const handleFileUpload = ({ files, type, errorMessages, setState, existingFiles }) => {
  const uploadedFiles = Array.from(files).map((file) => ({
    file,
    status: "pending",
    downloadedSize: "0KB",
    totalSize: `${(file.size / 1024).toFixed(2)}KB`,
    error: null,
  }));

  // Check for duplicates
  const uniqueFiles = uploadedFiles.filter(({ file }) => {
    const isDuplicate = existingFiles.some(
      (existing) =>
        existing.file.name === file.name &&
        existing.file.lastModified === file.lastModified
    );
    if (isDuplicate) {
      setState((prev) => [
        ...prev,
        {
          file,
          status: "failure",
          downloadedSize: "0KB",
          totalSize: `${(file.size / 1024).toFixed(2)}KB`,
          error: errorMessages.duplicate,
        },
      ]);
    }
    return !isDuplicate;
  });

  // Add unique files to state
  setState((prev) => [...prev, ...uniqueFiles]);

  // Simulate upload process with delay and update status
  uniqueFiles.forEach(({ file }, index) => {
    setTimeout(() => {
      const success = Math.random() > 0.5; // Randomly decide success
      const error = !success ? errorMessages.random() : null;
      const downloadedSize = success ? `${(file.size / 1024).toFixed(2)}KB` : "0KB";

      setState((prev) =>
        prev.map((item) =>
          item.file.name === file.name
            ? { ...item, status: success ? "success" : "failure", downloadedSize, error }
            : item
        )
      );
    }, 1000 * (index + 1));
  });
};

// /**
//  * droppedFiles 배열을 받아 서버에 임시 업로드
//  * - 파일별로 AbortController를 생성하여 취소 가능
//  * - onProgress: (progressInfo) => {} 형태 콜백
//  *    progressInfo: { index, loaded, total, fileId? ... }
//  */
// // fileHandler.js
// export function uploadFiles(droppedFiles, sessionId, onProgress, onFileComplete) {
//   const controllers = [];
//   const promises = [];

//   droppedFiles.forEach((file, index) => {
//     const controller = new AbortController();
//     controllers.push(controller);

//     const formData = new FormData();
//     formData.append("file", file);
//     // 여기서 session_id를 추가합니다.
//     formData.append("session_id", sessionId);

//     const uploadPromise = axios.post("/api/uploads/upload-temp", formData, {
//       signal: controller.signal,
//       onUploadProgress: (evt) => {
//         if (evt.total) {
//           const progress = (evt.loaded / evt.total) * 100;
//           onProgress({ index, progress });
//         }
//       },
//     })
//       .then((res) => {
//         onFileComplete({
//           index,
//           status: "success",
//           fileId: res.data.fileId,
//           filename: res.data.filename,
//         });
//       })
//       .catch((error) => {
//         onFileComplete({
//           index,
//           status: "failure",
//           error: error.message,
//         });
//       });

//     promises.push(uploadPromise);
//   });

//   return { controllers, promises };
// }

// /**
//  * 업로드가 완료된 임시 파일들 ID를 서버에 보내 최종 폴더로 옮기기
//  */
// export async function confirmUploads(sessionId, fileIds) {
//   const formData = new FormData();
//   formData.append("session_id", sessionId);
//   fileIds.forEach((id) => formData.append("file_ids", id)); // 또는 JSON.stringify(fileIds) 사용
//   return axios.post("/api/uploads/commit-uploads", formData, {
//     headers: { "Content-Type": "multipart/form-data" }
//   });
// }

// /**
//  * 업로드 취소: 임시로 업로드된 파일 IDs 삭제 요청
//  */
// export async function cancelUploads(sessionId) {
//   // session_id를 FormData로 보내거나, 쿼리 파라미터로 전달합니다.
//   const formData = new FormData();
//   formData.append("session_id", sessionId);
//   await axios.delete("/api/uploads/cancel-uploads", { data: formData });
// }


/**
 * Generates a ZIP file containing JSON annotation files for the given images.
 * @param {Array} sortedData - Array of image objects.
 * @param {Array} activeClasses - Array of active class objects (to look up class names/colors).
 * @returns {Promise<void>}
 */
export async function handleDownload(sortedData, activeClasses) {
  const zip = new JSZip();

  sortedData.forEach((image) => {
    console.log("image to download", image)
    const annotation = {
      image: {
        identifier: image.filename,
        size: [
          image.width ? parseFloat(image.width.toFixed(4)) : 0,
          image.height ? parseFloat(image.height.toFixed(4)) : 0,
        ],
        updateAt: image.uploadedAt || null,
      },
      boundingBoxes: (image.boundingBoxes || []).map((box) => {
        const matchedClass = activeClasses.find((c) => c.id === box.classId);
        const className = matchedClass ? matchedClass.name : box.classId;
        return {
          properties: { label: className },
          category: className,
          xmin: parseFloat(box.minX.toFixed(4)),
          ymin: parseFloat(box.minY.toFixed(4)),
          xmax: parseFloat(box.maxX.toFixed(4)),
          ymax: parseFloat(box.maxY.toFixed(4)),
          id: box.id || uuidv4(),
        };
      }),
      keyPoints: (image.keyPoints || []).map((pt) => {
        const matchedClass = activeClasses.find((c) => c.id === pt.classId);
        const className = matchedClass ? matchedClass.name : pt.classId;
        return {
          ...pt,
          classId: className,
          x: parseFloat(pt.x.toFixed(4)),
          y: parseFloat(pt.y.toFixed(4)),
        };
      }),
    };

    const jsonContent = {
      version: "0.1",
      annotations: [annotation],
    };

    const fileName = image.filename.replace(/\.[^/.]+$/, "") + ".json";
    zip.file(fileName, JSON.stringify(jsonContent, null, 2));
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "annotations.zip");
}
