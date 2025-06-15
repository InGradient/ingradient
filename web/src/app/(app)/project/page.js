"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import DialogText from "@/components/molecules/DialogText";
import { Dialog, DialogTitle, DialogContent, DialogActions, ModalOverlay } from "@/components/molecules/Dialog";
import { listProjects, createProject as apiCreateProject, updateProject as apiUpdateProject, deleteProject as apiDeleteProject } from "@/lib/api";
import { useRouter } from "next/navigation";
import { EmptyMessage } from "@/components/organisms/EmptyMessage";
import Checkbox from "@/components/atoms/Checkbox";

/* -------------------------------------------------------------------------- */
/*                               Styled Blocks                                */
/* -------------------------------------------------------------------------- */

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 16px;
  background-color: white;
  border-bottom: 1px solid var(--neutral-200);
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &.primary {
    background-color: var(--accent);
    color: white;
  }

  &.outlined {
    background-color: transparent;
    border: 1px solid var(--neutral-400);
    color: var(--neutral-400);
  }

  &.outlined.delete {
    border-color: ${props => props.$hasSelection ? 'var(--error)' : 'var(--neutral-400)'};
    color: ${props => props.$hasSelection ? 'var(--error)' : 'var(--neutral-400)'};
  }

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const List = styled.ul`
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 12px 16px;
  background-color: #F4F4F4;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: calc(100vh - 80px); /* Header height + padding */
`;

const Row = styled.li`
  display: grid;
  grid-template-columns: 150px 1px 1fr 170px auto;
  align-items: center;
  padding: 20px;
  min-height: 40px;
  border-radius: 12px;
  background-color: ${props => props.$isSelected ? 'var(--accent-light)' : 'white'};
  transition: background-color 0.2s ease;
  cursor: pointer;
  column-gap: 24px;
  width: 100%;
  min-width: 0;
  overflow: hidden;

  &:hover {
    background-color: ${props => props.$isSelected ? 'var(--accent-light)' : 'var(--neutral-light)'};
  }
`;

const NameGroup = styled.div`
  display: flex;
  align-items: center;
  width: 360px;
  min-width: 360px;
  max-width: 360px;
  gap: 16px;
`;

const NameCell = styled.span`
  display: flex;
  align-items: center;
  width: 320px;
  min-width: 320px;
  max-width: 320px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  height: 100%;
`;

const DescriptionCell = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  height: 100%;
`;

const Cell = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  height: 100%;
`;

const IconGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  z-index: 1;

  &:hover {
    color: #e5e7eb;
  }
`;

const DateCell = styled.span`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 170px;
  min-width: 170px;
  max-width: 170px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  height: 100%;
  color: var(--neutral-500);
`;

const Divider = styled.div`
  width: 1px;
  height: 25px;
  background: var(--neutral-400);
  align-self: center;
  margin: 0;
  flex-shrink: 0;
