"use client"

import { useEffect, useState } from "react"
import styled from "styled-components"

import { AppShell } from "@/components/shell"
import {
  Badge,
  Card,
  CardText,
  CardTitle,
  EmptyState,
  MetricCard,
  MetricGrid,
  MetricLabel,
  MetricValue,
  Notice,
} from "@/components/ui"
import { formatApiError, getCollectionHistory } from "@/lib/api"
import { formatCurrency, formatDate, formatMonth } from "@/lib/format"
import { Collection } from "@/lib/types"

const HistoryGrid = styled.div`
  display: grid;
  gap: 18px;
  margin-top: 20px;
`

const SummaryGrid = styled(MetricGrid)`
  margin-top: 22px;
`

const HistoryCard = styled.div`
  display: grid;
  gap: 18px;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.5);
`

const HistoryHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

const HistoryTitleBlock = styled.div`
  display: grid;
  gap: 6px;
`

const HistoryTitle = styled.strong`
  font-size: 1.05rem;
`

const HistoryMeta = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--text-soft);
  font-size: 0.95rem;
`

const MetricsGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`

const MetricBox = styled.div`
  padding: 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.62);
`

const PaymentsBlock = styled.div`
  display: grid;
  gap: 12px;
`

const PaymentsTitle = styled.strong`
  font-size: 0.96rem;
`

const PaymentList = styled.div`
  display: grid;
  gap: 10px;
`

const PaymentItem = styled.div`
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid var(--line);
`

const PaymentTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

const PaymentTitle = styled.strong`
  font-size: 0.95rem;
`

const PaymentMeta = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--text-soft);
  font-size: 0.92rem;
`

function getCollectionStatus(collection: Collection): {
  tone: "success" | "warning" | "neutral"
  label: string
} {
  const isPaid = Number(collection.remaining_amount_clp) === 0
  const hasPartialPayments =
    Number(collection.total_paid_clp) > 0 && Number(collection.remaining_amount_clp) > 0

  if (isPaid) {
    return { tone: "success", label: "Pagado" }
  }

  if (hasPartialPayments) {
    return { tone: "warning", label: "Parcial" }
  }

  return { tone: "neutral", label: "Pendiente" }
}

export default function HistoryPage(): JSX.Element {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paidCount = collections.filter(
    (collection) => Number(collection.remaining_amount_clp) === 0,
  ).length
  const partialCount = collections.filter(
    (collection) =>
      Number(collection.total_paid_clp) > 0 && Number(collection.remaining_amount_clp) > 0,
  ).length
  const pendingCount = collections.filter(
    (collection) => Number(collection.total_paid_clp) === 0 && Number(collection.remaining_amount_clp) > 0,
  ).length
  const totalPendingAmount = collections.reduce(
    (sum, collection) => sum + Number(collection.remaining_amount_clp),
    0,
  )

  useEffect(() => {
    void loadHistory()
  }, [])

  async function loadHistory(): Promise<void> {
    setIsLoading(true)
    setError(null)

    try {
      setCollections(await getCollectionHistory())
    } catch (loadError) {
      setError(formatApiError(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppShell
      eyebrow="Historico"
      title="Lee el estado de cada cobro sin reconstruir la historia a mano."
      description="La vista de historico expone pagos asociados, montos originales y saldo restante para distinguir rapido que esta pendiente, parcialmente cubierto o completamente pagado."
    >
      <Card>
        <CardTitle>Historico de cobros</CardTitle>
        <CardText>
          Usa esta vista para auditar conciliaciones y revisar que transferencias explican cada
          cobro.
        </CardText>

        {isLoading ? <Notice>Cargando historico...</Notice> : null}
        {error ? <Notice $tone="error">{error}</Notice> : null}
        {!isLoading && collections.length === 0 ? (
          <EmptyState>No hay cobros registrados todavia.</EmptyState>
        ) : null}

        {!isLoading && collections.length > 0 ? (
          <HistoryGrid>
            <SummaryGrid>
              <MetricCard>
                <MetricLabel>Cobros pendientes</MetricLabel>
                <MetricValue>{pendingCount}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Cobros parciales</MetricLabel>
                <MetricValue>{partialCount}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Cobros pagados</MetricLabel>
                <MetricValue>{paidCount}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Saldo pendiente total</MetricLabel>
                <MetricValue>{formatCurrency(totalPendingAmount, "CLP")}</MetricValue>
              </MetricCard>
            </SummaryGrid>

            {collections.map((collection) => {
              const status = getCollectionStatus(collection)

              return (
                <HistoryCard key={collection.id}>
                  <HistoryHeader>
                    <HistoryTitleBlock>
                      <HistoryTitle>Contrato #{collection.contract_id}</HistoryTitle>
                      <HistoryMeta>
                        <span>{formatMonth(collection.mes_cobro)}</span>
                        <span>Monto original {formatCurrency(collection.monto_cobro, collection.moneda)}</span>
                        <span>Equivalente {formatCurrency(collection.monto_cobro_clp, "CLP")}</span>
                      </HistoryMeta>
                    </HistoryTitleBlock>
                    <Badge $tone={status.tone}>{status.label}</Badge>
                  </HistoryHeader>

                  <MetricsGrid>
                    <MetricBox>
                      <MetricLabel>Pagado</MetricLabel>
                      <MetricValue>{formatCurrency(collection.total_paid_clp, "CLP")}</MetricValue>
                    </MetricBox>
                    <MetricBox>
                      <MetricLabel>Pendiente</MetricLabel>
                      <MetricValue>
                        {formatCurrency(collection.remaining_amount_clp, "CLP")}
                      </MetricValue>
                    </MetricBox>
                    <MetricBox>
                      <MetricLabel>Pagos asociados</MetricLabel>
                      <MetricValue>{collection.payments.length}</MetricValue>
                    </MetricBox>
                  </MetricsGrid>

                  <PaymentsBlock>
                    <PaymentsTitle>Detalle de pagos</PaymentsTitle>
                    {collection.payments.length === 0 ? (
                      <EmptyState>Este cobro todavia no tiene pagos asociados.</EmptyState>
                    ) : (
                      <PaymentList>
                        {collection.payments.map((payment) => (
                          <PaymentItem key={payment.id}>
                            <PaymentTop>
                              <PaymentTitle>{payment.glosa}</PaymentTitle>
                              <strong>{formatCurrency(payment.amount_clp, "CLP")}</strong>
                            </PaymentTop>
                            <PaymentMeta>
                              <span>Fecha {formatDate(payment.fecha)}</span>
                              <span>Movimiento #{payment.bank_movement_id}</span>
                              <span>Registrado {formatDate(payment.created_at)}</span>
                            </PaymentMeta>
                          </PaymentItem>
                        ))}
                      </PaymentList>
                    )}
                  </PaymentsBlock>
                </HistoryCard>
              )
            })}
          </HistoryGrid>
        ) : null}
      </Card>
    </AppShell>
  )
}
