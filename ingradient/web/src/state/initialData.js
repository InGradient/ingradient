function generateRandomFloat32Array(size) {
  const array = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    array[i] = Math.random(); // 0과 1 사이의 랜덤 값
  }
  return array;
}

export const initialDatasets = {
  dataset1: {
    id: "dataset1",
    name: "Dataset 1",
    description: "This is the first dataset",
    classIds: ["class1"],       // Shepherd
    imageIds: ["image1", "image2"],
    uploadedAt: "2023-12-01",
    updatedAt: "2023-12-15",
  },
  dataset2: {
    id: "dataset2",
    name: "Dataset 2",
    description: "This is the second dataset",
    classIds: ["class2", "class3"],  // Maltipoo, Golden Retriever
    imageIds: ["image3", "image4", "image5", "image6", "image7"],
    uploadedAt: "2023-11-25",
    updatedAt: "2023-12-10",
  },
};

export const initialClasses = {
  // Shepherd
  class1: {
    id: "class1",
    name: "Shepherd",
    datasetIds: ["dataset1"],         // belongs to dataset1
    imageIds: ["image1", "image2"],   // two images
    color: "#FFB3BA",
    createdAt: "2023-12-01",
  },
  // Maltipoo
  class2: {
    id: "class2",
    name: "Maltipoo",
    datasetIds: ["dataset2"],
    imageIds: ["image4", "image5"],   // image4, image5
    color: "#B3FFB3",
    createdAt: "2023-12-02",
  },
  // Golden Retriever
  class3: {
    id: "class3",
    name: "Golden Retriever",
    datasetIds: ["dataset2"],
    imageIds: ["image3", "image6", "image7"], // image3,6,7
    color: "#B3D9FF",
    createdAt: "2023-12-03",
  },
};

export const initialImages = {
  // image1 → dataset1, class1
  image1: {
    id: "image1",
    filename: "image1.jpg",
    datasetIds: ["dataset1"],
    classId: "class1",
    properties: [
      { value: "Another cute dog.", type: "string", label: "Description" },
    ],
    imageURL:
      "https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg",
    uploadedAt: "2023-12-01",
    updatedAt: "2023-12-15",
    model: { dinov2: generateRandomFloat32Array(100224) },
    approval: "approved",
    comment: "",
    labeledBy: "user1",
    editedBy: "user1",
    uploadedBy: "user1",
  },
  // image2 → dataset1, class1
  image2: {
    id: "image2",
    filename: "image2.jpg",
    datasetIds: ["dataset1"],
    classId: "class1",
    properties: [
      { value: "Second cute dog.", type: "string", label: "Description" },
    ],
    imageURL:
      "https://cdn.britannica.com/79/232779-050-6B0411D7/German-Shepherd-dog-Alsatian.jpg",
    uploadedAt: "2023-12-02",
    updatedAt: "2023-12-16",
    model: { dinov2: generateRandomFloat32Array(100224) },
    approval: "approved",
    comment: "",
    labeledBy: "user1",
    editedBy: "user1",
    uploadedBy: "user1",
  },
  // image3 → dataset2, class3
  image3: {
    id: "image3",
    filename: "image3.jpg",
    datasetIds: ["dataset2"],
    classId: "class3",
    properties: [
      { value: "3rd cute dog.", type: "string", label: "Description" },
    ],
    imageURL:
      "https://content.dogagingproject.org/wp-content/uploads/2020/11/helena-lopes-S3TPJCOIRoo-unsplash-scaled.jpg",
    uploadedAt: "2023-12-03",
    updatedAt: "2023-12-16",
    model: { dinov2: generateRandomFloat32Array(100224) },
    approval: "approved",
    comment: "",
    labeledBy: "user1",
    editedBy: "user1",
    uploadedBy: "user1",
  },
  // image4 → dataset2, class2
  image4: {
    id: "image4",
    filename: "image4.jpg",
    datasetIds: ["dataset2"],
    classId: "class2",
    properties: [
      { value: "Another cute dog.", type: "string", label: "Description" },
    ],
    imageURL:
      "https://hips.hearstapps.com/hmg-prod/images/small-fluffy-dog-breeds-maltipoo-66300ad363389.jpg",
    uploadedAt: "2023-12-04",
    updatedAt: "2023-12-16",
    model: { dinov2: generateRandomFloat32Array(100224) },
    approval: "approved",
    comment: "",
    labeledBy: "user1",
    editedBy: "user1",
    uploadedBy: "user1",
  },
  // image5 → dataset2, class2
  image5: {
    id: "image5",
    filename: "image5.jpg",
    datasetIds: ["dataset2"],
    classId: "class2",
    properties: [
      { value: "Black dog.", type: "string", label: "Description" },
    ],
    imageURL:
      "https://i.natgeofe.com/n/5f35194b-af37-4f45-a14d-60925b280986/NationalGeographic_2731043_square.jpg",
    uploadedAt: "2023-12-05",
    updatedAt: "2023-12-16",
    model: { dinov2: generateRandomFloat32Array(100224) },
    approval: "approved",
    comment: "",
    labeledBy: "user1",
    editedBy: "user1",
    uploadedBy: "user1",
  },
  // image6 → dataset2, class3
  image6: {
    id: "image6",
    filename: "image6.jpg",
    datasetIds: ["dataset2"],
    classId: "class3",
    properties: [
      { value: "Golden running dog.", type: "string", label: "Description" },
    ],
    imageURL:
      "https://images.theconversation.com/files/625049/original/file-20241010-15-95v3ha.jpg",
    uploadedAt: "2023-12-06",
    updatedAt: "2023-12-16",
    model: { dinov2: generateRandomFloat32Array(100224) },
    approval: "approved",
    comment: "",
    labeledBy: "user1",
    editedBy: "user1",
    uploadedBy: "user1",
  },
  // image7 → dataset2, class3
  image7: {
    id: "image7",
    filename: "image7.jpg",
    datasetIds: ["dataset2"],
    classId: "class3",
    properties: [
      { value: "White cute dog.", type: "string", label: "Description" },
    ],
    imageURL:
      "https://cdn.outsideonline.com/wp-content/uploads/2023/03/Funny_Dog_S.jpg",
    uploadedAt: "2023-12-07",
    updatedAt: "2023-12-16",
    model: { dinov2: generateRandomFloat32Array(100224) },
    approval: "approved",
    comment: "",
    labeledBy: "user1",
    editedBy: "user1",
    uploadedBy: "user1",
  },
};
