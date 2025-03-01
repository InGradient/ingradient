import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "Catalog",
};

export default function RootLayout({ children }) {
  return <ClientLayout>{children}</ClientLayout>;
}