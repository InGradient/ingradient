// app/layout.js
import "styles/styleguide.css";
import "styles/globals.css";
import "styles/utilities.css";

export const metadata = {
  title: "INGRADIENT",
  description: "The Next Level of Label Tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
      </head>
      <body>
        {/* 전역 Provider나 Theme 설정 등을 여기서 할 수 있습니다. */}
        {children}
      </body>
    </html>
  );
}
