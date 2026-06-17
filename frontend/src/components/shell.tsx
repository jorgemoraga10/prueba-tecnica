"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import styled from "styled-components"

type ShellProps = {
  readonly children: ReactNode
  readonly eyebrow: string
  readonly title: string
  readonly description: string
}

const NAV_ITEMS = [
  { href: "/tasks", label: "Inicio" },
  { href: "/tasks/collections", label: "Cobros" },
  { href: "/tasks/bank-movements", label: "Movimientos" },
  { href: "/tasks/history", label: "Historico" },
]

const Frame = styled.div`
  min-height: 100vh;
  padding: 28px 20px 56px;
`

const Topbar = styled.header`
  width: min(var(--content-width), 100%);
  margin: 0 auto 24px;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  background: rgba(255, 250, 244, 0.72);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(18px);
`

const BrandRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`

const Brand = styled(Link)`
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
`

const BrandKicker = styled.span`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-soft);
`

const BrandTitle = styled.span`
  font-size: 1.15rem;
  font-weight: 800;
`

const Nav = styled.nav`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`

const NavLink = styled(Link)<{ $active: boolean }>`
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? "transparent" : "var(--line)")};
  background: ${({ $active }) => ($active ? "var(--accent)" : "rgba(255,255,255,0.65)")};
  color: ${({ $active }) => ($active ? "#fffaf5" : "var(--text)")};
  font-weight: 700;
  box-shadow: ${({ $active }) => ($active ? "var(--shadow-md)" : "none")};
`

const Hero = styled.section`
  width: min(var(--content-width), 100%);
  margin: 0 auto 24px;
  padding: 28px;
  border-radius: var(--radius-xl);
  background:
    linear-gradient(135deg, rgba(184, 92, 56, 0.16), rgba(255, 255, 255, 0.58)),
    var(--surface);
  border: 1px solid rgba(184, 92, 56, 0.18);
  box-shadow: var(--shadow-lg);
`

const Eyebrow = styled.span`
  display: inline-block;
  margin-bottom: 12px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--accent-strong);
`

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 3.2vw, 3.6rem);
  line-height: 0.96;
`

const Description = styled.p`
  max-width: 760px;
  margin: 14px 0 0;
  font-size: 1.02rem;
  line-height: 1.65;
  color: var(--text-soft);
`

const Content = styled.main`
  width: min(var(--content-width), 100%);
  margin: 0 auto;
`

export function AppShell({ children, eyebrow, title, description }: ShellProps): JSX.Element {
  const pathname = usePathname()

  return (
    <Frame>
      <Topbar>
        <BrandRow>
          <Brand href="/">
            <BrandKicker>Prueba tecnica</BrandKicker>
            <BrandTitle>Payments Reconciliation</BrandTitle>
          </Brand>
          <Nav>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} $active={pathname === item.href}>
                {item.label}
              </NavLink>
            ))}
          </Nav>
        </BrandRow>
      </Topbar>

      <Hero>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </Hero>

      <Content>{children}</Content>
    </Frame>
  )
}
