"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronLeft, 
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";

import TagManager from "@/components/molecules/TagManager";
import useLoadingStore from "@/state/loading";
import { uploadModel, listModels, extractFeatures } from "@/lib/api";

// styled-components (생략된 스타일은 기존과 동일)
const PropertyContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 100vh;
  border-left: 1px solid #ccc;
  overflow: hidden;
`;

const TitleHeader = styled.div`
  padding: 16px;
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
  activeClassIds,
  saveClass,
  deleteClass,
  saveImage,
}) {
  const [selectedButton, setSelectedButton] = useState(null);
  const { startLoading, stopLoading, setProgress, setLoadingStatus } = useLoadingStore();
  const [description, setDescription] = useState(lastClickedImage.properties?.description || "");
  const [memo, setMemo] = useState(lastClickedImage.comment || "");
  
  // 서버에서 받아온 모델 목록 (예: "feature_extract" 용도만 필터링)
  const [models, setModels] = useState([]);

  // console.log("Clicked Image Keypoints", images[lastClickedImage.id]);

  useEffect(() => {
    setDescription(lastClickedImage.properties?.description || "");
    setMemo(lastClickedImage.comment || "");
  }, [lastClickedImage]);

  useEffect(() => {
    // 컴포넌트 마운트 시 서버에서 모델 목록 가져오기
    // 특정 purpose만 받고 싶다면 listModels("feature_extract")
    // 전체 모델을 받고 싶다면 listModels() 형태로 호출
    async function fetchModels() {
      try {
        // "feature_extract" 용도 모델만 가져오는 경우
        const res = await listModels("feature_extract");
        setModels(res);
      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    }
    fetchModels();
  }, []);



  // --- ✨ 키보드 이벤트 핸들러 추가 시작 ✨ ---
  const handleKeyDown = useCallback((event) => {
    // Description이나 Memo 입력 중에는 단축키가 작동하지 않도록 함
    if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
      return;
    }

    // 눌린 키가 1부터 9 사이의 숫자인지 확인
    if (event.key >= '1' && event.key <= '9') {
      const keyNumber = parseInt(event.key, 10);
      const classIndex = keyNumber - 1; // 0부터 시작하는 인덱스로 변환

      // 유효한 클래스 인덱스인지 확인 (classes 배열 범위 내)
      if (classIndex >= 0 && classIndex < activeClassIds.length) {
        const targetClassId = activeClassIds[classIndex];

        if (!targetClassId) return; // 혹시 모를 오류 방지

        // 현재 선택된 모든 이미지에 대해 클래스 적용/해제 (토글 방식)
        selectedImageIds.forEach((imageId) => {
          const image = images[imageId];
          if (!image) return; // 이미지가 없으면 건너뜀

          // 이미지에 클래스 정보가 어떻게 저장되는지에 따라 로직 수정 필요
          // 예시: image.classIds 배열에 클래스 ID를 저장한다고 가정
          const currentClassIds = image.classIds || []; // 기존 클래스 ID 배열 가져오기 (없으면 빈 배열)
          const classExists = currentClassIds.includes(targetClassId);

          let newClassIds;
          if (classExists) {
            // 이미 클래스가 있으면 제거 (토글)
            newClassIds = currentClassIds.filter(id => id !== targetClassId);
          } else {
            // 클래스가 없으면 추가 (토글)
            // newClassIds = [...currentClassIds, targetClassId.id];
            // --- 만약 단일 클래스만 허용한다면 아래처럼 수정 ---
            newClassIds = [targetClassId];
          }

          // 변경된 이미지 정보 저장 (saveImage 함수가 classIds 업데이트를 처리한다고 가정)
          saveImage({
            ...image,
            classIds: newClassIds, // 'classIds'는 실제 이미지 데이터 구조에 맞게 수정 필요
          });
        });
      }
    }
  }, [classes, selectedImageIds, images, saveImage]); // 의존성 배열 추가

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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
   * [C] 특정 모델(서버에서 받아온)로 아직 예측되지 않은 이미지를 대상으로 Inference 실행
   */
  const runModelInference = async (modelRecord) => {
    // image.model는 { [modelID]: features, ... } 형태로 저장되어 있다고 가정
    const notPredictedImages = Object.values(images).filter(
      (img) =>
        selectedImageIds.includes(img.id) && 
        (!img.model || !img.model[modelRecord.id])
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
        modelRecord.id
      );

      // 각 이미지 객체의 model 필드에 [modelID]: features 를 추가
      updatedImages.forEach((updated) => {
        saveImage(updated);
      });

    } catch (error) {
      console.error("Error during feature extraction:", error);
    } finally {
      stopLoading();
      setLoadingStatus("Done.");
    }
  };

  /**
   * 선택된 이미지들에 대해 서버 API extractFeatures 호출
   * - image.id 를 전달하여 서버에서 직접 이미지 파일 로딩 & 추론
   */
  const extractFeaturesForSelectedImages = async (selectedImages, modelId, batchSize = 20) => {
    const updatedImages = [];
    const totalImages = selectedImages.length;

    for (let batchIndex = 0; batchIndex < Math.ceil(totalImages / batchSize); batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const batch = selectedImages.slice(startIdx, startIdx + batchSize);

      for (let i = 0; i < batch.length; i++) {
        const currentIndex = startIdx + i;
        const image = batch[i];
        try {
          // 진행 상태 업데이트
          setProgress(Math.round((currentIndex / totalImages) * 100));
          setLoadingStatus(`[${currentIndex}/${totalImages}] Processing: ${image.filename}`);

          // 실제 서버 API 호출 (modelId, image.id)
          const result = await extractFeatures(modelId, image.id);

          const featureId = result.featureId;
          updatedImages.push({
            ...image,
            model: {
              ...image.model,
              [modelId]: featureId,  // 이제 "featureId"를 넣어준다
            },
          });
        } catch (error) {
          console.error(`Failed to process image ${image.id}:`, error);
        }
      }
    }

    return updatedImages;
  };

  /**
   * 모델 목록 + 선택된 이미지들로 모델별 예측 상태를 집계
   * - 예) modelsWithCounts[modelID] = { name, total, notPredicted }
   */
  const modelsWithCounts = useMemo(() => {
    const result = {};
    if (!models.length) return result;

    models.forEach((model) => {
      // 초기값 설정
      result[model.id] = {
        name: model.name,
        total: selectedImageIds.length, // 선택된 이미지 수
        notPredicted: 0,
      };
    });

    // 각 모델별로 예측되지 않은 이미지 수 계산
    selectedImageIds.forEach((id) => {
      const image = images[id];
      if (!image || !image.model) {
        // model 정보 자체가 없으면 모든 모델에 대해 notPredicted 처리
        models.forEach((model) => {
          result[model.id].notPredicted += 1;
        });
        return;
      }
    
      models.forEach((model) => {
        if (!image.model[model.id]) {
          result[model.id].notPredicted += 1;
        }
      });
    });    

    return result;
  }, [selectedImageIds, images, models]);

  return (
    <PropertyContainer>
      <TitleHeader>
        <ToggleButton onClick={toggleDrawer}>
          {isPropertyVisible ? (
            <>
              <FontAwesomeIcon icon={faChevronRight} />
              <FontAwesomeIcon icon={faChevronRight} />
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faChevronLeft} />
              <FontAwesomeIcon icon={faChevronLeft} />
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
              activeClassIds={activeClassIds}
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
              {models.length > 0 &&
                Object.entries(modelsWithCounts).map(
                  ([modelId, { name, total, notPredicted }]) => (
                    <Chip
                      key={modelId}
                      isActive={notPredicted === 0} 
                      onClick={() => {
                        // notPredicted가 0이면 이미 전부 예측됨
                        if (notPredicted > 0) {
                          const modelRecord = models.find((m) => m.id === modelId);
                          if (modelRecord) runModelInference(modelRecord);
                        }
                      }}
                    >
                      {/* 예: 모델이름 (미예측/전체) */}
                      {name} ({total - notPredicted}/{total})
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