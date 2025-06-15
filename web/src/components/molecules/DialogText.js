import styled from "styled-components";
import React, { useState } from "react";

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props['data-error'] ? 'var(--error)' : '#e5e7eb'};
  border-radius: 8px;
  color: var(--color-black);
  text-align: left;
  font-family: var(--font-family-base);
  font-size: var(--font-size-13px);
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  outline: none;

  &:focus {
    border-color: #2563eb;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props['data-error'] ? 'var(--error)' : '#e5e7eb'};
  border-radius: 6px;
  color: var(--color-black);
  text-align: left;
  font-family: var(--font-family-base);
  font-size: var(--font-size-13px);
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  outline: none;
  resize: vertical;
  min-height: 100px;

  &:focus {
    border-color: #2563eb;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: var(--color-black);
  text-align: left;
  font-family: var(--font-family-base);
  font-size: var(--font-size-16px);
  font-style: normal;
  font-weight: 500;
  line-height: normal;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: var(--neutral-light);
  padding: 12px;
  border-radius: 6px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &.primary {
    background-color: #2563eb;
    color: white;
  }

  &.outlined {
    background-color: transparent;
    border: 1px solid #2563eb;
    color: #2563eb;
  }

  &:hover {
    opacity: 0.9;
  }
`;

const ErrorMessage = styled.div`
  color: var(--error);
  font-size: var(--font-size-13px);
  margin-top: 4px;
`;

export default function DialogText({ label, type = "text", value, onChange, placeholder, required = false, error, errorMessage }) {
  const InputComponent = type === "textarea" ? TextArea : Input;

  return (
    <InputGroup>
      <Label>{label}</Label>
      <InputComponent
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        data-error={error}
      />
      {error && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </InputGroup>
  );
} 