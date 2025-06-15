import styled from "styled-components";
import React from "react";

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: var(--neutral-light);
  padding: 12px;
  border-radius: 6px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: var(--text-primary);
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--neutral-muted);
  border-radius: 4px;
  font-size: var(--font-size-13px);
  height: 40px;
  
  &:focus {
    outline: none;
    border-color: var(--accent-active);
    box-shadow: 0 0 0 2px var(--accent-light);
  }

  &:hover:not(:disabled):not(:focus) {
    border-color: var(--neutral);
  }
`;

const ErrorMessage = styled.p`
  color: var(--error);
  font-size: var(--font-size-13px);
  margin-top: 4px;
`;

export default function DialogInput({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false,
  error = ""
}) {
  return (
    <InputGroup>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputGroup>
  );
} 