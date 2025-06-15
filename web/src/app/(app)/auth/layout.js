export default function AuthLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--neutral-light)" }}>
      {children}
    </div>
  );
} 