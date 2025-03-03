// File: ./utils/fileHandler.js

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { SERVER_BASE_URL } from "@/config";

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

/**
 * Handles image upload by sending each file to the backend API.
 * For each file, it optionally extracts its dimensions and then posts the file.
 * @param {FileList|Array} files - The image files.
 * @returns {Promise<Array>} Array of image objects returned from the server.
 */
export async function handleImageUpload(files) {
  const uploadPromises = Array.from(files).map(async (file) => {
    // Optional: compute file preview dimensions on the client
    const dataURL = await fileToDataURL(file);
    const { width, height } = await getImageSize(dataURL);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // POST the file to the backend API
      const res = await axios.post(`${SERVER_BASE_URL}/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // 반환된 정보와 클라이언트 계산 정보를 합쳐서 객체 생성
      return {
        id: res.data.filename || uuidv4(), // 백엔드에서 filename을 id로 사용
        file,
        status: "success",
        width,
        height,
        filename: file.name,
        url: `${SERVER_BASE_URL}${res.data.location}`, // 예: http://localhost:8000/uploads/파일명
      };
    } catch (error) {
      return {
        id: file.name,
        file,
        status: "failure",
        width,
        height,
        filename: file.name,
        error: error.message,
      };
    }
  });

  return await Promise.all(uploadPromises);
}

/**
 * Generates a ZIP file containing JSON annotation files for the given images.
 * @param {Array} sortedData - Array of image objects.
 * @param {Array} activeClasses - Array of active class objects (to look up class names/colors).
 * @returns {Promise<void>}
 */
export async function handleDownload(sortedData, activeClasses) {
  const zip = new JSZip();

  sortedData.forEach((image) => {
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
      points: (image.points || []).map((pt) => {
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
