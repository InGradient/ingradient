"use client";

import { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronLeft, 
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";

import MODELS from "@/config/models";
import { runDinov2Model } from "@/lib/onnx";
import TagManager from "@/components/molecules/TagManager";
import useLoadingStore from "@/state/loading";

const PropertyContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 100vh;
  border-left: 1px solid #ccc;
  overflow: hidden;
`;

const TitleHeader = styled.div`
  padding: 16px 16px 16px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilenameWrapper = styled.div`
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 100%;
`;

const TruncatedFilename = styled.span`
  display: inline-block;
  margin-right: 4px;
  max-width: calc(100% - 20px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
  padding: 16px;
  overflow-y: auto;
`;

const DetailsContent = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
`;

const DetailsWrapper = styled.div`
  display: flex;
  padding: 16px;
  background: var(--background-muted);
  flex-direction: column;
  gap: 14px;
  border-radius: 8px;
`;

const DetailsContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid #D0DAE8;
  background: var(--background-light);
  padding: 8px;
`;

const ToggleButton = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: ${({ $isDrawerOpen }) => ($isDrawerOpen ? "none" : "flex")};
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  color: var(--color-black);
  background-color: var(--neutral-200);

  & > svg + svg {
    margin-left: -4px;
  }
`;

const Thumbnail = styled.img`
  width: 100%;
  object-fit: cover;
  margin-bottom: 8px;
  border-radius: 8px;
`;

const EditableTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 8px;
  font-size: 14px;
  font-family: Arial, sans-serif;
  resize: none;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== "isSelected",
})`
  flex: 1;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  background-color: ${({ isSelected }) =>
    isSelected ? "var(--accent-active)" : "white"};
  color: ${({ isSelected }) => (isSelected ? "white" : "black")};
  font-weight: ${({ isSelected }) => (isSelected ? "bold" : "normal")};

  &:hover {
    background-color: var(--accent-hover);
    color: white;
  }
`;

const ChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Chip = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isActive",
})`
  padding: 8px 12px;
  border-radius: 16px;
  white-space: nowrap;
  background-color: ${({ isActive }) => (isActive ? "black" : "white")};
  color: ${({ isActive }) => (isActive ? "white" : "black")};
  border: 1px solid black;
  cursor: ${({ isActive }) => (isActive ? "default" : "pointer")};
`;

export default function PropertySection({
  isPropertyVisible,
  toggleDrawer,
  lastClickedImage,
  images,
  selectedDatasetIds,
  selectedImageIds,
  classes,
  activeClasses,
  saveClass,
  deleteClass,
  saveImage,
}) {
  const [selectedButton, setSelectedButton] = useState(null);
  const { startLoading, stopLoading, setProgress, setLoadingStatus } = useLoadingStore();
  const [description, setDescription] = useState(
    lastClickedImage.properties?.description || ""
  );
  const [memo, setMemo] = useState(lastClickedImage.comment || "")

  useEffect(() => {
    setDescription(lastClickedImage.properties?.description || "");
    setMemo(lastClickedImage.comment || "");
  }, [lastClickedImage]);

  const toggleButtonSelection = (button) => {
    setSelectedButton((prev) => (prev === button ? null : button));
  };

  const handleDescriptionBlur = () => {
    const newProperties = {
      ...lastClickedImage.properties,
      description,
    };
  
    saveImage({
      ...lastClickedImage,
      properties: newProperties,
    });
  };
  
  const handleMemoBlur = () => {
    saveImage({
      ...lastClickedImage,
      comment: memo,
    });
  };

  /**
   * [C] 선택된 모델에 대해 예측되지 않은 이미지를 대상으로 Inference 실행
   */
  const runModelInference = async (modelName) => {
    const notPredictedImages = Object.values(images).filter(
      (img) =>
        selectedImageIds.includes(img.id) && !img.model?.[modelName]
    );
  
    if (notPredictedImages.length === 0) {
      alert("All selected images are already processed by this model.");
      return;
    }
  
    // 로딩 시작
    startLoading();
    setProgress(0);
    setLoadingStatus("Starting inference...");
  
    try {
      const updatedImages = await extractFeaturesForSelectedImages(
        notPredictedImages,
        modelName
      );
  
      // 결과를 업데이트
      updatedImages.forEach((updated) => {
        saveImage(updated);
      });
  
      console.log("Feature extraction complete.");
    } catch (error) {
      console.error("Error during feature extraction:", error);
    } finally {
      stopLoading();
      setLoadingStatus("Done.");
    }
  };

  const allModelNames = Object.keys(MODELS);
  
  /**
   * [B] 선택된 이미지 목록에 대해 실제 추론을 수행하는 함수
   *     → 여기에서 progress와 status를 갱신하며 LoadingOverlay를 제어.
   */
  const extractFeaturesForSelectedImages = async (selectedImages, modelName, batchSize = 20) => {
    const updatedImages = [];
    const totalImages = selectedImages.length;
  
    for (let batchIndex = 0; batchIndex < Math.ceil(totalImages / batchSize); batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const batch = selectedImages.slice(startIdx, startIdx + batchSize);
  
      for (let i = 0; i < batch.length; i++) {
        const currentIndex = startIdx + i;
        const image = batch[i];
        try {
          // 상태 업데이트
          setProgress(Math.round((currentIndex / totalImages) * 100));
          setLoadingStatus(`[${currentIndex}/${totalImages}] Processing: ${image.filename}`);
  
          // 모델 실행
          const extractedFeatures = await runDinov2Model(image.fileLocation);
          
          // 결과 업데이트
          updatedImages.push({
            ...image,
            model: {
              ...image.model,
              [modelName]: extractedFeatures,
            },
          });
  
          // **명시적 메모리 해제**
          if (typeof extractedFeatures.dispose === "function") {
            extractedFeatures.dispose(); // WebAssembly 메모리 해제
          }
        } catch (error) {
          console.error(`Failed to process image ${image.id}:`, error);
        }
      }
    }
  
    return updatedImages;
  };

  const modelsWithCounts = useMemo(() => {
    const result = {};
    selectedImageIds.forEach((id) => {
      const image = images[id];
      allModelNames.forEach((modelName) => {
        const hasPrediction = image?.model?.[modelName];
        if (!result[modelName]) {
          result[modelName] = { total: 0, notPredicted: 0 };
        }
        result[modelName].total += 1;
        if (!hasPrediction) {
          result[modelName].notPredicted += 1;
        }
      });
    });
    return result;
  }, [selectedImageIds, images]);

  return (
    <PropertyContainer>
      <TitleHeader>
        <ToggleButton onClick={toggleDrawer}>
          {isPropertyVisible ? (
            <>
              <FontAwesomeIcon icon={faChevronLeft} />
              <FontAwesomeIcon icon={faChevronLeft} />
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faChevronRight} />
              <FontAwesomeIcon icon={faChevronRight} />
            </>
          )}
        </ToggleButton>
        <h1>Property</h1>
      </TitleHeader>

      <ContentContainer>
        <DetailsContent>
          <DetailsWrapper>
            <h3>Filename</h3>
            <DetailsContentWrapper>
              <FilenameWrapper>
                {selectedImageIds.slice(0, 3).map((id, index) => {
                  const image = images[id];
                  return (
                    <TruncatedFilename key={id}>
                      {image?.filename || "Unknown"}
                      {index < selectedImageIds.slice(0, 3).length - 1 ? ", " : ""}
                    </TruncatedFilename>
                  );
                })}
                {selectedImageIds.length > 5 && (
                  <TruncatedFilename>+{selectedImageIds.length - 5} more</TruncatedFilename>
                )}
              </FilenameWrapper>
            </DetailsContentWrapper>
          </DetailsWrapper>

          <DetailsWrapper>
            <h3>Class</h3>
            <TagManager
              classes={classes}
              saveImage={saveImage}
              activeClasses={activeClasses}
              saveClass={saveClass}
              deleteClass={deleteClass}
              selectedDatasetIds={selectedDatasetIds}
              selectedImageIds={selectedImageIds}
              images={images}
              lastClickedImage={lastClickedImage}
            />
          </DetailsWrapper>

          <DetailsWrapper>
            <h3>Inference By</h3>
            <ChipContainer>
              {Object.entries(modelsWithCounts).map(
                ([modelName, { total, notPredicted }]) =>
                  selectedImageIds.length > 1 && notPredicted > 0 ? (
                    <Chip
                      key={modelName}
                      isActive={notPredicted === 0}
                      onClick={() => {
                        if (notPredicted > 0) {
                          runModelInference(modelName);
                        }
                      }}
                    >
                      {modelName} ({notPredicted}/{total})
                    </Chip>
                  ) : (
                    <Chip
                      key={modelName}
                      isActive={notPredicted === 0}
                      onClick={() => {
                        if (notPredicted > 0) {
                          runModelInference(modelName);
                        }
                      }}
                    >
                      {modelName}
                    </Chip>
                  )
              )}
            </ChipContainer>
          </DetailsWrapper>

          <DetailsWrapper>
            <h3>Description</h3>
            <EditableTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
            />
          </DetailsWrapper>

          <DetailsWrapper>
            <h3>Memo</h3>
            <EditableTextarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={handleMemoBlur}
            />
          </DetailsWrapper>

          <DetailsWrapper>
            <h3>Approval</h3>
            <ButtonWrapper>
              <ActionButton
                isSelected={selectedButton === "approve"}
                onClick={() => toggleButtonSelection("approve")}
              >
                Approve
              </ActionButton>
              <ActionButton
                isSelected={selectedButton === "reject"}
                onClick={() => toggleButtonSelection("reject")}
              >
                Reject
              </ActionButton>
            </ButtonWrapper>
          </DetailsWrapper>
        </DetailsContent>
      </ContentContainer>
    </PropertyContainer>
  );
}
