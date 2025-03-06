import { useCallback, useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { MagnifyingGlass } from "components/atoms/Icon";
import styled from "styled-components";
import { image } from "@tensorflow/tfjs";

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
      const imageClass = image.classId || ""; // `class`를 가져옴
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
    const initialTags = activeClasses.map((classObj) => ({
      id: classObj.id,
      name: classObj.name,
      color: classObj.color,
    }));
    setTags(initialTags);
  }, [activeClasses]);

  /**
   * 태그 클릭 시:
   * - 이미 선택된 클래스이면 → None ("" 혹은 null)
   * - 아니라면 해당 클래스로 교체
   */
  const handleTagClick = useCallback(
    (tag) => {
      const isSelected = tagStates[tag.id]?.count > 0;

      Object.keys(selectedImages).forEach((imageId) => {
        const currentImage = selectedImages[imageId];
        const updatedClassId = isSelected ? null : tag.id;
  
        saveImage({
          ...currentImage,
          id: imageId,
          classId: updatedClassId,
        });
      });
    },
    [selectedImages, tagStates, saveImage, image.id]
  );  

  /**
   * 숫자 키(1~9) 누르면 해당 인덱스의 태그 클릭
   * - 단일 클래스이므로 로직은 그대로 사용 가능
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isInputFocused && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (index >= 0 && index < tags.length) {
          handleTagClick(tags[index]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleTagClick, tags, isInputFocused]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
  
    // dict 구조의 classes를 배열로 변환 후 필터링
    const filteredSuggestions = Object.values(classes).filter(
      (cls) =>
        cls.name.toLowerCase().startsWith(value.toLowerCase()) &&
        !tags.some((tag) => tag.id === cls.id)
    );
  
    setSuggestions(filteredSuggestions);
  };  

  /**
   * 태그 추가: 이미 있는 class라면 해당 class 사용,
   *           없는 class라면 새로 생성
   */
  const handleAddTag = (classObj) => {
    if (classObj?.id) {
      // 기존 클래스 업데이트
      const updatedClassObj = {
        ...classObj,
        imageIds: Array.from(new Set([...classObj.imageIds, ...selectedImageIds])),
        datasetIds: Array.from(new Set([...classObj.datasetIds, ...selectedDatasetIds])),
      };

      console.log("Input Class API:", updatedClassObj);
  
      saveClass(updatedClassObj); // 업데이트된 클래스 전달

      console.log("Completed Save Class:", updatedClassObj);
  
      // 기존 태그 상태 업데이트
      const updatedTags = tags.map((tag) =>
        tag.id === classObj.id ? updatedClassObj : tag
      );
      setTags(updatedTags);
  
      // 선택된 이미지 업데이트
      selectedImageIds.forEach((imageId) => {
        saveImage(imageId, { class: classObj.id });
      });
    } else if (classObj?.name) {
      // 새로운 클래스 생성
      const newClass = {
        id: `class-${Date.now()}`,
        name: classObj.name,
        color: generatePastelColor(),
        imageIds: Array.from(
          new Set([...(lastClickedImage ? [lastClickedImage.id] : []), ...selectedImageIds])
        ),
        datasetIds: Array.from(new Set([...selectedDatasetIds])),
      };
  
      saveClass(newClass); // 새 클래스 전달
      setTags([...tags, newClass]);
  
      // 선택된 이미지 업데이트
      selectedImageIds.forEach((imageId) => {
        saveImage(imageId, { class: newClass.id });
      });
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
        {tags.map((tag) => {
          const state = tagStates[tag.id] || { count: 0 };
          const isSelected = state.count > 0;

          return (
            <TagItem
              key={tag.id}
              color={tag.color}
              isSelected={isSelected}
            >
              {/* TagContent 클릭 시 클래스 선택 */}
              <TagContent onClick={() => handleTagClick(tag)}>
                <TagCircle color={tag.color} />
                <span>{tag.name}</span>
                {state.count > 1 && <span>({state.count})</span>}
              </TagContent>

              {/* X 버튼 클릭 시 태그 제거 */}
              <TagRemove
                onClick={() => handleRemoveTag(tag.id)}
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
