import React, { createContext, useContext, useState, useMemo } from "react";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [datasets, setDatasets] = useState([
    {
      id: '1',
      name: "Dataset 1",
      description: "This is the first dataset",
      classes: ["1"],
      images: ["1", "2"],
      uploadedAt: "2023-12-01",
      updatedAt: "2023-12-15",
    },
    {
      id: '2',
      name: "Dataset 2",
      description: "This is the second dataset",
      classes: ["1", "2", "3"],
      images: ["3", "4", "5", "6", "7"],
      uploadedAt: "2023-11-25",
      updatedAt: "2023-12-10",
    },
  ]);

  const [imageData, setImageData] = useState([
    {
      id: '1',
      class: "1",
      dataset: ["1"],
      filename: "image1.jpg",
      properties: [
        {
          value: "Another cute dog.",
          type: "string",
          label: "Description",
        },
      ],
      imageURL:
        "https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg",
      uploadedAt: "2023-12-01",
      updatedAt: "2023-12-15",
      model: { dinov2: [0.1, 0.5] },
      approval: "approved",
      comment: "", // default comment
      labeledBy: "user1", // default labeledBy
      editedBy: "user1", // default editedBy
      uploadedBy: "user1", // default uploadedBy
    },
    {
      id: '2',
      class: "1",
      dataset: ["1"],
      filename: "image2.jpg",
      properties: [
        {
          value: "Second cute dog.",
          type: "string",
          label: "Description",
        },
      ],
      imageURL:
        "https://cdn.britannica.com/79/232779-050-6B0411D7/German-Shepherd-dog-Alsatian.jpg",
      uploadedAt: "2023-12-02",
      updatedAt: "2023-12-16",
      model: { dinov2: [0.2, 0.6] },
      approval: "approved",
      comment: "",
      labeledBy: "user1",
      editedBy: "user1",
      uploadedBy: "user1",
    },
    {
      id: '3',
      class: "3",
      dataset: ["2"],
      filename: "image3.jpg",
      properties: [
        {
          value: "3rd cute dog.",
          type: "string",
          label: "Description",
        },
      ],
      imageURL:
        "https://content.dogagingproject.org/wp-content/uploads/2020/11/helena-lopes-S3TPJCOIRoo-unsplash-scaled.jpg",
      uploadedAt: "2023-12-03",
      updatedAt: "2023-12-16",
      model: { dinov2: [0.3, 0.7] },
      approval: "approved",
      comment: "",
      labeledBy: "user1",
      editedBy: "user1",
      uploadedBy: "user1",
    },
    {
      id: '4',
      class: "2",
      dataset: ["2"],
      filename: "image4.jpg",
      properties: [
        {
          value: "Another cute dog.",
          type: "string",
          label: "Description",
        },
      ],
      imageURL:
        "https://hips.hearstapps.com/hmg-prod/images/small-fluffy-dog-breeds-maltipoo-66300ad363389.jpg",
      uploadedAt: "2023-12-04",
      updatedAt: "2023-12-16",
      model: { dinov2: [0.4, 0.8] },
      approval: "approved",
      comment: "",
      labeledBy: "user1",
      editedBy: "user1",
      uploadedBy: "user1",
    },
    {
      id: '5',
      class: "1",
      dataset: ["2"],
      filename: "image5.jpg",
      properties: [
        {
          value: "Black dog.",
          type: "string",
          label: "Description",
        },
      ],
      imageURL:
        "https://i.natgeofe.com/n/5f35194b-af37-4f45-a14d-60925b280986/NationalGeographic_2731043_square.jpg",
      uploadedAt: "2023-12-05",
      updatedAt: "2023-12-16",
      model: { dinov2: [0.5, 0.9] },
      approval: "approved",
      comment: "",
      labeledBy: "user1",
      editedBy: "user1",
      uploadedBy: "user1",
    },
    {
      id: '6',
      class: "3",
      dataset: ["2"],
      filename: "image6.jpg",
      properties: [
        {
          value: "Golden running dog.",
          type: "string",
          label: "Description",
        },
      ],
      imageURL:
        "https://images.theconversation.com/files/625049/original/file-20241010-15-95v3ha.jpg",
      uploadedAt: "2023-12-06",
      updatedAt: "2023-12-16",
      model: { dinov2: [0.6, 1.0] },
      approval: "approved",
      comment: "",
      labeledBy: "user1",
      editedBy: "user1",
      uploadedBy: "user1",
    },
    {
      id: '7',
      class: "1",
      dataset: ["2"],
      filename: "image7.jpg",
      properties: [
        {
          value: "White cute dog.",
          type: "string",
          label: "Description",
        },
      ],
      imageURL:
        "https://cdn.outsideonline.com/wp-content/uploads/2023/03/Funny_Dog_S.jpg",
      uploadedAt: "2023-12-07",
      updatedAt: "2023-12-16",
      model: { dinov2: [0.7, 1.1] },
      approval: "approved",
      comment: "",
      labeledBy: "user1",
      editedBy: "user1",
      uploadedBy: "user1",
    },
  ]);  
  
  const [classes, setClasses] = useState([
    {
      id: '1',
      name: "Shepherd",
      dataset: ["1", "2"],
      color: "#FFB3BA", // Pastel pink
      images: ["1", "2", "3", "6", "7"],
      createdAt: "2023-12-01",
    },
    {
      id: '2',
      name: "Maltipoo",
      dataset: ["2"],
      color: "#B3FFB3", // Pastel green
      images: ["3", "4", "5"],
      createdAt: "2023-12-02",
    },
    {
      id: '3',
      name: "Golden Retriever",
      dataset: ["2"],
      color: "#B3D9FF", // Pastel blue
      images: ["4"],
      createdAt: "2023-12-03",
    },
  ]);  

  // 선택된 dataset ID 및 image ID
  const [selectedDatasetIds, setSelectedDatasetIds] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);

  // 선택된 dataset에 따라 활성화된 images
  const activeImages = useMemo(() => {
    return imageData.filter((img) =>
      img.dataset.some((datasetId) => selectedDatasetIds.includes(datasetId))
    );
  }, [imageData, selectedDatasetIds]);

  // 선택된 dataset에 따라 활성화된 classes
  const activeClasses = useMemo(() => {
    return classes.filter((cls) =>
      cls.dataset.some((datasetId) => selectedDatasetIds.includes(datasetId))
    );
  }, [classes, selectedDatasetIds]);

  const addDataset = (newDataset) => {
    setDatasets((prev) => [newDataset, ...prev]);
  };

  const addImage = (newImages) => {
    // newImages가 배열이므로 반복문으로 하나씩 처리
    newImages.forEach((img) => {
      // 1) imageData에 추가
      setImageData((prev) => [img, ...prev]);
  
      // 2) datasets 업데이트
      setDatasets((prevDatasets) =>
        prevDatasets.map((dataset) =>
          img.dataset.includes(dataset.id)
            ? { ...dataset, images: [...dataset.images, img.id] }
            : dataset
        )
      );
  
      // 3) classes 업데이트 (img.classes가 있을 경우)
      //    (img에 classes가 없는 경우, 여기서 undefined 에러가 또 날 수 있으므로 체크 필요)
      if (img.class) {
        // 만약 img.class(단일)나 img.classes(배열)가 있다면 아래 로직으로 처리
        // 예: img.classes가 배열이라고 가정
        setClasses((prevClasses) =>
          prevClasses.map((cls) =>
            img.classes?.includes(cls.id)
              ? {
                  ...cls,
                  dataset: [...new Set([...cls.dataset, ...img.dataset])],
                }
              : cls
          )
        );
      }
    });
  };  
  
  const updateClass = (newClass) => {
    console.log("updateClass :", newClass);
    setClasses((prev) => {
      const index = prev.findIndex((cls) => cls.id === newClass.id);
      if (index !== -1) {
        // Replace the existing class
        const updatedClasses = [...prev];
        updatedClasses[index] = newClass;
        return updatedClasses;
      } else {
        // Add as a new class if it doesn't exist
        return [newClass, ...prev];
      }
    });
  
    setDatasets((prevDatasets) =>
      prevDatasets.map((dataset) => {
        if (newClass.dataset.includes(dataset.id)) {
          const updatedClasses = dataset.classes.includes(newClass.id)
            ? dataset.classes
            : [...dataset.classes, newClass.id];
          return { ...dataset, classes: updatedClasses };
        }
        return dataset;
      })
    );
  
    setImageData((prevImageData) =>
      prevImageData.map((image) => {
        if (newClass.images.includes(image.id)) {
          const updatedClasses = image.class.includes(newClass.id)
            ? image.class
            : [...new Set([...image.class, newClass.id])];
          return { ...image, class: updatedClasses };
        }
        return image;
      })
    );
  };

  const removeDataset = (datasetId) => {
    setDatasets((prev) => prev.filter((dataset) => dataset.id !== datasetId));
  
    setImageData((prevImageData) =>
      prevImageData.filter((image) => !image.dataset.includes(datasetId))
    );
  
    setClasses((prevClasses) =>
      prevClasses.map((cls) => ({
        ...cls,
        dataset: cls.dataset.filter((id) => id !== datasetId),
      }))
    );
  };
  
  const removeImage = (imageId) => {
    setImageData((prev) => prev.filter((image) => image.id !== imageId));
  
    setDatasets((prevDatasets) =>
      prevDatasets.map((dataset) => ({
        ...dataset,
        images: dataset.images.filter((id) => id !== imageId),
      }))
    );
  
    setClasses((prevClasses) =>
      prevClasses.map((cls) => ({
        ...cls,
        images: cls.images.filter((id) => id !== imageId),
      }))
    );
  };
    
  // Classes, Datasets, 그리고 연관된 ImageData에서 특정 클래스를 제거합니다.
  const removeClass = (
    classId, 
    selectedImageIds, 
    selectedDatasetIds, 
    removeFromClasses = true
  ) => {
    // 1. removeFromClasses가 true인 경우, 해당 클래스를 `classes` 상태에서 완전히 제거합니다.
    if (removeFromClasses) {
      setClasses((prev) => prev.filter((cls) => cls.id !== classId));
    }

    // 2. 각 dataset에서 제거하려는 class를 삭제합니다.
    setDatasets((prevDatasets) =>
      prevDatasets.map((dataset) => ({
        ...dataset,
        classes: dataset.classes.filter((id) => id !== classId),
      }))
    );

    // 3. 각 이미지에 대해 다음을 수행합니다:
    //    - 해당 이미지가 `selectedImageIds`에 명시적으로 포함되었거나,
    //    - 해당 이미지가 `selectedDatasetIds`에 포함된 dataset에 속한 경우,
    //    - 그리고 현재 삭제하려는 class를 가진 경우,
    //    => 이 이미지의 `class` 필드를 "None"으로 설정합니다.
    setImageData((prevImageData) =>
      prevImageData.map((image) => {
        // 이 이미지가 선택된 데이터셋에 속하는지 확인
        const belongsToSelectedDataset = image.dataset.some((dId) =>
          selectedDatasetIds.includes(dId)
        );

        // (이미지가 명시적으로 선택되었거나 OR 선택된 데이터셋에 속해 있는 경우)
        // AND 이미지의 class가 삭제하려는 classId인 경우, class를 "None"으로 설정
        if (
          (selectedImageIds.includes(image.id) || belongsToSelectedDataset) &&
          image.class === classId
        ) {
          return { ...image, class: "None" };
        }
        return image;
      })
    );

    // 4. removeFromClasses가 false인 경우:
    //    class 자체를 제거하지 않고(`classes`에서 유지),
    //    해당 클래스의 `dataset` 필드에서 선택된 데이터셋 연결만 제거합니다.
    if (!removeFromClasses) {
      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === classId
            ? {
                ...cls,
                dataset: cls.dataset.filter(
                  (id) => !selectedDatasetIds.includes(id)
                ),
              }
            : cls
        )
      );
    }
  };

  
  const updateDataset = (datasetId, updates) => {
    setDatasets((prev) =>
      prev.map((dataset) =>
        dataset.id === datasetId ? { ...dataset, ...updates } : dataset
      )
    );
  };
  
  const updateImage = (imageId, updates) => {
    setImageData((prev) =>
      prev.map((image) =>
        image.id === imageId ? { ...image, ...updates, updatedAt: new Date().toISOString() } : image
      )
    );
  };
  
  return (
    <DataContext.Provider
      value={{
        datasets,
        setDatasets,
        imageData,
        setImageData,
        classes,
        setClasses,
        selectedDatasetIds,
        setSelectedDatasetIds,
        selectedImageIds,
        setSelectedImageIds,
        activeImages,
        activeClasses,
        addDataset,
        addImage,
        updateClass,
        removeDataset,
        removeImage,
        removeClass,
        updateDataset,
        updateImage,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Custom Hook
export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
};
