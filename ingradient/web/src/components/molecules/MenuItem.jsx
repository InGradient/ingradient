import styled from 'styled-components';

export const MenuItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "justifyContent",
})`
  display: flex;
  justify-content: ${props => props.justifyContent || "flex-start"};
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  cursor: ${props => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${props => (props.disabled ? 0.5 : 1)};
  pointer-events: ${props => (props.disabled ? "none" : "auto")};
  background: ${props =>
    props.selected ? "var(--selected-background, #e6f0ff)" : "transparent"};

  &:hover {
    background: ${props =>
      props.disabled ? "transparent" : "var(--neutral-100)"};
  }
`;

export default MenuItem;
