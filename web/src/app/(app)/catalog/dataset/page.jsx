"use client";

import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faEllipsisVertical,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Sidebar as SidebarIcon } from "@/components/atoms/Icon";
import Checkbox from "@/components/atoms/Checkbox";
import { EmptyMessage } from "@/components/organisms/EmptyMessage";
import {
  Dialog,
  ModalOverlay,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@/components/molecules/Dialog";
import { handleKeyDown } from "@/utils/keyboardActions";

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  overflow: auto;
  border-right: 1px solid #ccc;
`;

const SidebarTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 16px;
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
    margin-left: -4px; /* Adjust as needed to set the spacing exactly to zero */
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
`;

const SelectAllContainer = styled.div`
  display: flex;
  align-items: center;
`;

const DatasetItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  position: relative;
  border-bottom: 1px solid #e0e0e0;
  background-color: ${({ className }) =>
    className?.includes("selected") ? "var(--background-overlay)" : "transparent"};
  cursor: pointer;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const SelectDataset = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const EllipsisButton = styled.div`
  width: 28px;
  height: 29px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  position: relative;
  background-color: ${({ $isActive }) =>
    $isActive ? "var(--lightbasebase-04)" : "transparent"};
  
  &:hover {
    background-color: var(--neutral-light);
    border-radius: 4px;
  }
`;


const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  background: #fff;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  width: 120px;
  margin-top: 2px;
`;

const MenuItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  &:hover {
    background-color: #f1f1f1;
  }
`;

export default function DatasetSection({
  datasets,
  createDataset,
  removeDataset,
  saveDataset,
  setIsSidebarVisible,
  selectedDatasetIds,
  setSelectedDatasetIds,
}) {
  const [menuVisible, setMenuVisible] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [renameDialog, setRenameDialog] = useState({
    show: false,
    id: null,
    currentName: "",
  });
  const [addDialog, setAddDialog] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState("");
  const menuRef = useRef();

  useEffect(() => {
    const datasetArray = Object.values(datasets);
    if (datasetArray.length > 0 && (!selectedDatasetIds || selectedDatasetIds.length === 0)) {
      setSelectedDatasetIds([datasetArray[0].id]);
    }
  }, [datasets, selectedDatasetIds]);  
  
  const toggleDatasetSelection = (id) => {
    if (selectedDatasetIds.includes(id)) {
      setSelectedDatasetIds((prev) => prev.filter((datasetId) => datasetId !== id));
    } else {
      setSelectedDatasetIds((prev) => [...prev, id]);
    }
  };

  const toggleMenu = (id) => {
    setMenuVisible((prev) => (prev === id ? null : id));
  };

  const handleDelete = () => {
    if (deleteConfirm.id) {
      removeDataset(deleteConfirm.id);
      setSelectedDatasetIds((prev) =>
        prev.filter((datasetId) => datasetId !== deleteConfirm.id)
      );
    }
    setDeleteConfirm({ show: false, id: null });
  };

  const handleRename = () => {
    if (renameDialog.id && newDatasetName.trim()) {
      // 기존 데이터셋 가져오기
      const existingDataset = datasets[renameDialog.id];
  
      if (existingDataset) {
        // 이름을 업데이트한 새 데이터셋 객체 생성
        const updatedDataset = {
          ...existingDataset,
          name: newDatasetName.trim(),
          updatedAt: new Date().toISOString(), // 마지막 업데이트 시간 갱신
        };
  
        // saveDataset 호출로 저장
        saveDataset(updatedDataset);
      }
    }
  
    // 다이얼로그 닫기 및 상태 초기화
    setRenameDialog({ show: false, id: null, currentName: "" });
    setNewDatasetName("");
  };  

  const handleCreateDataset = async () => {
    if (newDatasetName.trim()) {
      // const newDataset = {
      //   id: Date.now().toString(),
      //   name: newDatasetName.trim(),
      //   description: "New dataset description",
      //   classes: [],
      //   images: [],
      //   uploadedAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      // };
      // const newId = createDataset(newDataset, 'user1');
      const newId = await createDataset(newDatasetName.trim(), 'user1');
      if (newId) {
        setSelectedDatasetIds([newId]);
      }
      setAddDialog(false);
      setNewDatasetName("");
    }
  };

  const handleOutsideClick = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMenuVisible(null);
    }
  };

  const selectAll = () => {
    if (Object.values(datasets).every((dataset) => selectedDatasetIds.includes(dataset.id))) {
      setSelectedDatasetIds([]);
    } else {
      setSelectedDatasetIds(Object.values(datasets).map((dataset) => dataset.id));
    }
  };  

  useEffect(() => {
    const keyDownListener = (e) => {
      handleKeyDown(e, {
        callbacks: {
          Enter: addDialog ? handleCreateDataset : renameDialog.show ? handleRename : deleteConfirm.show ? handleDelete : null,
          Escape: () => {
            if (addDialog) setAddDialog(false);
            else if (renameDialog.show) setRenameDialog({ show: false, id: null, currentName: "" });
            else if (deleteConfirm.show) setDeleteConfirm({ show: false, id: null });
          },
        },
      });
    };
  
    // Keydown 이벤트 리스너 등록
    document.addEventListener("keydown", keyDownListener);
    return () => {
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      document.removeEventListener("keydown", keyDownListener);
    };
  }, [addDialog, renameDialog, deleteConfirm, newDatasetName]);
  
  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <Sidebar>
      <SidebarTitle>
        <h1>Dataset</h1>
        <SidebarIcon onClick={() => setIsSidebarVisible((prev) => !prev)} />
      </SidebarTitle>
      <SidebarHeader>
        <SelectAllContainer>
          <Checkbox
            isChecked={Object.values(datasets).every((dataset) =>
              selectedDatasetIds.includes(dataset.id)
            )}
            onChange={selectAll}
          />
          Select All
        </SelectAllContainer>
        <button onClick={() => setAddDialog(true)}>
          <FontAwesomeIcon icon={faPlus} style={{ marginRight: "4px" }} /> New Dataset
        </button>
      </SidebarHeader>
      {Object.values(datasets).length === 0 ? (
        <EmptyMessage>Dataset</EmptyMessage>
      ) : (
        Object.values(datasets).map((dataset) => (
          <DatasetItem
            key={dataset.id}
            className={selectedDatasetIds.includes(dataset.id) ? "selected" : ""}
            onClick={(e) => {
              if (!e.target.closest(".checkbox-container") && !e.target.closest(".ellipsis-button")) {
                setSelectedDatasetIds([dataset.id]);
              }
            }}
          >
            <SelectDataset>
              <CheckboxContainer
                className="checkbox-container"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDatasetSelection(dataset.id);
                }}
              >
                <Checkbox
                  isChecked={selectedDatasetIds.includes(dataset.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </CheckboxContainer>
              {dataset.name}
            </SelectDataset>
            <EllipsisButton
              className="ellipsis-button"
              $isActive={menuVisible === dataset.id}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu(dataset.id);
              }}
            >
              <FontAwesomeIcon icon={faEllipsisVertical} />
              {menuVisible === dataset.id && (
                <DropdownMenu ref={menuRef}>
                  <MenuItem
                    onClick={() =>
                      setDeleteConfirm({ show: true, id: dataset.id })
                    }
                  >
                    <p>Delete</p>
                  </MenuItem>
                  <MenuItem
                    onClick={() =>
                      setRenameDialog({
                        show: true,
                        id: dataset.id,
                        currentName: dataset.name,
                      })
                    }
                  >
                    <p>Rename</p>
                  </MenuItem>
                </DropdownMenu>
              )}
            </EllipsisButton>
          </DatasetItem>
        ))
      )}
      {deleteConfirm.show && (
        <>
          <ModalOverlay onClick={() => setDeleteConfirm({ show: false, id: null })} />
          <Dialog>
            <DialogTitle>
              <h3>Confirm Delete</h3>
            </DialogTitle>
            <DialogContent>
              Are you sure you want to delete this dataset? This action cannot be undone.
            </DialogContent>
            <DialogActions>
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="outlined"
                style={{
                  color: 'var(--color-warning)',
                  borderColor: 'var(--color-warning)',
                  backgroundColor: 'transparent',
                }}
              >
                Cancel
              </button>
              <button onClick={handleDelete}>Delete</button>
            </DialogActions>
          </Dialog>
        </>
      )}
      {renameDialog.show && (
        <>
          <ModalOverlay
            onClick={() =>
              setRenameDialog({ show: false, id: null, currentName: "" })
            }
          />
          <Dialog>
            <DialogTitle>
              <h3>Rename Dataset</h3>
            </DialogTitle>
            <DialogContent>
              <input
                type="text"
                value={newDatasetName || renameDialog.currentName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                placeholder="Enter new name"
              />
            </DialogContent>
            <DialogActions>
              <button
                onClick={() =>
                  setRenameDialog({ show: false, id: null, currentName: "" })
                }
                className="outlined"
                style={{
                  color: 'var(--color-warning)',
                  borderColor: 'var(--color-warning)',
                  backgroundColor: 'transparent',
                }}
              >
                Cancel
              </button>
              <button onClick={handleRename}>Save</button>
            </DialogActions>
          </Dialog>
        </>
      )}
      {addDialog && (
        <>
          <ModalOverlay onClick={() => setAddDialog(false)} />
          <Dialog>
            <DialogTitle>
              <h3>Add New Dataset</h3>
            </DialogTitle>
            <DialogContent>
              <input
                type="text"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                placeholder="Enter dataset name"
              />
            </DialogContent>
            <DialogActions>
              <button 
                onClick={() => setAddDialog(false)}
                className="outlined"
                style={{
                  color: 'var(--color-warning)',
                  borderColor: 'var(--color-warning)',
                  backgroundColor: 'transparent',
                }}
              >
                Cancel
              </button>
              <button onClick={handleCreateDataset}>Add</button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Sidebar>
  );
}
