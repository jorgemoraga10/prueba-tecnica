"use client"

import styled from "styled-components"

export const SectionGrid = styled.div`
  display: grid;
  gap: 24px;
`

export const TwoColumnGrid = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(12, minmax(0, 1fr));

  > * {
    grid-column: span 12;
  }

  @media (min-width: 1024px) {
    > :first-child {
      grid-column: span 5;
    }

    > :last-child {
      grid-column: span 7;
    }
  }
`

export const Card = styled.section`
  padding: 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(16px);

  @media (max-width: 640px) {
    padding: 18px;
  }
`

export const CardTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 1.35rem;
`

export const CardText = styled.p`
  margin: 0;
  color: var(--text-soft);
  line-height: 1.6;
`

export const Form = styled.form`
  display: grid;
  gap: 14px;
  margin-top: 22px;
`

export const Label = styled.label`
  display: grid;
  gap: 8px;
  font-weight: 700;
`

export const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-strong);
`

export const Select = styled.select`
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-strong);
`

export const Textarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-strong);
  resize: vertical;
`

export const Button = styled.button<{ $variant?: "primary" | "secondary" | "ghost" }>`
  width: fit-content;
  padding: 13px 18px;
  border-radius: 999px;
  border: 1px solid
    ${({ $variant }) => ($variant === "ghost" ? "var(--line)" : "transparent")};
  background: ${({ $variant }) => {
    if ($variant === "secondary") {
      return "var(--surface-muted)"
    }
    if ($variant === "ghost") {
      return "transparent"
    }
    return "var(--accent)"
  }};
  color: ${({ $variant }) => ($variant === "primary" || !$variant ? "#fffaf5" : "var(--text)")};
  font-weight: 800;
`

export const Notice = styled.div<{ $tone?: "error" | "success" | "info" }>`
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid
    ${({ $tone }) => {
      if ($tone === "error") return "rgba(161, 61, 53, 0.24)"
      if ($tone === "success") return "rgba(41, 98, 78, 0.24)"
      return "var(--line)"
    }};
  background: ${({ $tone }) => {
    if ($tone === "error") return "rgba(161, 61, 53, 0.08)"
    if ($tone === "success") return "rgba(41, 98, 78, 0.08)"
    return "rgba(255,255,255,0.56)"
  }};
  color: ${({ $tone }) => {
    if ($tone === "error") return "var(--danger)"
    if ($tone === "success") return "var(--success)"
    return "var(--text-soft)"
  }};
  line-height: 1.5;
`

export const TableWrap = styled.div`
  overflow: auto;
  margin-top: 20px;
  border-radius: var(--radius-lg);
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;

  th,
  td {
    padding: 14px 12px;
    text-align: left;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
  }

  th {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-soft);
    position: sticky;
    top: 0;
    background: var(--surface);
    z-index: 1;
  }
`

export const Badge = styled.span<{ $tone?: "success" | "warning" | "neutral" }>`
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  background: ${({ $tone }) => {
    if ($tone === "success") return "rgba(41, 98, 78, 0.12)"
    if ($tone === "warning") return "rgba(143, 93, 16, 0.12)"
    return "rgba(101, 88, 74, 0.12)"
  }};
  color: ${({ $tone }) => {
    if ($tone === "success") return "var(--success)"
    if ($tone === "warning") return "var(--warning)"
    return "var(--text-soft)"
  }};
`

export const EmptyState = styled.div`
  padding: 22px;
  border: 1px dashed rgba(71, 55, 36, 0.22);
  border-radius: var(--radius-lg);
  color: var(--text-soft);
  background: rgba(255, 255, 255, 0.45);
`

export const MetricGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-top: 20px;
`

export const MetricCard = styled.div`
  padding: 18px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid var(--line);
`

export const MetricLabel = styled.span`
  display: block;
  margin-bottom: 8px;
  color: var(--text-soft);
  font-size: 0.85rem;
`

export const MetricValue = styled.strong`
  font-size: 1.35rem;
`

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 15, 12, 0.42);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 50;
`

export const Modal = styled.div`
  width: min(720px, 100%);
  max-height: 90vh;
  overflow: auto;
  padding: 26px;
  border-radius: 28px;
  background: var(--surface-strong);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lg);

  @media (max-width: 640px) {
    width: 100%;
    max-height: 92vh;
    padding: 20px;
    border-radius: 22px;
  }
`

export const ActionsRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  align-items: center;
`

export const ToastViewport = styled.div`
  position: fixed;
  right: 22px;
  bottom: 22px;
  display: grid;
  gap: 10px;
  z-index: 60;
`

export const Toast = styled.div<{ $tone?: "error" | "success" | "info" }>`
  min-width: 340px;
  max-width: 420px;
  padding: 18px 20px;
  border-radius: 22px;
  color: #fffaf5;
  box-shadow: var(--shadow-lg);
  font-size: 1rem;
  line-height: 1.55;
  background: ${({ $tone }) => {
    if ($tone === "error") return "linear-gradient(135deg, #8f312a, #bc544b)"
    if ($tone === "success") return "linear-gradient(135deg, #245645, #3a7b63)"
    return "linear-gradient(135deg, #3c3127, #6b5441)"
  }};
`

export const IconButton = styled.button<{ $tone?: "danger" | "neutral" }>`
  width: 38px;
  height: 38px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) => ($tone === "danger" ? "rgba(161, 61, 53, 0.2)" : "var(--line)")};
  background: ${({ $tone }) =>
    $tone === "danger" ? "rgba(161, 61, 53, 0.08)" : "rgba(255,255,255,0.68)"};
  color: ${({ $tone }) => ($tone === "danger" ? "var(--danger)" : "var(--text)")};
`