`;

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function ProjectPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await listProjects();
        setProjects(res);
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
    setNameError("");
    setNewProject({ name: "", description: "" });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      setNameError("Project name field cannot be empty");
      return;
    }
    const isDuplicate = projects.some(p => p.name.toLowerCase() === newProject.name.toLowerCase());
    if (isDuplicate) {
      setNameError("Project name already exists. Please enter a different name.");
      return;
    }
    try {
      const proj = await apiCreateProject(newProject);
      setProjects((prev) => [...prev, proj]);
      setNewProject({ name: "", description: "" });
      setNameError("");
      setIsCreateDialogOpen(false);
    } catch (err) {
      alert("Failed to create project");
    }
  };

  const handleEditProject = (id) => {
    const project = projects.find(p => p.id === id);
    setEditingProject(project);
    setIsEditDialogOpen(true);
    setNameError("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProject.name.trim()) {
      setNameError("Project name is required");
      return;
    }
    const isDuplicate = projects.some(p => p.id !== editingProject.id && p.name.toLowerCase() === editingProject.name.toLowerCase());
    if (isDuplicate) {
      setNameError("Project name already exists");
      return;
    }
    try {
      const updated = await apiUpdateProject(editingProject.id, {
        name: editingProject.name,
        description: editingProject.description,
      });
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProject(null);
      setNameError("");
      setIsEditDialogOpen(false);
    } catch (err) {
      alert("Failed to update project");
    }
  };

  const handleHeaderDelete = () => {
    if (selectedProjects.size === 0) {
      alert("Please select at least one project to delete");
      return;
    }
    setDeletingProjectId(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProject = (id) => {
    setDeletingProjectId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingProjectId) {
      try {
        await apiDeleteProject(deletingProjectId);
        setProjects((prev) => prev.filter((p) => p.id !== deletingProjectId));
        setSelectedProjects((prev) => {
          const newSet = new Set(prev);
          newSet.delete(deletingProjectId);
          return newSet;
        });
      } catch (err) {
        alert("Failed to delete project");
      }
    } else {
      const idsToDelete = Array.from(selectedProjects);
      for (const id of idsToDelete) {
        try {
          await apiDeleteProject(id);
        } catch (err) {
          console.error("Failed to delete project", id, err);
        }
      }
      setProjects((prev) => prev.filter((p) => !selectedProjects.has(p.id)));
      setSelectedProjects(new Set());
    }
    setDeletingProjectId(null);
    setIsDeleteDialogOpen(false);
  };

  const handleSelectProject = (id, isCheckboxClick = false) => {
    if (isCheckboxClick) {
      setSelectedProjects((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    } else {
      setSelectedProjects(new Set([id]));
    }
  };

  const handleCheckboxClick = (e, id) => {
    e.stopPropagation();
    const newSet = new Set(selectedProjects);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProjects(newSet);
  };

  const formatDate = (iso) => {
    const date = new Date(iso);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(' at ', ', ');
  };

  const handleListClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedProjects(new Set());
    }
  };

  const handleRowDoubleClick = (id) => {
    router.push(`/catalog?projectId=${id}`);
  };

  return (
    <PageContainer>
      <Header>
        <Title>Project</Title>
        <ButtonGroup>
          <Button 
            className="outlined delete" 
            onClick={handleHeaderDelete}
            $hasSelection={selectedProjects.size > 0}
            disabled={selectedProjects.size === 0}
          >
            Delete
          </Button>
          <Button className="primary" onClick={handleCreate}>
            Create Project
          </Button>
        </ButtonGroup>
      </Header>

      {isLoading ? (
        <div style={{ padding: 24 }}>Loading...</div>
      ) : projects.length === 0 ? (
        <EmptyMessage onCreate={handleCreate}>Project</EmptyMessage>
      ) : (
        <List onClick={handleListClick}>
          {projects.map((project) => (
            <Row 
              key={project.id} 
              $isSelected={selectedProjects.has(project.id)}
              onClick={() => handleSelectProject(project.id)}
              onDoubleClick={() => handleRowDoubleClick(project.id)}
            >
              <NameGroup>
                <Cell>
                  <input
                    type="checkbox"
                    checked={selectedProjects.has(project.id)}
                    onChange={(e) => handleCheckboxClick(e, project.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '18px', height: '18px' }}
                  />
                </Cell>
                <NameCell>{project.name}</NameCell>
              </NameGroup>
              <Divider />
              <DescriptionCell>{project.description}</DescriptionCell>
              <DateCell>{formatDate(project.updatedAt)}</DateCell>
              <IconGroup>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProject(project.id);
                  }}
                >
                  <FontAwesomeIcon icon={faPencilAlt} style={{ fontSize: '18px' }} />
                </IconButton>
                <Divider />
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  style={{ color: 'var(--error)' }}
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: '18px' }} />
                </IconButton>
              </IconGroup>
            </Row>
          ))}
        </List>
      )}

      {isCreateDialogOpen && (
        <>
          <ModalOverlay onClick={() => setIsCreateDialogOpen(false)} />
          <Dialog>
            <DialogTitle>
              <h2 style={{ margin: 0 }}>Create New Project</h2>
            </DialogTitle>
            <DialogContent>
              <form id="create-project-form" onSubmit={handleCreateSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <DialogText
                  label="Project Name"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  error={!!nameError}
                  errorMessage={nameError}
                />
                <DialogText
                  label="Project Description"
                  type="textarea"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description"
                />
              </form>
            </DialogContent>
            <DialogActions>
              <Button type="button" className="outlined" onClick={() => { setIsCreateDialogOpen(false); setNameError(""); setNewProject({ name: "", description: "" }); }}>
                Cancel
              </Button>
              <Button type="submit" className="primary" form="create-project-form">
                Create
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {isEditDialogOpen && editingProject && (
        <>
          <ModalOverlay onClick={() => setIsEditDialogOpen(false)} />
          <Dialog>
            <DialogTitle>
              <h2 style={{ margin: 0 }}>Edit Project</h2>
            </DialogTitle>
            <DialogContent>
              <form id="edit-project-form" onSubmit={handleEditSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <DialogText
                  label="Project Name"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  error={!!nameError}
                  errorMessage={nameError}
                />
                <DialogText
                  label="Project Description"
                  type="textarea"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description"
                />
              </form>
            </DialogContent>
            <DialogActions>
              <Button type="button" className="outlined" onClick={() => { setIsEditDialogOpen(false); setNameError(""); setEditingProject(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="primary" form="edit-project-form">
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {isDeleteDialogOpen && (
        <>
          <ModalOverlay onClick={() => { setIsDeleteDialogOpen(false); setDeletingProjectId(null); }} />
          <Dialog>
            <DialogTitle>
              <h2 style={{ margin: 0 }}>Delete</h2>
            </DialogTitle>
            <DialogContent>
              <p style={{ margin: 0, color: '#374151' }}>
                {deletingProjectId
                  ? 'Are you sure you want to delete this project? This action cannot be undone.'
                  : `Are you sure you want to delete ${selectedProjects.size} project(s)? This action cannot be undone.`}
              </p>
            </DialogContent>
            <DialogActions>
              <Button type="button" className="outlined" onClick={() => { setIsDeleteDialogOpen(false); setDeletingProjectId(null); }}>
                Cancel
              </Button>
              <Button 
                type="button" 
                className="delete" 
                onClick={handleDeleteConfirm}
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </PageContainer>
  );
}