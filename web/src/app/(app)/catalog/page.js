"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";

import DatasetSection from "./dataset/page";
import ContentSection from "./content/page";
import PropertySection from "./property/page";
import ImageEditor from "./content/ImageEditor";

import { useMyStore } from "state/store";
import LoadingOverlay from "@/components/organisms/LoadingOverlay";
import useLoadingStore from "state/loading";

const LayoutContainer = styled.div`
  display: flex;
  justify-content: space-between;
  height: 100vh;
  overflow: hidden;
`;

export default function CatalogPage() {

  const loadDataset = useMyStore((state) => state.loadDataset);
  const loadClasses = useMyStore((state) => state.loadClasses)
  const loadImages = useMyStore((state) => state.loadImages)
  const datasets = useMyStore((state) => state.datasets);
  const classes = useMyStore((state) => state.classes);
  const images = useMyStore((state) => state.images);

  const { loading, progress, loadingStatus } = useLoadingStore();

  const createDataset = useMyStore((state) => state.createDataset);
  const saveDataset = useMyStore((state) => state.saveDataset);
  const deleteDataset = useMyStore((state) => state.deleteDataset);
  const saveClass = useMyStore((state) => state.saveClass);
  const deleteClass = useMyStore((state) => state.deleteClass);
  const createImage = useMyStore((state) => state.createImage);
  const saveImage = useMyStore((state) => state.saveImage);
  const deleteImage = useMyStore((state) => state.deleteImage);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);

  useEffect(() => {
    loadDataset();
  }, []);

  useEffect(() => {
    loadImages(selectedDatasetIds);
  }, [selectedDatasetIds]);

  useEffect(() => {
    loadClasses();
  }, []);
  
  const activeImages = useMemo(() => {
    const activeImagesDict = {};
    selectedDatasetIds.forEach((datasetId) => {
      Object.entries(images).forEach(([id, img]) => {
        activeImagesDict[id] = img;
      });
    });
    return activeImagesDict;
  }, [images, selectedDatasetIds]);

  const activeClasses = useMemo(() => {
    const allClasses = selectedDatasetIds.flatMap(
      (datasetId) => datasets[datasetId]?.classIds || []
    );
  
    const uniqueClasses = Array.from(new Set(allClasses));
  
    return uniqueClasses;
  }, [datasets, selectedDatasetIds]);
  
  

  // 사이드바 & Property 섹션 상태
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isPropertyVisible, setIsPropertyVisible] = useState(false);

  // 현재 확대중인 이미지 (URL만 아니라, 이미지 객체 전체)
  const [zoomedImageObj, setZoomedImageObj] = useState(null);

  const [selectBoxes, setSelectBoxes] = useState([]);

  const canvasRef = useRef(null);

  // 마지막으로 클릭된 이미지
  const lastClickedImage =
  selectedImageIds.length > 0
    ? images[selectedImageIds[selectedImageIds.length - 1]] || null
    : null;

  // Property 패널 토글
  // const toggleDrawer = () => setIsPropertyVisible(!isPropertyVisible);
  const toggleDrawer = () => {
    const willClose = isPropertyVisible; // Are we about to close it?
  
    setIsPropertyVisible(!isPropertyVisible);
  
    if (willClose) {
      setIsImageEditorOpen(false);
      setZoomedImageObj(null);
      setSelectBoxes([]);
    }
  };
  
  
  // lastClickedImage가 있으면 Property 패널 보이기
  useEffect(() => {
    setIsPropertyVisible(!!lastClickedImage);
  }, [lastClickedImage]);

  // ESC로 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        // 확대 이미지 닫기
        if (zoomedImageObj) {
          setZoomedImageObj(null);
        }
        // BoundingBox도 초기화 (원하는 로직에 맞게)
        setSelectBoxes([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomedImageObj]);

  const handleImageDoubleClick = (image) => {
    setIsImageEditorOpen(true);
  };  

  /**
   * 기존 박스들 다시 그리기
   * - 만약 여러 이미지에 대해 여러 박스를 저장한다면, 여기서 filter로 현재 이미지에 해당하는 박스만 그려도 됨
   */
  const drawExistingBoxes = (ctx) => {
    selectBoxes.forEach((box) => {
      // 현재 확대된 이미지에 대한 박스만 그린다고 가정
      if (box.imageId !== zoomedImageObj?.id) return;

      const classItem = classes.find((c) => c.id === box.classId);
      ctx.strokeStyle = classItem?.color || "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    });
  };

  /**
   * 확대 이미지가 바뀔 때마다 캔버스 크기 조정 & 기존 박스 그리기
   */
  useEffect(() => {
    if (!zoomedImageObj || !isPropertyVisible) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    // canvas.previousSibling → <ZoomedImage> 태그
    const imgElement = canvas.previousSibling;
    if (imgElement) {
      canvas.width = imgElement.offsetWidth;
      canvas.height = imgElement.offsetHeight;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawExistingBoxes(ctx);
  }, [zoomedImageObj, selectBoxes, classes, isPropertyVisible]);
  
  // const handleKeyDown = (e) => {
  //   if (e.key === "Enter" && selectedImageIds.length === 1) {
  //     const image = imageData.find((img) => img.id === selectedImageIds[0]);
  //     if (image) {
  //       setZoomedImageObj(image.imageURL);
  //     }
  //   }
  // };

  // useEffect(() => {
  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown);
  //   };
  // }, [selectedImageIds, imageData]);
  
  // useEffect(() => {
  //   if (selectedImageIds.length > 0) {
  //     const lastImage = images[selectedImageIds[selectedImageIds.length - 1]];
  //     if (lastImage) {
  //       setZoomedImageObj(lastImage);
  //     }
  //   }
  // }, [selectedImageIds, images]);

  return (
    <LayoutContainer>
      {loading && (
        <LoadingOverlay 
          progress={progress} 
          status={loadingStatus} 
        />
      )}
      {isSidebarVisible && (
        <DatasetSection
          datasets={datasets}
          createDataset={createDataset}
          removeDataset={deleteDataset}
          saveDataset={saveDataset}
          selectedDatasetIds={selectedDatasetIds}
          setSelectedDatasetIds={setSelectedDatasetIds}
          setIsSidebarVisible={setIsSidebarVisible}
        />
      )}

      <ContentSection
        images={activeImages}
        saveImage={saveImage}
        deleteImage={deleteImage}
        selectedDatasetIds={selectedDatasetIds}
        activeClasses={activeClasses}
        isSidebarVisible={isSidebarVisible}
        setIsSidebarVisible={setIsSidebarVisible}
        selectedImageIds={selectedImageIds}
        setSelectedImageIds={setSelectedImageIds}
        onImageDoubleClick={handleImageDoubleClick}
      />

      {isPropertyVisible && lastClickedImage && (
        <PropertySection
          isPropertyVisible={isPropertyVisible}
          toggleDrawer={toggleDrawer}
          lastClickedImage={lastClickedImage}
          images={activeImages}
          selectedDatasetIds={selectedDatasetIds}
          selectedImageIds={selectedImageIds}
          classes={classes}
          activeClasses={activeClasses}
          saveClass={saveClass}
          deleteClass={deleteClass}
          saveImage={saveImage}
        />
      )}

      {isImageEditorOpen && isPropertyVisible && lastClickedImage && (
        <ImageEditor
          image={lastClickedImage}
          saveImage={saveImage}
          classes={classes}
          onClose={() => {
            setZoomedImageObj(null);
            setIsImageEditorOpen(false);
          }}
        />
      )}
    </LayoutContainer>
  );
}
