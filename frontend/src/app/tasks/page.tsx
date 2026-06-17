"use client"

import Link from "next/link"
import styled from "styled-components"

import { AppShell } from "@/components/shell"
import { Card, CardText, CardTitle, MetricCard, MetricGrid, MetricLabel, MetricValue } from "@/components/ui"

const ModuleGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
`

const ModuleLink = styled(Link)`
  display: inline-flex;
  margin-top: 18px;
  font-weight: 800;
  color: var(--accent-strong);
`

export default function TasksPage(): JSX.Element {
  return (
    <AppShell
      eyebrow="Hub operativo"
      title="Elige el punto exacto del flujo que quieres resolver."
      description="El modulo se divide en creacion de cobros, ingreso de movimientos e historico. La conciliacion vive dentro de movimientos porque la operacion parte desde una transferencia real con saldo disponible."
    >
      <MetricGrid>
        <MetricCard>
          <MetricLabel>Fuente de verdad</MetricLabel>
          <MetricValue>API Django + DRF</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Valor UF fijo</MetricLabel>
          <MetricValue>$40.000 CLP</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Flujo central</MetricLabel>
          <MetricValue>Movimiento -&gt; Conciliacion</MetricValue>
        </MetricCard>
      </MetricGrid>

      <ModuleGrid>
        <Card>
          <CardTitle>Cobros</CardTitle>
          <CardText>
            Crea collections mensuales y revisa en una sola vista su monto original, equivalente
            en CLP y saldo pendiente.
          </CardText>
          <ModuleLink href="/tasks/collections">Abrir modulo</ModuleLink>
        </Card>
        <Card>
          <CardTitle>Movimientos y conciliacion</CardTitle>
          <CardText>
            Registra transferencias, selecciona una con saldo disponible y reparte abonos entre
            uno o varios cobros.
          </CardText>
          <ModuleLink href="/tasks/bank-movements">Abrir modulo</ModuleLink>
        </Card>
        <Card>
          <CardTitle>Historico</CardTitle>
          <CardText>
            Revisa cobros pendientes y pagados con detalle expandible de transferencias
            asociadas.
          </CardText>
          <ModuleLink href="/tasks/history">Abrir modulo</ModuleLink>
        </Card>
      </ModuleGrid>
    </AppShell>
  )
}
