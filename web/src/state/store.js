// store.js
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

import {
  initialDatasets,
  initialClasses,
  initialImages,
} from './initialData';

/** 배열에 item을 중복 없이 추가하는 헬퍼 */
function addRef(array, item) {
  if (!array.includes(item)) {
    array.push(item);
  }
}
/** 배열에서 item을 제거하는 헬퍼 */
function removeRef(array, item) {
  const idx = array.indexOf(item);
  if (idx !== -1) {
    array.splice(idx, 1);
  }
}

export const useMyStore = create((set, get) => ({
  datasets: initialDatasets || {},
  classes: initialClasses || {},
  images: initialImages || {},

  getActiveImages: (selectedDatasetIds) => {
    const { images } = get();
    return Object.values(images).filter((img) =>
      img.datasetIds.some((datasetId) => selectedDatasetIds.includes(datasetId))
    );
  },
  /**
   * ===================
   *  DATASET
   * ===================
   */
  saveDataset: (data) => {
    set((state) => {
      const { id, classIds = [], imageIds = [] } = data;
  
      // 새로운 상태 객체 생성
      const newDatasets = {
        ...state.datasets,
        [id]: {
          ...state.datasets[id], // 기존 속성(있다면)
          ...data, // 새로운 데이터 덮어쓰기
          classIds,
          imageIds,
        },
      };
  
      // 클래스와 이미지를 업데이트
      const newClasses = { ...state.classes };
      const newImages = { ...state.images };
  
      // 기존 관계 해제
      if (state.datasets[id]) {
        const oldClassIds = state.datasets[id].classIds || [];
        const oldImageIds = state.datasets[id].imageIds || [];
        oldClassIds.forEach((clsId) => {
          if (newClasses[clsId]) {
            newClasses[clsId] = {
              ...newClasses[clsId],
              datasetIds: newClasses[clsId].datasetIds.filter((dsId) => dsId !== id),
            };
          }
        });
        oldImageIds.forEach((imgId) => {
          if (newImages[imgId]) {
            newImages[imgId] = {
              ...newImages[imgId],
              datasetIds: newImages[imgId].datasetIds.filter((dsId) => dsId !== id),
            };
          }
        });
      }
  
      // 새로운 관계 추가
      classIds.forEach((clsId) => {
        if (newClasses[clsId]) {
          newClasses[clsId] = {
            ...newClasses[clsId],
            datasetIds: [...new Set([...newClasses[clsId].datasetIds, id])],
          };
        }
      });
      imageIds.forEach((imgId) => {
        if (newImages[imgId]) {
          newImages[imgId] = {
            ...newImages[imgId],
            datasetIds: [...new Set([...newImages[imgId].datasetIds, id])],
          };
        }
      });
  
      return {
        ...state,
        datasets: newDatasets,
        classes: newClasses,
        images: newImages,
      };
    });
  },
  
  deleteDataset: (datasetId) => {
    set((state) => {
      const ds = state.datasets[datasetId];
      if (!ds) return state; // 데이터셋이 없으면 아무 작업도 하지 않음
  
      const newClasses = { ...state.classes };
      const newImages = { ...state.images };
  
      // 관련 클래스와 이미지에서 datasetId 제거
      ds.classIds.forEach((clsId) => {
        if (newClasses[clsId]) {
          newClasses[clsId] = {
            ...newClasses[clsId],
            datasetIds: newClasses[clsId].datasetIds.filter((id) => id !== datasetId),
          };
        }
      });
      ds.imageIds.forEach((imgId) => {
        if (newImages[imgId]) {
          newImages[imgId] = {
            ...newImages[imgId],
            datasetIds: newImages[imgId].datasetIds.filter((id) => id !== datasetId),
          };
        }
      });
  
      // 해당 데이터셋 삭제
      const newDatasets = { ...state.datasets };
      delete newDatasets[datasetId];
  
      return {
        ...state,
        datasets: newDatasets,
        classes: newClasses,
        images: newImages,
      };
    });
  },  

  /**
   * ===================
   *  CLASS
   * ===================
   */
  saveClass: (data) => {
    set((state) => {
      const { id, datasetIds = [], imageIds = [] } = data;
  
      // 새로운 상태 객체 생성
      const newClasses = {
        ...state.classes,
        [id]: {
          ...state.classes[id],
          ...data,
          datasetIds,
          imageIds,
        },
      };
  
      // 데이터셋과 이미지를 업데이트
      const newDatasets = { ...state.datasets };
      const newImages = { ...state.images };
  
      // 기존 관계 해제
      if (state.classes[id]) {
        const oldDatasetIds = state.classes[id].datasetIds || [];
        const oldImageIds = state.classes[id].imageIds || [];
        oldDatasetIds.forEach((dsId) => {
          if (newDatasets[dsId]) {
            newDatasets[dsId] = {
              ...newDatasets[dsId],
              classIds: newDatasets[dsId].classIds.filter((clsId) => clsId !== id),
            };
          }
        });
        oldImageIds.forEach((imgId) => {
          if (newImages[imgId]) {
            newImages[imgId] = {
              ...newImages[imgId],
              classId: newImages[imgId].classId === id ? null : newImages[imgId].classId,
            };
          }
        });
      }
  
      // 새로운 관계 추가
      datasetIds.forEach((dsId) => {
        if (newDatasets[dsId]) {
          newDatasets[dsId] = {
            ...newDatasets[dsId],
            classIds: [...new Set([...newDatasets[dsId].classIds, id])],
          };
        }
      });
      imageIds.forEach((imgId) => {
        if (newImages[imgId]) {
          newImages[imgId] = {
            ...newImages[imgId],
            classId: id,
          };
        }
      });
  
      return {
        ...state,
        classes: newClasses,
        datasets: newDatasets,
        images: newImages,
      };
    });
  },
  
  deleteClass: (classId) => {
    set((state) => {
      const cls = state.classes[classId];
      if (!cls) return state; // 클래스가 없으면 아무 작업도 하지 않음
  
      const newDatasets = { ...state.datasets };
      const newImages = { ...state.images };
  
      // 관련 데이터셋에서 classId 제거
      cls.datasetIds.forEach((dsId) => {
        if (newDatasets[dsId]) {
          newDatasets[dsId] = {
            ...newDatasets[dsId],
            classIds: newDatasets[dsId].classIds.filter((id) => id !== classId),
          };
        }
      });
  
      // 관련 이미지에서 classId 제거
      cls.imageIds.forEach((imgId) => {
        if (newImages[imgId]) {
          newImages[imgId] = {
            ...newImages[imgId],
            classId: newImages[imgId].classId === classId ? null : newImages[imgId].classId,
          };
        }
      });
  
      // 해당 클래스 삭제
      const newClasses = { ...state.classes };
      delete newClasses[classId];
  
      return {
        ...state,
        classes: newClasses,
        datasets: newDatasets,
        images: newImages,
      };
    });
  },  

  /**
   * ===================
   *  IMAGE
   * ===================
   */
  saveImage: (data) => {
    set((state) => {
      const { id, datasetIds = [], classId = null } = data;
  
      // 새로운 상태 객체 생성
      const newImages = {
        ...state.images,
        [id]: {
          ...state.images[id],
          ...data,
          datasetIds,
          classId,
        },
      };
  
      // 데이터셋과 클래스를 업데이트
      const newDatasets = { ...state.datasets };
      const newClasses = { ...state.classes };
  
      // 기존 관계 해제
      if (state.images[id]) {
        const oldDatasetIds = state.images[id].datasetIds || [];
        const oldClassId = state.images[id].classId || null;
  
        oldDatasetIds.forEach((dsId) => {
          if (newDatasets[dsId]) {
            newDatasets[dsId] = {
              ...newDatasets[dsId],
              imageIds: newDatasets[dsId].imageIds.filter((imgId) => imgId !== id),
            };
          }
        });
  
        if (oldClassId && newClasses[oldClassId]) {
          newClasses[oldClassId] = {
            ...newClasses[oldClassId],
            imageIds: newClasses[oldClassId].imageIds.filter((imgId) => imgId !== id),
          };
        }
      }
  
      // 새로운 관계 추가
      datasetIds.forEach((dsId) => {
        if (newDatasets[dsId]) {
          newDatasets[dsId] = {
            ...newDatasets[dsId],
            imageIds: [...new Set([...newDatasets[dsId].imageIds, id])],
          };
        }
      });
  
      if (classId && newClasses[classId]) {
        newClasses[classId] = {
          ...newClasses[classId],
          imageIds: [...new Set([...newClasses[classId].imageIds, id])],
        };
      }
  
      return {
        ...state,
        images: newImages,
        datasets: newDatasets,
        classes: newClasses,
      };
    });
  },
  
  deleteImage: (imageId) => {
    set((state) => {
      const img = state.images[imageId];
      if (!img) return state; // 이미지가 없으면 아무 작업도 하지 않음
  
      const newDatasets = { ...state.datasets };
      const newClasses = { ...state.classes };
  
      // 관련 데이터셋에서 imageId 제거
      img.datasetIds.forEach((dsId) => {
        if (newDatasets[dsId]) {
          newDatasets[dsId] = {
            ...newDatasets[dsId],
            imageIds: newDatasets[dsId].imageIds.filter((id) => id !== imageId),
          };
        }
      });
  
      // 관련 클래스에서 imageId 제거
      const clsId = img.classId;
      if (clsId && newClasses[clsId]) {
        newClasses[clsId] = {
          ...newClasses[clsId],
          imageIds: newClasses[clsId].imageIds.filter((id) => id !== imageId),
        };
      }
  
      // 해당 이미지 삭제
      const newImages = { ...state.images };
      delete newImages[imageId];
  
      return {
        ...state,
        images: newImages,
        datasets: newDatasets,
        classes: newClasses,
      };
    });
  },  

  /**
   * ===================
   *  HELPER (예: 새로 생성)
   * ===================
   */
  createDataset: (name, userId) => {
    const newId = uuidv4();
    const newDataset = {
      id: newId,
      name,
      description: "Newly created dataset",
      classIds: [],
      imageIds: [],
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId || "",
    };
  
    set((state) => ({
      ...state,
      datasets: {
        [newId]: newDataset,
        ...state.datasets,
      },
    }));
    
    return newId;
  },
  
  createClass: (name, datasetIds, imageIds, userId) => {
    const newId = uuidv4();
    get().saveClass({
      id: newId,
      name,
      datasetIds: datasetIds || [],
      imageIds: imageIds || [],
      color: "#CCCCCC",
      createdAt: new Date().toISOString(),
      createdBy: userId || "",
    });
    return newId;
  },
  
  createImage: (files, datasetIds, userId) => {
    const newImages = files.map((fw) => {
      const newId = uuidv4();
      return {
        id: newId,
        filename: fw.file.name,
        width: fw.width || 0,
        height: fw.height || 0,
        datasetIds: datasetIds || [],
        classId: null,
        properties: [],
        imageURL: URL.createObjectURL(fw.file),
        // imageURL: URL.createObjectURL(file), // 임시 URL 생성
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model: {},
        approval: "pending",
        comment: "",
        labeledBy: userId || "",
        editedBy: userId || "",
        uploadedBy: userId || "",
      };
    });
  
    set((state) => {
      // 기존 상태를 기반으로 새로운 상태를 만듦
      const updatedImages = { ...state.images };
      const updatedDatasets = { ...state.datasets };
  
      // 새 이미지 추가 및 데이터셋과 연관 관계 업데이트
      newImages.forEach((image) => {
        updatedImages[image.id] = image;
  
        image.datasetIds.forEach((datasetId) => {
          if (updatedDatasets[datasetId]) {
            updatedDatasets[datasetId] = {
              ...updatedDatasets[datasetId],
              imageIds: [...new Set([...updatedDatasets[datasetId].imageIds, image.id])],
            };
          }
        });
      });
  
      // 최종 상태를 반환
      return {
        ...state,
        images: updatedImages,
        datasets: updatedDatasets,
      };
    });
  },  
}));
