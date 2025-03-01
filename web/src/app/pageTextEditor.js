// "use client";

// import { useRef } from "react";
// import styled from "styled-components";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faBold,
//   faItalic,
//   faUnderline,
//   faStrikethrough,
//   faImage,
//   faLink,
// } from "@fortawesome/free-solid-svg-icons";

// export default function Page() {
//   const editorRef = useRef(null);

//   // 텍스트 포맷 커맨드 (document.execCommand)
//   const handleCommand = (command) => {
//     document.execCommand(command, false, null);
//   };

//   // 로컬 이미지 업로드
//   const handleImageUpload = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const dataUrl = event.target?.result;
//       document.execCommand("insertImage", false, dataUrl);
//     };
//     reader.readAsDataURL(file);
//   };

//   // 이미지 URL 삽입
//   const handleImageFromURL = () => {
//     const url = prompt("이미지 URL을 입력하세요:");
//     if (url) {
//       document.execCommand("insertImage", false, url);
//     }
//   };

//   return (
//     <Container>
//       <Toolbar>
//         <ToolbarButton onClick={() => handleCommand("bold")}>
//           <FontAwesomeIcon icon={faBold} />
//         </ToolbarButton>
//         <ToolbarButton onClick={() => handleCommand("italic")}>
//           <FontAwesomeIcon icon={faItalic} />
//         </ToolbarButton>
//         <ToolbarButton onClick={() => handleCommand("underline")}>
//           <FontAwesomeIcon icon={faUnderline} />
//         </ToolbarButton>
//         <ToolbarButton onClick={() => handleCommand("strikeThrough")}>
//           <FontAwesomeIcon icon={faStrikethrough} />
//         </ToolbarButton>

//         {/* 로컬 이미지 업로드 */}
//         <ImageInputLabel>
//           <FontAwesomeIcon icon={faImage} />
//           <ImageInput
//             type="file"
//             accept="image/*"
//             onChange={handleImageUpload}
//           />
//         </ImageInputLabel>

//         {/* 이미지 URL 삽입 */}
//         <ToolbarButton onClick={handleImageFromURL}>
//           <FontAwesomeIcon icon={faLink} />
//         </ToolbarButton>
//       </Toolbar>

//       <EditorContainer
//         contentEditable
//         suppressContentEditableWarning={true}
//         ref={editorRef}
//       />
//     </Container>
//   );
// }

// // 전체 화면을 쓰기 위한 컨테이너
// const Container = styled.div`
//   width: 100vw;
//   height: 100vh;
//   display: flex;
//   flex-direction: column;
//   margin: 0;
//   padding: 0;
// `;

// // 툴바
// const Toolbar = styled.div`
//   display: flex;
//   padding: 0.5rem;
//   background-color: #f7f7f7;
//   border-bottom: 1px solid #ccc;
//   align-items: center;
// `;

// // 툴바 버튼
// const ToolbarButton = styled.button`
//   border: none;
//   background: none;
//   cursor: pointer;
//   margin-right: 1rem;
//   font-size: 1.25rem;

//   &:hover {
//     color: #0070f3;
//   }
// `;

// // 로컬 이미지 업로드 커스텀 버튼 스타일
// const ImageInputLabel = styled.label`
//   cursor: pointer;
//   margin-right: 1rem;
//   font-size: 1.25rem;

//   &:hover {
//     color: #0070f3;
//   }
// `;

// // 실제 input은 숨기고 Label로 트리거
// const ImageInput = styled.input`
//   display: none;
// `;

// // 에디터 영역
// const EditorContainer = styled.div`
//   flex: 1;
//   padding: 1rem;
//   overflow: auto;
//   font-size: 16px;
//   line-height: 1.5;

//   &:focus {
//     outline: none;
//   }
// `;
