import type { Metadata } from "next"
import { ReactNode } from "react"

import StyledComponentsRegistry from "@/lib/styled-components-registry"

type Props = {
  readonly children: ReactNode
}

export const metadata: Metadata = {
  title: "Payments Reconciliation",
  description: "Frontend del modulo de conciliacion de pagos de arriendo.",
}

export default function RootLayout({ children }: Props): ReactNode {
  return (
    <html lang="es">
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  )
}
