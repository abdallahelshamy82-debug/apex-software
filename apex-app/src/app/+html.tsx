// Custom root HTML for Expo Router Web & Mobile Web
// Configures interactive-widget=resizes-content to automatically resize the viewport when virtual keyboard opens
import React from 'react';
import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();

  return (
    <html lang="ar" dir="ltr" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, shrink-to-fit=no, interactive-widget=resizes-content"
        />

        <title>Magixa | لوحة التحكم المركزية</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Disable body scrolling on web to mimic native mobile app feel */}
        <ScrollViewStyleReset />

        {headNodes}

        {/* Global responsive viewport, keyboard adaptation & unified right scrollbar */}
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
                direction: ltr !important;
              }

              /* Custom sleek dark scrollbar placed strictly on the right */
              ::-webkit-scrollbar {
                width: 7px;
                height: 7px;
              }
              ::-webkit-scrollbar-track {
                background: #09090b;
              }
              ::-webkit-scrollbar-thumb {
                background: #27272a;
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: #b4f82c;
              }

              /* Firefox support */
              * {
                scrollbar-width: thin;
                scrollbar-color: #27272a #09090b;
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
