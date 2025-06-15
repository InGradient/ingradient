"use client";

// import { DataProvider } from "@/contexts/DataProvider";
import { Sidebar } from "@/app/(app)/Sidebar";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  useEffect(() => {
    // Skip session check for auth pages
    if (isAuthPage) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
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
          console.log("No session token found, redirecting to login");
          setIsLoading(false);
          router.push("/auth/login");
          return;
        }

        // Verify session with backend
        const sessionUrl = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}:${process.env.NEXT_PUBLIC_SERVER_PORT}/auth/session?session_token=${sessionToken}`;
        console.log("Checking session at:", sessionUrl);

        const response = await fetch(sessionUrl, {
          headers: {
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          console.log("Session verification failed, redirecting to login");
          setIsLoading(false);
          router.push("/auth/login");
          return;
        }

        const data = await response.json();
        console.log("Session verified successfully");
        setIsLoading(false);
      } catch (err) {
        console.error("Session check error:", err);
        setIsLoading(false);
        router.push("/auth/login");
      }
    };

    checkSession();
  }, [router, isAuthPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // For auth pages, just render the children without layout
  if (isAuthPage) {
    return children;
  }

  // For other pages, show the main layout with sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
