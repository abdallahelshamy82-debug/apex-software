// Custom root HTML for Expo Router Web & Mobile Web
// Configures interactive-widget=resizes-content to automatically resize the viewport when virtual keyboard opens
import React from 'react';
import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();

  return (
    <html lang="ar" dir="rtl" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, shrink-to-fit=no, interactive-widget=resizes-content"
        />

        {/* Disable body scrolling on web to mimic native mobile app feel */}
        <ScrollViewStyleReset />

        {headNodes}

        {/* Global responsive viewport & keyboard adaptation styling */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                height: 100dvh;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                -webkit-tap-highlight-color: transparent;
              }
            `,
          }}
        />
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
