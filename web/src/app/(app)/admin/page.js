"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faKey } from "@fortawesome/free-solid-svg-icons";
import { Dialog, ModalOverlay, DialogTitle, DialogContent, DialogActions } from "@/components/molecules/Dialog";
import DialogInput from "@/components/molecules/DialogInput";

const PageContainer = styled.div`
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text-primary);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  padding: 1rem;
  text-align: left;
  background: var(--neutral-light);
  color: var(--text-primary);
  font-weight: 500;
  border-bottom: 1px solid var(--neutral);
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid var(--neutral);
  color: var(--text-primary);
`;

const Tr = styled.tr`
  &:hover {
    background: var(--neutral-light);
  }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${props => props.$active ? 'var(--success-light)' : 'var(--error-light)'};
  color: ${props => props.$active ? 'var(--success)' : 'var(--error)'};
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
  height: 32px;
  width: 32px;

  &:hover {
    background: var(--neutral-100);
  }

  &:disabled {
    color: var(--neutral-300);
    cursor: not-allowed;
    background: transparent;
  }
`;

const DeleteButton = styled(ActionButton)`
  color: var(--error);

  &:hover {
    background: var(--error-light);
  }
`;

const ResetButton = styled(ActionButton)`
  color: var(--accent);

  &:hover {
    background: var(--accent-light);
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  height: 40px;
  font-size: var(--font-size-13px);
  
  &.primary {
    background: var(--accent);
    color: var(--color-white);
    
    &:hover {
      background: var(--accent-hover);
    }
  }
  
  &.secondary {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--neutral-muted);
    
    &:hover {
      background: var(--neutral-100);
      border-color: var(--neutral);
    }
  }
`;

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Try to get session token from storage
        const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
        let sessionToken = storedToken;
        if (!sessionToken) {
          const cookies = document.cookie.split(";");
          const kratosSession = cookies.find((cookie) =>
            cookie.trim().startsWith("ory_session=")
          );
          sessionToken = kratosSession ? kratosSession.split("=")[1] : null;
        }

        if (!sessionToken) {
          router.push("/auth/login");
          return;
        }

        // Fetch users from backend
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}:${process.env.NEXT_PUBLIC_SERVER_PORT}/admin/users`,
          {
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${sessionToken}`,
            },
          }
        );

        if (!response.ok) {
          router.push("/auth/login");
          return;
        }

        const data = await response.json();
        setUsers(data);

        // Get current user ID from the response
        const currentUserResponse = await fetch('http://localhost:8000/users/me', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (currentUserResponse.ok) {
          const currentUser = await currentUserResponse.json();
          setCurrentUserId(currentUser.id);
        }
      } catch (err) {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // If the deleted user is the current user, log out
      if (userId === currentUserId) {
        // Clear all auth tokens
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        document.cookie = 'ory_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Redirect to login page
        router.push('/auth/login');
        return;
      }

      // Update the users list
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters long");
      return;
    }

    try {
      const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) {
        throw new Error('Failed to reset password');
      }

      // Close dialog and reset form
      setShowResetDialog(false);
      setSelectedUser(null);
      setNewPassword("");
      setConfirmPassword("");
      setResetError("");
    } catch (err) {
      setResetError(err.message);
    }
  };

  const openResetDialog = (user) => {
    setSelectedUser(user);
    setShowResetDialog(true);
    setResetError("");
  };

  const closeResetDialog = () => {
    setShowResetDialog(false);
    setSelectedUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
  };

  if (loading) {
    return (
      <PageContainer>
        <Title>Loading...</Title>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Title>Error: {error}</Title>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Title>User Management</Title>
      <Table>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Email</Th>
            <Th>Created At</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>{user.id}</Td>
              <Td>{user.email}</Td>
              <Td>{new Date(user.created_at).toLocaleString()}</Td>
              <Td>
                <StatusBadge $active={user.is_active}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </StatusBadge>
              </Td>
              <Td>
                <ResetButton
                  onClick={() => openResetDialog(user)}
                  title="Reset password"
                >
                  <FontAwesomeIcon icon={faKey} />
                </ResetButton>
                <DeleteButton
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={user.id === currentUserId}
                  title={user.id === currentUserId ? "Cannot delete your own account" : "Delete user"}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </DeleteButton>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      {showResetDialog && (
        <>
          <ModalOverlay onClick={closeResetDialog} />
          <Dialog>
            <DialogTitle>
              <h3>Reset Password</h3>
            </DialogTitle>
            <DialogContent>
              <p>Reset password for user: {selectedUser?.email}</p>
              <DialogInput
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                error={resetError}
              />
              <DialogInput
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </DialogContent>
            <DialogActions>
              <Button className="secondary" onClick={closeResetDialog}>
                Cancel
              </Button>
              <Button className="primary" onClick={handleResetPassword}>
                Reset Password
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </PageContainer>
  );
} 