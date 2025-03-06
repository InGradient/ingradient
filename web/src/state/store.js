import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

import {
  // Dataset API
  listDatasets as apiListDatasets,
  getDataset as apiGetDataset,
  createDataset as apiCreateDataset,
  updateDataset as apiUpdateDataset,
  deleteDataset as apiDeleteDataset,

  // Class API
  listClasses as apiListClasses,
  getClasses as apiGetClasses,
  createClass as apiCreateClass,
  updateClass as apiUpdateClass,
  deleteClass as apiDeleteClass,

  // Image API
  listImages as apiListImages,
  getImages as apiGetImages,
  saveImages as apiSaveImages,
  upsertImage as apiUpsertImage,
  updateImage as apiUpdateImage,
  deleteImage as apiDeleteImage,
} from '@/lib/api';

import {
  initialDatasets,
  initialClasses,
  initialImages,
} from './initialData';


export const useMyStore = create((set, get) => ({
  // datasets: initialDatasets || {},
  // classes: initialClasses || {},
  // images: initialImages || {},
  datasets: {},
  classes: {},
  images: {},

  /**
   * ===================
   *  INITIAL DATA LOADING
   * ===================
   */
  loadInitialData: async () => {
    try {
      const [datasets, classes, images] = await Promise.all([
        apiListDatasets(),
        apiListClasses(),
        apiListImages(),
      ]);

      const datasetMap = Object.fromEntries(datasets.map((ds) => [ds.id, ds]));
      const classMap = Object.fromEntries(classes.map((cls) => [cls.id, cls]));
      const imageMap = Object.fromEntries(images.map((img) => [img.id, img]));

      console.log("Initial data loaded:", { datasets, classes, images });

      set({
        datasets: datasetMap,
        classes: classMap,
        images: imageMap,
      });
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
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
    // data = { id, name, description?, classIds = [], imageIds = [] }
    const { id } = data;
    const state = get();
    const existing = state.datasets[id];

    try {
      let serverResponse;
      if (existing) {
        // 이미 존재 → 서버에 Update
        // updatedData는 { name, description, ... } 형식
        const updatedData = {
          name: data.name,
          description: data.description,
        };
        serverResponse = await apiUpdateDataset(id, updatedData);
        if (serverResponse.error) {
          console.error("Update dataset failed:", serverResponse.error);
          return;
        }
      } else {
        // 존재하지 않음 → 서버에 Create
        // createDataset API에 필요한 필드는 { id, name, description? }
        const newDataset = {
          id,
          name: data.name,
          description: data.description || "",
        };
        serverResponse = await apiCreateDataset(newDataset);
        if (serverResponse.error) {
          console.error("Create dataset failed:", serverResponse.error);
          return;
        }
      }

      // 2) 로컬 상태 갱신 (기존 로직)
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
    } catch (error) {
      console.error("saveDataset error:", error);
    }
  },
  
  deleteDataset: async (datasetId) => {
    // 1) 서버에 삭제 요청
    try {
      const res = await apiDeleteDataset(datasetId);
      if (res.error) {
        console.error("Delete dataset failed:", res.error);
        return;
      }
      // 2) 삭제 성공 → 로컬 state에서 제거
      set((state) => {
        const ds = state.datasets[datasetId];
        if (!ds) return state;

        const newClasses = { ...state.classes };
        const newImages = { ...state.images };

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
    // data = { id, name, datasetIds = [], imageIds = [] ... }
    const { id } = data;
    const state = get();
    const existing = state.classes[id];

    try {
      let serverResponse;
      if (existing) {
        // 이미 존재 → 서버 Update
        const updatedData = {
          name: data.name,
          color: data.color || "#CCCCCC",
          dataset_ids: data.datasetIds || [],
        };
        serverResponse = await apiUpdateClass(id, updatedData);
        if (serverResponse.error) {
          console.error("Update class failed:", serverResponse.error);
          return;
        }
      } else {
        // 존재X → 서버 Create
        const newClass = {
          id,
          name: data.name,
          color: data.color || "#CCCCCC",
          dataset_id: data.datasetIds || [],
        };
        serverResponse = await apiCreateClass(newClass);
        if (serverResponse.error) {
          console.error("Create class failed:", serverResponse.error);
          return;
        }
      }

      console.log("Continuing Save Class:", serverResponse);

      // 로컬 state 반영 (기존 로직)
      set((state) => {
        const { datasetIds = [], imageIds = [] } = data;

        const newClasses = {
          ...state.classes,
          [id]: {
            ...state.classes[id],
            ...data,
            datasetIds,
            imageIds,
          },
        };

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
    } catch (error) {
      console.error("saveClass error:", error);
    }
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

        cls.datasetIds.forEach((dsId) => {
          if (newDatasets[dsId]) {
            newDatasets[dsId] = {
              ...newDatasets[dsId],
              classIds: newDatasets[dsId].classIds.filter((id) => id !== classId),
            };
          }
        });

        cls.imageIds.forEach((imgId) => {
          if (newImages[imgId]) {
            newImages[imgId] = {
              ...newImages[imgId],
              classId: newImages[imgId].classId === classId ? null : newImages[imgId].classId,
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
        fileLocation: data.file_location || "",
        thumbnailLocation: data.thumbnail_location || "",
        datasetIds: data.dataset_ids || [],
        classIds: data.class_ids || [],
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

      console.log("serverResponse", serverResponse)
  
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
  
        console.log("updatedDatasets", updatedDatasets);
        const newDatasets = { ...state.datasets, ...updatedDatasets };
        const newClasses = { ...state.classes };
  
        // 기존 관계 해제
        if (state.images[id]) {
          const oldDatasetIds = state.images[id].datasetIds || [];
          const oldClassId = state.images[id].classIds || null;
  
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
        console.log("dataset_ids", datasetIds);
        console.log("newDatasets", newDatasets);
        datasetIds.forEach((dsId) => {
          if (newDatasets[dsId]) {
            newDatasets[dsId] = {
              ...newDatasets[dsId],
              imageIds: [...new Set([...newDatasets[dsId].imageIds, id])],
            };
          }
        });
  
        if (classIds && newClasses[classIds]) {
          newClasses[classIds] = {
            ...newClasses[classIds],
            imageIds: [...new Set([...newClasses[classIds].imageIds, id])],
          };
        }
  
        console.log("newImages", newImages);
        console.log("updatedDatasets", newDatasets);
  
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
  
  
  deleteImage: async (imageId) => {
    try {
      const res = await apiDeleteImage(imageId);
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

        img.datasetIds.forEach((dsId) => {
          if (newDatasets[dsId]) {
            newDatasets[dsId] = {
              ...newDatasets[dsId],
              imageIds: newDatasets[dsId].imageIds.filter((id) => id !== imageId),
            };
          }
        });

        const clsId = img.classId;
        if (clsId && newClasses[clsId]) {
          newClasses[clsId] = {
            ...newClasses[clsId],
            imageIds: newClasses[clsId].imageIds.filter((id) => id !== imageId),
          };
        }

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
  
}));
