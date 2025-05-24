import { useCallback, useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { MagnifyingGlass } from "components/atoms/Icon";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";

const Container = styled.div`
  max-width: 500px;
`;

const TagList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TagItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isSelected" && prop !== "color",
})`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  background-color: var(--background-light);
  border: ${(props) =>
    props.isSelected ? `2px solid ${props.color}` : "2px solid var(--background-light)"};
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
`;

const TagContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TagCircle = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
`;

const TagRemove = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== "isSelected" && prop !== "color",
})`
  cursor: pointer;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
`;

const StyledInput = styled.input`
  padding: 8px;
  padding-right: 36px;
  border-radius: 8px;
  background-color: var(--background-light);
  border: 1px solid #ccc;
  width: 100%;
  height: 38px;
`;

const IconWrapper = styled.div`
  position: absolute;
  right: 10px;
  color: var(--background-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const SuggestionsList = styled.ul`
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-top: 4px;
  padding: 4px;
  list-style-type: none;
  max-height: 150px;
  overflow-y: auto;
  background-color: #fff;
`;

const SuggestionItem = styled.li`
  padding: 4px 8px;
  cursor: pointer;

  &:hover {
    background-color: #f1f1f1;
  }
`;

const generatePastelColor = () => {
  const random = () => Math.floor(Math.random() * 100 + 155);
  return `rgb(${random()}, ${random()}, ${random()})`;
};

const TagManager = ({
  classes,
  saveImage,
  activeClassIds,
  saveClass,
  deleteClass,
  lastClickedImage,
  selectedDatasetIds,
  selectedImageIds,
  images,
}) => {
  const [tags, setTags] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // 선택된 이미지 정보
  const selectedImages = useMemo(() => {
    return selectedImageIds.reduce((result, id) => {
      if (images[id]) {
        result[id] = images[id];
      }
      return result;
    }, {});
  }, [images, selectedImageIds]);

  // 각 태그(ID)에 대해 현재 선택된 이미지에서 얼마나 적용되었는지 계산
  const tagStates = useMemo(() => {
    const states = {};
    Object.values(selectedImages).forEach((image) => {
      const imageClass = image.classIds || "";
      if (imageClass) {
        states[imageClass] = states[imageClass] || { count: 0, total: 0 };
        states[imageClass].count += 1;
      }
      // 총 이미지 수는 항상 증가
      states[imageClass] = states[imageClass] || { count: 0, total: 0 };
      states[imageClass].total += 1;
    });
    return states;
  }, [selectedImages]);

  // 컴포넌트가 처음 마운트되거나 activeClassIds가 바뀔 때, 로컬 tags 상태를 초기화
  useEffect(() => {
    setTags(activeClassIds);
  }, [activeClassIds]);

  // 태그 클릭 핸들러
  const handleTagClick = useCallback(
    (tag) => {
      Object.keys(selectedImages).forEach((imageId) => {
        const currentImage = selectedImages[imageId];
        const existingClassIds = currentImage.classIds || [];
        const isTagIncluded = existingClassIds.includes(tag.id);

        // 토글 방식으로 해당 태그를 추가/제거
        const updatedImage = {
          ...currentImage,
          id: imageId,
          classIds: isTagIncluded ? [] : [tag.id],
        };
        saveImage(updatedImage);
      });
    },
    [selectedImages, saveImage]
  );

  // 숫자키(1~9)로 태그를 빠르게 토글하도록 하는 로직
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isInputFocused && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (index >= 0 && index < tags.length) {
          const tagObj = activeClassIds.find((cls) => cls.id === tags[index]);
          if (tagObj) {
            handleTagClick(tagObj);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleTagClick, tags, isInputFocused, activeClassIds]);

  // 입력값 변경 시 자동완성 제안 리스트 필터링
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const filteredSuggestions = Object.values(classes).filter(
      (cls) =>
        cls.name.toLowerCase().startsWith(value.toLowerCase()) &&
        !tags.includes(cls.id)
    );
    setSuggestions(filteredSuggestions);
  };

  // 새 태그 추가 혹은 이미 있는 태그를 사용
  const handleAddTag = (classObj) => {
    if (classObj?.id) {
      // 기존 클래스에 이미지/데이터셋을 추가하는 업데이트
      const updatedClassObj = {
        ...classObj,
        imageIds: Array.from(
          new Set([
            ...(lastClickedImage ? [lastClickedImage.id] : []),
            ...selectedImageIds,
          ])
        ),
        datasetIds: Array.from(new Set([...selectedDatasetIds])),
      };
      saveClass(updatedClassObj);

      // 로컬에서도 tags 업데이트
      // (이미 태그 ID가 있으면 그대로 두거나, 필요한 경우엔 고급 로직 추가)
      const updatedTags = tags.map((t) =>
        t.id === classObj.id ? updatedClassObj : t
      );
      setTags(updatedTags);
    } else if (classObj?.name) {
      // 완전히 새로운 클래스 생성
      const newClass = {
        id: uuidv4(),
        name: classObj.name,
        color: generatePastelColor(),
        imageIds: Array.from(
          new Set([
            ...(lastClickedImage ? [lastClickedImage.id] : []),
            ...selectedImageIds,
          ])
        ),
        datasetIds: Array.from(new Set([...selectedDatasetIds])),
      };
      saveClass(newClass);
      setTags([...tags, newClass.id]);
    }

    setInputValue("");
    setSuggestions([]);
  };

  // 태그 제거
  const handleRemoveTag = (classId) => {
    deleteClass(classId, selectedImageIds, selectedDatasetIds, false);
    setTags((prev) => prev.filter((id) => id !== classId));

    // 혹시 lastClickedImage에 같은 클래스가 있으면 해제
    if (lastClickedImage?.class === classId) {
      saveImage(lastClickedImage.id, { class: "" });
    }
  };

  const sortedactiveClassIds = activeClassIds
  .filter((id) => !!classes[id]?.createdAt)
  // .sort((a, b) => new Date(classes[b].createdAt) - new Date(classes[a].createdAt));

  const displayableClassIds = useMemo(() =>
    activeClassIds.filter(id => !!classes[id]),
    [activeClassIds, classes] // classes 객체가 변경될 때도 재계산
  );

  return (
    <Container>
      <InputContainer>
        <StyledInput
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // 엔터 입력 시 자동완성 첫 번째 항목 혹은 신규 태그 추가
              if (suggestions.length > 0) {
                handleAddTag(suggestions[0]);
              } else if (inputValue.trim()) {
                handleAddTag({ name: inputValue.trim() });
              }
            }
          }}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          placeholder="Type and add class"
        />
        <IconWrapper>
          <MagnifyingGlass />
        </IconWrapper>
      </InputContainer>

      {isInputFocused && suggestions.length > 0 && (
        <SuggestionsList>
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={index}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAddTag(suggestion)}
            >
              {suggestion.name}
            </SuggestionItem>
          ))}
        </SuggestionsList>
      )}

      <TagList>
        {displayableClassIds.map((tagId) => {
          const tagObj = classes[tagId] || {};
          const state = tagStates[tagId] || { count: 0 };
          const isSelected = state.count > 0;

          return (
            <TagItem
              key={tagId}
              color={tagObj.color}
              isSelected={isSelected}
              onClick={() => handleTagClick(tagObj)}
            >
              <TagContent>
                <TagCircle color={tagObj.color} />
                <span>{tagObj.name}</span>
                {state.count > 1 && <span>({state.count})</span>}
              </TagContent>
              <TagRemove
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tagId);
                }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </TagRemove>
            </TagItem>
          );
        })}
      </TagList>
    </Container>
  );
};

export default TagManager;
