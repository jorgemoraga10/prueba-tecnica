"use client"

import { createGlobalStyle } from "styled-components"

export const GlobalStyles = createGlobalStyle`
  :root {
    --bg: #f3efe7;
    --bg-strong: #e3d6c4;
    --surface: rgba(255, 252, 247, 0.88);
    --surface-strong: #fffdf9;
    --surface-muted: #f6efe4;
    --line: rgba(71, 55, 36, 0.12);
    --text: #1f1a14;
    --text-soft: #65584a;
    --accent: #b85c38;
    --accent-strong: #8a3f25;
    --accent-soft: #f3d6c8;
    --success: #29624e;
    --warning: #8f5d10;
    --danger: #a13d35;
    --shadow-lg: 0 30px 60px rgba(52, 36, 23, 0.14);
    --shadow-md: 0 16px 32px rgba(52, 36, 23, 0.1);
    --radius-xl: 28px;
    --radius-lg: 20px;
    --radius-md: 14px;
    --radius-sm: 10px;
    --content-width: 1180px;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    min-height: 100%;
    font-family: "Segoe UI", "Trebuchet MS", sans-serif;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.8), transparent 30%),
      linear-gradient(135deg, #f9f4eb 0%, #f1e6d6 35%, #ead9c2 100%);
    color: var(--text);
  }

  body {
    min-height: 100vh;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  img {
    max-width: 100%;
    display: block;
  }
`
