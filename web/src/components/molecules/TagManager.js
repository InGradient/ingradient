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
  border: ${(props) => (props.isSelected ? `2px solid ${props.color}` : "2px solid var(--background-light)")};
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
  const random = () => Math.floor(Math.random() * 100 + 155); //128 + 127);
  return `rgb(${random()}, ${random()}, ${random()})`;
};

const TagManager = ({
  classes,
  saveImage,
  activeClasses,
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

  const selectedImages = useMemo(() => {
    return selectedImageIds.reduce((result, id) => {
      if (images[id]) {
        result[id] = images[id];
      }
      return result;
    }, {});
  }, [images, selectedImageIds]);  
  
  const tagStates = useMemo(() => {
    const states = {};
    Object.values(selectedImages).forEach((image) => {
      const imageClass = image.classIds || "";
      if (imageClass) {
        // 해당 클래스의 상태를 초기화하거나 카운트를 증가시킴
        states[imageClass] = states[imageClass] || { count: 0, total: 0 };
        states[imageClass].count += 1;
      }
      // 총 이미지 수는 항상 증가
      states[imageClass] = states[imageClass] || { count: 0, total: 0 };
      states[imageClass].total += 1;
    });
    return states;
  }, [selectedImages]);   

  // activeClasses 기준으로 태그 정보 초기화
  useEffect(() => {
    setTags(activeClasses);
  }, [activeClasses]);  

  const handleTagClick = useCallback(
    (tag) => {
      Object.keys(selectedImages).forEach((imageId) => {
        const currentImage = selectedImages[imageId];

        const existingClassIds = currentImage.classIds || [];
        const isTagIncluded = existingClassIds.includes(tag.id);
  
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
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isInputFocused && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (index >= 0 && index < tags.length) {
          const tagObj = activeClasses.find((cls) => cls.id === tags[index]);
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
  }, [handleTagClick, tags, isInputFocused, activeClasses]);
  

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
  
    // dict 구조의 classes를 배열로 변환 후 필터링
    const filteredSuggestions = Object.values(classes).filter(
      (cls) =>
        cls.name.toLowerCase().startsWith(value.toLowerCase()) &&
        !tags.includes(cls.id)
    );    
  
    setSuggestions(filteredSuggestions);
  };

  const handleAddTag = (classObj) => {
    if (classObj?.id) {
      // 기존 클래스 업데이트
      const updatedClassObj = {
        ...classObj,
        imageIds: Array.from(
          new Set([...(lastClickedImage ? [lastClickedImage.id] : []), ...selectedImageIds])
        ),
        datasetIds: Array.from(new Set([...selectedDatasetIds])),
      };
  
      saveClass(updatedClassObj);
  
      const updatedTags = tags.map((tag) =>
        tag.id === classObj.id ? updatedClassObj : tag
      );
      setTags(updatedTags);
    } else if (classObj?.name) {
      // 새로운 클래스 생성
      const newClass = {
        id: uuidv4(),
        name: classObj.name,
        color: generatePastelColor(),
        imageIds: Array.from(
          new Set([...(lastClickedImage ? [lastClickedImage.id] : []), ...selectedImageIds])
        ),
        datasetIds: Array.from(new Set([...selectedDatasetIds])),
      };
  
      saveClass(newClass);
      setTags([...tags, newClass.id]);
    }
  
    setInputValue("");
    setSuggestions([]);
  };
  
  /**
   * 태그(클래스) 제거
   * - 전역에서 deleteClass
   * - TagManager 내부에서도 해당 태그 제거
   */
  const handleRemoveTag = (classId) => {
    deleteClass(classId, selectedImageIds, selectedDatasetIds, false); // Remove from global context or wherever
    const newTags = tags.filter((tag) => tag.id !== classId);
    setTags(newTags);

    // 혹시 현재 선택 중인 클래스라면, 해제 처리
    if (lastClickedImage?.class === classId) {
      saveImage(lastClickedImage.id, { class: "" });
    }
  };

  return (
    <Container>
      <InputContainer>
        <StyledInput
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
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
        {tags.map((tagId) => {
          // 예시: activeClasses가 배열이라면:
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
