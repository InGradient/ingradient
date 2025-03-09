import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

import {
  // Dataset API
  listDatasets as apiListDatasets,
  getDataset as apiGetDataset,
  createDataset as apiCreateDataset,
  updateDataset as apiUpdateDataset,
  upsertDataset as apiUpsertDataset,
  deleteDataset as apiDeleteDataset,

  // Class API
  listClasses as apiListClasses,
  getClasses as apiGetClasses,
  createClass as apiCreateClass,
  upsertClass as apiUpsertClass,
  updateClass as apiUpdateClass,
  deleteClass as apiDeleteClass,

  // Image API
  listImages as apiListImages,
  getImages as apiGetImages,
  saveImages as apiSaveImages,
  upsertImage as apiUpsertImage,
  updateImage as apiUpdateImage,
  deleteImage as apiDeleteImage,

  // Label API
  listBoundingBoxes,
  listKeyPoints,
  listSegmentations,
  listLabels as apiListLabels,
  saveLabels as apiSaveLabels,
} from '@/lib/api';


export const useMyStore = create((set, get) => ({
  // datasets: initialDatasets || {},
  // classes: initialClasses || {},
  // images: initialImages || {},
  datasets: {},
  classes: {},
  images: {},

  labels: {},

  /**
   * ===================
   *  INITIAL DATA LOADING
   * ===================
   */
  loadDataset: async () => {
    try {
      const datasets = await apiListDatasets();
      const datasetMap = Object.fromEntries(datasets.map((ds) => [ds.id, ds]));
  
      set((state) => ({
        datasets: datasetMap,
        classes: state.classes,
        images: state.images,
      }));
    } catch (error) {
      console.error("Error loading initial datasets:", error);
    }
  },  

  loadClasses: async () => {
    try {
      const classes = await apiListClasses();
      const classMap = Object.fromEntries(classes.map((cls) => [cls.id, cls]));
  
      set((state) => ({
        ...state,
        classes: classMap,
      }));
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  },

  loadImages: async (selectedDatasetIds = []) => {
    try {
      const images = await apiListImages(selectedDatasetIds);
      const imageMap = Object.fromEntries(images.map((img) => [img.id, img]));

      set((state) => ({
        ...state,
        images: imageMap,
      }));

      await get().loadLabels();
    } catch (error) {
      console.error("Error loading images:", error);
    }
  },
  
  loadLabels: async (selectedImageIds = []) => {
    if (selectedImageIds.length === 0) return;
  
    const { labels } = get();
    const updatedLabels = { ...labels };
  
    // 선택된 이미지 ID에 대해서만 한 번에 라벨 가져오기
    await Promise.all(
      selectedImageIds.map(async (imageId) => {
        try {
          const response = await apiListLabels(imageId);
  
          updatedLabels[imageId] = {
            boundingBoxes: response.boundingBoxes || [],
            keyPoints: response.keyPoints || [],
            segmentations: response.segmentations || [],
          };
        } catch (error) {
          console.error(`❌ Error loading labels for image ${imageId}:`, error);
        }
      })
    );
  
    set((state) => ({
      ...state,
      labels: updatedLabels,
    }));
  
    console.log("✅ Labels loaded successfully for selected images:", selectedImageIds);
  },  

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
  saveDataset: async (data) => {
    const { id } = data;
    const state = get();
    const existing = state.datasets[id];

    try {
      let serverResponse;
      if (existing) {
        const updatedData = {
          name: data.name,
          description: data.description,
        };
        serverResponse = await apiUpsertDataset(id, updatedData);
        if (serverResponse.error) {
          console.error("Update dataset failed:", serverResponse.error);
          return;
        }
      } else {
        const newDataset = {
          id,
          name: data.name,
          description: data.description || "",
        };
        serverResponse = await apiUpsertDataset(newDataset);
        if (serverResponse.error) {
          console.error("Create dataset failed:", serverResponse.error);
          return;
        }
      }

      set((state) => {
        const { classIds = [], imageIds = [] } = data;

        const newDatasets = {
          ...state.datasets,
          [id]: {
            ...state.datasets[id],
            ...data,
            classIds,
            imageIds,
          },
        };

        return {
          ...state,
          datasets: newDatasets,
        };
      });
    } catch (error) {
      console.error("saveDataset error:", error);
    }
  },
  
  deleteDataset: async (datasetId) => {
    try {
      // 1️⃣ 서버에 삭제 요청
      const res = await apiDeleteDataset(datasetId);
      if (res.error) {
        console.error("Delete dataset failed:", res.error);
        return;
      }
  
      // 2️⃣ 삭제 성공 → 로컬 state에서 dataset 관련 데이터 정리
      set((state) => {
        const ds = state.datasets[datasetId];
        if (!ds) return state;
  
        const newClasses = { ...state.classes };
        const newImages = { ...state.images };
  
        // ✅ dataset을 포함하는 classes에서 datasetId 제거
        Object.keys(newClasses).forEach((clsId) => {
          if (newClasses[clsId].datasetIds) {
            newClasses[clsId] = {
              ...newClasses[clsId],
              datasetIds: newClasses[clsId].datasetIds.filter((id) => id !== datasetId),
            };
          }
        });
  
        // ✅ dataset을 포함하는 images에서 datasetId 제거
        Object.keys(newImages).forEach((imgId) => {
          if (newImages[imgId].datasetIds) {
            newImages[imgId] = {
              ...newImages[imgId],
              datasetIds: newImages[imgId].datasetIds.filter((id) => id !== datasetId),
            };
          }
        });
  
        // ✅ dataset 자체 삭제
        const newDatasets = { ...state.datasets };
        delete newDatasets[datasetId];
  
        return {
          ...state,
          datasets: newDatasets,
          classes: newClasses,
          images: newImages,
        };
      });
    } catch (error) {
      console.error("deleteDataset error:", error);
    }
  },  

  /**
   * ===================
   *  CLASS
   * ===================
   */
  saveClass: async (data) => {
    const { id } = data;
    const state = get();
    let serverResponse;
    // 이미 존재하면 업데이트, 없으면 생성 (여기서는 upsertClass API 사용)
    if (state.classes[id]) {
      const updatedData = {
        name: data.name,
        color: data.color || "#CCCCCC",
        dataset_ids: data.datasetIds || [], // 서버에서는 snake_case로 받음
        image_ids: data.imageIds || [],       // 만약 image_ids가 필요하다면
      };
      serverResponse = await apiUpsertClass(id, updatedData);
      if (serverResponse.error) {
        console.error("Update class failed:", serverResponse.error);
        return;
      }
    } else {
      const newClass = {
        id,
        name: data.name,
        color: data.color || "#CCCCCC",
        dataset_ids: data.datasetIds || [],
        image_ids: data.imageIds || [],
      };
      serverResponse = await apiUpsertClass(id, newClass);
      if (serverResponse.error) {
        console.error("Create class failed:", serverResponse.error);
        return;
      }
    }
  
    set((state) => {
      // 1. 클래스 state 업데이트
      const newClasses = { ...state.classes, [id]: serverResponse };
    
      // 2. 데이터셋 업데이트: 서버에서 받은 class의 datasetIds에 해당하는 데이터셋에
      //    serverResponse.imageIds (즉, 연결된 이미지 ID들)를 추가 (중복 제거)
      const newDatasetIds = serverResponse.datasetIds || [];
      const newDatasets = { ...state.datasets };
      newDatasetIds.forEach((dsId) => {
        if (newDatasets[dsId]) {
          const currentClassIds = newDatasets[dsId].classIds || [];

          newDatasets[dsId].classIds = [
            ...new Set([...currentClassIds, id]), // serverResponse.classIds 대신 id 사용
          ];          
        }
      });
    
      // 3. 이미지 업데이트: 서버에서 받은 class의 imageIds에 해당하는 이미지의 classIds를 [id]로 설정
      const newImageIds = serverResponse.imageIds || [];
      const newImages = { ...state.images };
      newImageIds.forEach((imgId) => {
        if (newImages[imgId]) {
          newImages[imgId].classIds = [id];
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
  
  deleteClass: async (classId) => {
    try {
      const res = await apiDeleteClass(classId);
      if (res.error) {
        console.error("Delete class failed:", res.error);
        return;
      }

      // 로컬 state에서 제거
      set((state) => {
        const cls = state.classes[classId];
        if (!cls) return state;

        const newDatasets = { ...state.datasets };
        const newImages = { ...state.images };

        Object.keys(newDatasets).forEach((dsId) => {
          if (newDatasets[dsId].classIds) {
            newDatasets[dsId] = {
              ...newDatasets[dsId],
              classIds: newDatasets[dsId].classIds.filter((id) => id !== classId),
            };
          }
        });
  
        Object.keys(newImages).forEach((imgId) => {
          if (newImages[imgId].classIds) {
            newImages[imgId] = {
              ...newImages[imgId],
              classIds: newImages[imgId].classIds.filter((id) => id !== classId),
            };
          }
        });

        const newClasses = { ...state.classes };
        delete newClasses[classId];

        return {
          ...state,
          classes: newClasses,
          datasets: newDatasets,
          images: newImages,
        };
      });
    } catch (error) {
      console.error("deleteClass error:", error);
    }
  },

  /**
   * ===================
   *  IMAGE
   * ===================
   */
  saveImage: async (data) => {
    const { id } = data;
  
    try {
      const newImage = {
        id,
        filename: data.filename || "untitled.png",
        fileLocation: data.fileLocation || "",
        thumbnailLocation: data.thumbnailLocation || "",
        datasetIds: data.datasetIds || [],
        classIds: data.classIds || [],
        approval: data.approval || "pending",
        comment: data.comment || "",
        height: data.height || null,
        width: data.width || null,
        type: data.file?.type || null,
        size: data.file?.size || null,
        properties: data.properties || { description: "", comment: "" },
      };
  
      const serverResponse = await apiUpsertImage(id, newImage);
      if (serverResponse.error) {
        console.error("Upsert image failed:", serverResponse.error);
        return;
      }
  
      // ✅ 서버에서 최신 dataset 정보 가져오기
      const updatedDatasets = {};
      await Promise.all(
        newImage.datasetIds.map(async (datasetId) => {
          try {
            const updatedDataset = await apiGetDataset(datasetId);
            if (!updatedDataset.error) {
              updatedDatasets[datasetId] = updatedDataset;
            } else {
              console.error("Failed to fetch updated dataset from server:", updatedDataset.error);
            }
          } catch (error) {
            console.error("Error fetching updated dataset from server:", error);
          }
        })
      );
  
      // ✅ Zustand 상태 업데이트: 이미지 & 데이터셋 업데이트
      set((state) => {
        const { datasetIds = [], classIds = null } = newImage;
  
        const newImages = {
          ...state.images,
          [id]: {
            ...state.images[id],
            ...newImage,
            datasetIds,
            classIds,
          },
        };
  
        const newDatasets = { ...state.datasets, ...updatedDatasets };
        const newClasses = { ...state.classes };
  
        // 기존 관계 해제
        if (state.images[id]) {
          const oldDatasetIds = state.images[id].datasetIds || [];
  
          oldDatasetIds.forEach((dsId) => {
            if (newDatasets[dsId]) {
              newDatasets[dsId] = {
                ...newDatasets[dsId],
                imageIds: newDatasets[dsId].imageIds.filter((imgId) => imgId !== id),
              };
            }
          });
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
  
        return {
          ...state,
          images: newImages,
          datasets: newDatasets,
          classes: newClasses,
        };
      });
    } catch (error) {
      console.error("saveImage error:", error);
    }
  },
  
  deleteImage: async (imageId, selectedDatasetIds) => {
    try {
      console.log("selectedDatasetIds", selectedDatasetIds)
      const res = await apiDeleteImage(imageId, selectedDatasetIds);
      if (res.error) {
        console.error("Delete image failed:", res.error);
        return;
      }
  
      // 로컬에서 제거
      set((state) => {
        const img = state.images[imageId];
        if (!img) return state;
  
        const newDatasets = { ...state.datasets };
        const newClasses = { ...state.classes };
  
        // ✅ datasetIds가 배열이므로 객체 순회 후 filter 적용
        Object.keys(newDatasets).forEach((dsId) => {
          if (newDatasets[dsId].imageIds) {
            newDatasets[dsId] = {
              ...newDatasets[dsId],
              imageIds: newDatasets[dsId].imageIds.filter((id) => id !== imageId),
            };
          }
        });
  
        // ✅ classIds가 배열이므로 객체 순회 후 filter 적용
        Object.keys(newClasses).forEach((clsId) => {
          if (newClasses[clsId].imageIds) {
            newClasses[clsId] = {
              ...newClasses[clsId],
              imageIds: newClasses[clsId].imageIds.filter((id) => id !== imageId),
            };
          }
        });
  
        // ✅ 이미지 삭제
        const newImages = { ...state.images };
        delete newImages[imageId];
  
        return {
          ...state,
          images: newImages,
          datasets: newDatasets,
          classes: newClasses,
        };
      });
    } catch (error) {
      console.error("deleteImage error:", error);
    }
  },
  

  /**
   * ===================
   *  HELPER (예: 새로 생성)
   * ===================
   */
  createDataset: async (name, userId) => {
    console.log("createDataset", name);
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

    try {
      // ✅ 서버에 데이터셋 생성 요청
      const createdDataset = await apiCreateDataset(newDataset);
      console.log("Created dataset:", createdDataset);

      // ✅ API 응답에 오류가 없으면 Zustand 상태 업데이트
      if (!createdDataset.error) {
        set((state) => ({
          datasets: {
            ...state.datasets,
            [createdDataset.id]: {
              ...createdDataset,
              classIds: [],
              imageIds: [],
            },
          },
        }));

        return createdDataset.id;
      } else {
        console.error("Dataset creation failed:", createdDataset.error);
        return null;
      }
    } catch (error) {
      console.error("API Error (createDataset):", error);
      return null;
    }
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
  
  createImage: async (files, datasetIds, userId) => {
    console.log("createImage", files, datasetIds);
  
    const newImages = await Promise.all(
      files.map(async (fw) => {
        const newId = uuidv4();
        const newImage = {
          id: newId,
          filename: fw.file.name,
          width: fw.width || 0,
          height: fw.height || 0,
          datasetIds: datasetIds || [],
          classId: null,
          properties: [],
          imageURL: URL.createObjectURL(fw.file),
          uploadedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          model: {},
          approval: "pending",
          comment: "",
          labeledBy: userId || "",
          editedBy: userId || "",
          uploadedBy: userId || "",
        };
  
        try {
          // ✅ 서버에 이미지 생성 요청
          const createdImage = await apiCreateImage(newId, fw.file, 'user1', datasetIds);
  
          if (!createdImage || createdImage.error) {
            console.error("Create image failed:", createdImage.error);
            return null;
          }
  
          return {
            ...newImage,
            id: createdImage.id,
            imageURL: createdImage.imageURL,
          };
        } catch (error) {
          console.error("API Error (createImage):", error);
          return null;
        }
      })
    );
  
    // 필터링하여 실패한 이미지 제거
    const validImages = newImages.filter((img) => img !== null);
    if (validImages.length === 0) return; // 생성된 이미지가 없으면 중단
  
    // ✅ 각 dataset에 대해 서버의 최신 데이터 가져오기
    await Promise.all(
      datasetIds.map(async (datasetId) => {
        try {
          const updatedDataset = await apiGetDataset(datasetId);
          if (updatedDataset.error) {
            console.error("Failed to fetch updated dataset from server:", updatedDataset.error);
          } else {
            set((state) => ({
              ...state,
              datasets: {
                ...state.datasets,
                [datasetId]: updatedDataset,
              },
            }));
          }
        } catch (error) {
          console.error("Error fetching updated dataset from server:", error);
        }
      })
    );
  
    // ✅ Zustand 상태 업데이트: 이미지와 dataset 상태 갱신
    set((state) => {
      const updatedImages = { ...state.images };
      const updatedDatasets = { ...state.datasets };

      console.log("updatedDatasets", updatedDatasets)
  
      validImages.forEach((image) => {
        updatedImages[image.id] = image;
        image.datasetIds.forEach((datasetId) => {
          if (updatedDatasets[datasetId]) {
            updatedDatasets[datasetId] = {
              ...updatedDatasets[datasetId],
              imageIds: [...new Set([...updatedDatasets[datasetId].image_ids, image.id])],
            };
          }
        });
      });
  
      return {
        ...state,
        images: updatedImages,
        datasets: updatedDatasets,
      };
    });
  },

  saveLabels: async ({ imageId, boundingBoxes = [], keyPoints = [], segmentations = [] }) => {
    try {
      console.log(`🔄 Saving labels for image: ${imageId}`);
      console.log(`🔄 Saving labels for BoundingBoxes:`, boundingBoxes);
      console.log(`🔄 Saving labels for keyPoints: `, keyPoints);
      console.log(`🔄 Saving labels for segmentations:`, segmentations);
      
      // API 요청을 병렬로 실행
      const response = await apiSaveLabels({
        imageId,
        boundingBoxes,
        keyPoints,
        segmentations,
      });

    } catch (error) {
      console.error(`❌ Error saving labels for image ${imageId}:`, error);
    }
  },
  
}));
