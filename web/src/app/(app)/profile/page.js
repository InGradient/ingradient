"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";

const PageContainer = styled.div`
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
`;

const UserInfo = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const Label = styled.span`
  font-weight: 500;
  color: var(--text-primary);
`;

const LogoutButton = styled.button`
  background-color: var(--accent);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--accent-dark);
  }
`;

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
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

        // Fetch user info from backend (proxy to Kratos)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}:${process.env.NEXT_PUBLIC_SERVER_PORT}/auth/session?session_token=${sessionToken}`,
          {
            headers: {
              "Accept": "application/json",
            },
          }
        );

        if (!response.ok) {
          router.push("/auth/login");
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    // Clear tokens from storage
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    // Redirect to login page
    router.push("/auth/login");
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

  const email = user?.identity?.traits?.email || "Unknown";

  return (
    <PageContainer>
      <Title>Profile</Title>
      <UserInfo>
        <p>
          <Label>Email:</Label> {email}
        </p>
      </UserInfo>
      <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
    </PageContainer>
  );
} 