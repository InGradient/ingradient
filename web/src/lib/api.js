import axios from 'axios';
import { SERVER_BASE_URL } from "@/config";

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post(`${SERVER_BASE_URL}/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}

export async function getLabels(imageId) {
  const res = await axios.get(`${SERVER_BASE_URL}/get-labels/${imageId}`);
  return res.data;
}

export async function saveLabels(imageId, labels) {
  const res = await axios.post(`${SERVER_BASE_URL}/save-labels/${imageId}`, labels);
  return res.data;
}
