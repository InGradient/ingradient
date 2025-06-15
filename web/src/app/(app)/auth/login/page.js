"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { login as loginApi } from "@/lib/api";

const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--neutral-light);
`;

const LoginCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--neutral-dark);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid var(--neutral);
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

const Button = styled.button`
  background-color: var(--accent);
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--accent-dark);
  }
`;

const SignupLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 1rem;
  color: var(--accent);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: var(--neutral-dark);
  cursor: pointer;
`;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg("");
      const data = await loginApi(email, password, rememberMe);
      // 성공: 토큰 존재 여부 체크
      if (data?.session_token || data?.token) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", data.session_token || data.token);
        storage.setItem("user_email", email);
        router.push("/project");
      } else {
        setErrorMsg("Unexpected response from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      const msg =
        error.response?.data?.detail?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Login failed";
      setErrorMsg(msg);
    }
  };

  return (
    <PageContainer>
      <LoginCard>
        <Title>Login</Title>
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <RememberMeContainer>
            <Checkbox
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <CheckboxLabel htmlFor="rememberMe">Remember me</CheckboxLabel>
          </RememberMeContainer>
          <Button type="submit">Login</Button>
          {errorMsg && (
            <p style={{ color: "red", marginTop: "0.5rem", fontSize: "0.875rem" }}>
              {errorMsg}
            </p>
          )}
        </Form>
        <SignupLink href="/auth/register">
          Don't have an account? Sign up
        </SignupLink>
      </LoginCard>
    </PageContainer>
  );
} 