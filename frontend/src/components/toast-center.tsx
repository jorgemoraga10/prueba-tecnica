"use client"

import { useEffect } from "react"

import { Toast, ToastViewport } from "@/components/ui"

export type ToastItem = {
  id: number
  message: string
  tone: "error" | "info" | "success"
}

type Props = {
  readonly toasts: ToastItem[]
  readonly onDismiss: (id: number) => void
}

export function ToastCenter({ toasts, onDismiss }: Props): JSX.Element | null {
  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        onDismiss(toast.id)
      }, 3000),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [onDismiss, toasts])

  if (toasts.length === 0) {
    return null
  }

  return (
    <ToastViewport>
      {toasts.map((toast) => (
        <Toast key={toast.id} $tone={toast.tone}>
          {toast.message}
        </Toast>
      ))}
    </ToastViewport>
  )
}
