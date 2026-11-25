export const metadata = { title: "mosaic RSC client-boundary fixture" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
