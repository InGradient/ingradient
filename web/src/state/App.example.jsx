// App.jsx
import React from 'react';
import { useMyStore } from './store';

export default function App() {
  // 전역 상태 가져오기
  const datasets = useMyStore((state) => state.datasets);
  const classes = useMyStore((state) => state.classes);
  const images = useMyStore((state) => state.images);

  // 액션들
  const {
    createDataset,
    saveDataset,
    deleteDataset,
    createClass,
    saveClass,
    deleteClass,
    createImage,
    saveImage,
    deleteImage,
  } = useMyStore((state) => ({
    createDataset: state.createDataset,
    saveDataset: state.saveDataset,
    deleteDataset: state.deleteDataset,
    createClass: state.createClass,
    saveClass: state.saveClass,
    deleteClass: state.deleteClass,
    createImage: state.createImage,
    saveImage: state.saveImage,
    deleteImage: state.deleteImage,
  }));

  /** 예: dataset2에 class1 추가하기 */
  const handleAddClassToDataset2 = () => {
    // dataset2 가져와서 class1 포함하도록 수정
    const ds = datasets["dataset2"];
    if (!ds) return;
    const newClassIds = Array.from(new Set([...ds.classIds, "class1"]));

    saveDataset({
      ...ds,
      classIds: newClassIds,
      updatedAt: new Date().toISOString(),
    });
  };

  /** 예: class3 삭제 */
  const handleDeleteClass3 = () => {
    deleteClass("class3");
  };

  /** 예: 새 Dataset 만들어보기 */
  const handleCreateDataset = () => {
    const newId = createDataset("My New Dataset");
    console.log("Created dataset:", newId);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Prototype with Bidirectional Store (Zustand)</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Datasets</h2>
        <ul>
          {Object.values(datasets).map((ds) => (
            <li key={ds.id}>
              <strong>{ds.name}</strong> ({ds.id})  
              <br /> Classes: {ds.classIds.join(", ")}
              <br /> Images: {ds.imageIds.join(", ")}
              <br /> UpdatedAt: {ds.updatedAt}
              <hr />
            </li>
          ))}
        </ul>
        <button onClick={handleAddClassToDataset2}>
          Add class1 to dataset2
        </button>
        <button onClick={() => deleteDataset("dataset1")}>
          Delete dataset1
        </button>
        <button onClick={handleCreateDataset}>
          Create new dataset
        </button>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Classes</h2>
        <ul>
          {Object.values(classes).map((cls) => (
            <li key={cls.id}>
              <strong>{cls.name}</strong> ({cls.id})
              <br /> Datasets: {cls.datasetIds.join(", ")}
              <br /> Images: {cls.imageIds.join(", ")}
              <hr />
            </li>
          ))}
        </ul>
        <button onClick={handleDeleteClass3}>Delete class3</button>
        <button onClick={() => createClass("New Class")}>
          Create new class
        </button>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Images</h2>
        <ul>
          {Object.values(images).map((img) => (
            <li key={img.id}>
              <strong>{img.filename}</strong> ({img.id})
              <br /> Datasets: {img.datasetIds.join(", ")}
              <br /> Classes: {img.classIds.join(", ")}
              <br />
              <img
                src={img.imageURL}
                alt={img.filename}
                style={{ width: 100, height: 80, objectFit: "cover" }}
              />
              <hr />
            </li>
          ))}
        </ul>
        <button onClick={() => deleteImage("image7")}>Delete image7</button>
        <button onClick={() => createImage("uploadedImage.jpg")}>
          Create new image
        </button>
      </section>
    </div>
  );
}
