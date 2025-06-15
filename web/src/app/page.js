"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
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

        // Verify session with backend
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

        // If authenticated, redirect to project page
        router.push("/project");
      } catch (error) {
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return null;
}