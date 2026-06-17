"use client"

import { faPlus, faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import Swal from "sweetalert2"
import styled from "styled-components"

import { AppShell } from "@/components/shell"
import { ToastCenter, ToastItem } from "@/components/toast-center"
import {
  ActionsRow,
  Badge,
  Button,
  Card,
  CardText,
  CardTitle,
  EmptyState,
  Form,
  IconButton,
  Input,
  Label,
  Modal,
  Notice,
  Overlay,
  Table,
  TableWrap,
  Textarea,
} from "@/components/ui"
import {
  createBankMovement,
  createReconciliation,
  deleteBankMovement,
  formatApiError,
  getBankMovementDetail,
  getBankMovements,
  getCollections,
  updateBankMovement,
} from "@/lib/api"
import { formatCurrency, formatDate, formatMonth } from "@/lib/format"
import { BankMovement, Collection } from "@/lib/types"

type MovementFormState = {
  fecha: string
  glosa: string
  monto: string
}

type AllocationDraft = {
  collectionId: number
  amount: string
}

type ToastTone = ToastItem["tone"]

const INITIAL_MOVEMENT_FORM: MovementFormState = {
  fecha: "",
  glosa: "",
  monto: "",
}

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

const ModalTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 18px;
  border: 0;
  border-radius: 999px;
  background: var(--accent);
  color: #fffaf5;
  font-weight: 800;
`

const TopGrid = styled.div`
  display: grid;
  gap: 24px;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const FullWidthCard = styled(Card)`
  width: 100%;
  margin-top: 12px;
`

const MovementsTableWrap = styled(TableWrap)`
  max-height: 260px;
  overflow: auto;
`

const AllocationGrid = styled.div`
  display: grid;
  gap: 12px;
  max-height: 290px;
  overflow: auto;
  padding-right: 6px;
`

const AllocationRow = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.55);
`

const InlineInfo = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--text-soft);
  font-size: 0.92rem;
`

const SelectorList = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 18px;
`

const ReconciliationLayout = styled.div`
  display: grid;
  gap: 18px;
`

const ReconciliationSummary = styled.div`
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid var(--line);
`

const SummaryGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
`

const SummaryItem = styled.div`
  padding: 14px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--line);
`

const SummaryLabel = styled.span`
  display: block;
  margin-bottom: 6px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-soft);
`

const SummaryValue = styled.strong`
  font-size: 1.05rem;
`

const MovementButton = styled.button<{ $selected: boolean }>`
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: var(--radius-lg);
  border: 1px solid ${({ $selected }) => ($selected ? "transparent" : "var(--line)")};
  background: ${({ $selected }) =>
    $selected ? "linear-gradient(135deg, var(--accent), #cf7e59)" : "rgba(255,255,255,0.55)"};
  color: ${({ $selected }) => ($selected ? "#fffaf5" : "var(--text)")};
  text-align: left;
`

const CollectionCard = styled.div<{ $selected: boolean }>`
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-lg);
  border: 1px solid ${({ $selected }) => ($selected ? "rgba(184, 92, 56, 0.26)" : "var(--line)")};
  background: ${({ $selected }) =>
    $selected ? "rgba(184, 92, 56, 0.08)" : "rgba(255,255,255,0.55)"};
`

const CollectionCardButton = styled.button`
  display: grid;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
`

function mapMovementToForm(movement: BankMovement): MovementFormState {
  return {
    fecha: movement.fecha,
    glosa: movement.glosa,
    monto: movement.monto,
  }
}

function sortMovements(items: BankMovement[]): BankMovement[] {
  return [...items].sort((left, right) => {
    if (left.fecha === right.fecha) {
      return right.id - left.id
    }
    return left.fecha < right.fecha ? 1 : -1
  })
}

export default function BankMovementsPage(): JSX.Element {
  const [movements, setMovements] = useState<BankMovement[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [movementForm, setMovementForm] = useState<MovementFormState>(INITIAL_MOVEMENT_FORM)
  const [editingForm, setEditingForm] = useState<MovementFormState | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedMovementId, setSelectedMovementId] = useState<number | null>(null)
  const [selectedMovementDetail, setSelectedMovementDetail] = useState<BankMovement | null>(null)
  const [allocations, setAllocations] = useState<AllocationDraft[]>([])
  const [expandedCollectionId, setExpandedCollectionId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingMovement, setIsSavingMovement] = useState(false)
  const [isSubmittingReconciliation, setIsSubmittingReconciliation] = useState(false)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = useCallback((message: string, tone: ToastTone): void => {
    setToasts((current) => [...current, { id: Date.now() + Math.random(), message, tone }])
  }, [])

  const dismissToast = useCallback((id: number): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const selectedMovement = useMemo(
    () => movements.find((movement) => movement.id === selectedMovementId) ?? null,
    [movements, selectedMovementId],
  )

  const pendingCollections = useMemo(
    () => collections.filter((collection) => Number(collection.remaining_amount_clp) > 0),
    [collections],
  )

  const allocationMap = useMemo(
    () => new Map(allocations.map((allocation) => [allocation.collectionId, allocation])),
    [allocations],
  )

  const totalAllocationAmount = useMemo(
    () =>
      allocations.reduce((sum, allocation) => {
        const amount = Number(allocation.amount)
        return sum + (Number.isFinite(amount) ? amount : 0)
      }, 0),
    [allocations],
  )

  const selectedAllocationCount = allocationMap.size

  const remainingAfterAllocation = useMemo(() => {
    if (!selectedMovement) {
      return 0
    }

    return Number(selectedMovement.available_amount_clp) - totalAllocationAmount
  }, [selectedMovement, totalAllocationAmount])

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return
      }

      if (isCreateModalOpen) {
        setIsCreateModalOpen(false)
      }

      if (selectedMovementDetail) {
        closeModal()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isCreateModalOpen, selectedMovementDetail])

  async function loadData(): Promise<void> {
    setIsLoading(true)
    setError(null)

    try {
      const [movementData, collectionData] = await Promise.all([
        getBankMovements(),
        getCollections(),
      ])
      const sortedMovements = sortMovements(movementData)
      setMovements(sortedMovements)
      setCollections(collectionData)

      const currentSelection = sortedMovements.find(
        (movement) => movement.id === selectedMovementId,
      )
      if (!currentSelection || Number(currentSelection.available_amount_clp) <= 0) {
        const nextMovement = sortedMovements.find(
          (movement) => Number(movement.available_amount_clp) > 0,
        )
        setSelectedMovementId(nextMovement?.id ?? null)
      }
    } catch (loadError) {
      setError(formatApiError(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMovementSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsSavingMovement(true)
    setError(null)

    try {
      const createdMovement = await createBankMovement(movementForm)
      setMovements((current) => sortMovements([createdMovement, ...current]))
      setMovementForm(INITIAL_MOVEMENT_FORM)
      setIsCreateModalOpen(false)
      if (Number(createdMovement.available_amount_clp) > 0) {
        setSelectedMovementId(createdMovement.id)
      }
      pushToast("Movimiento creado correctamente.", "success")
    } catch (submitError) {
      setError(formatApiError(submitError))
    } finally {
      setIsSavingMovement(false)
    }
  }

  function addAllocation(collectionId: number): void {
    if (allocationMap.has(collectionId)) {
      return
    }

    setAllocations((current) => [...current, { collectionId, amount: "" }])
  }

  function updateAllocation(collectionId: number, amount: string): void {
    setAllocations((current) =>
      current.map((allocation) =>
        allocation.collectionId === collectionId ? { ...allocation, amount } : allocation,
      ),
    )
  }

  function removeAllocation(collectionId: number): void {
    setAllocations((current) =>
      current.filter((allocation) => allocation.collectionId !== collectionId),
    )
  }

  function toggleAllocation(collectionId: number): void {
    if (allocationMap.has(collectionId)) {
      removeAllocation(collectionId)
      setExpandedCollectionId((current) => (current === collectionId ? null : current))
      return
    }

    addAllocation(collectionId)
    setExpandedCollectionId(collectionId)
  }

  async function handleReconciliationSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsSubmittingReconciliation(true)
    setError(null)

    if (!selectedMovement) {
      setError("Selecciona un movimiento con saldo disponible antes de conciliar.")
      setIsSubmittingReconciliation(false)
      return
    }

    const normalizedAllocations = allocations
      .filter((allocation) => Number(allocation.amount) > 0)
      .map((allocation) => ({
        collection_id: allocation.collectionId,
        amount_clp: allocation.amount,
      }))

    if (normalizedAllocations.length === 0) {
      setError("Debes ingresar al menos un abono mayor a cero.")
      setIsSubmittingReconciliation(false)
      return
    }

    try {
      const result = await createReconciliation({
        bank_movement_id: selectedMovement.id,
        allocations: normalizedAllocations,
      })

      setMovements((current) =>
        sortMovements(
          current.map((movement) =>
            movement.id === result.bank_movement.id ? result.bank_movement : movement,
          ),
        ),
      )
      setCollections((current) =>
        current.map((collection) => {
          const updatedCollection = result.collections.find((item) => item.id === collection.id)
          return updatedCollection ?? collection
        }),
      )
      setAllocations([])
      setExpandedCollectionId(null)
      pushToast("Conciliacion registrada correctamente.", "success")
    } catch (submitError) {
      setError(formatApiError(submitError))
    } finally {
      setIsSubmittingReconciliation(false)
    }
  }

  async function openMovementModal(movementId: number): Promise<void> {
    setIsModalLoading(true)
    setModalError(null)

    try {
      const detail = await getBankMovementDetail(movementId)
      setSelectedMovementDetail(detail)
      setEditingForm(mapMovementToForm(detail))
    } catch (detailError) {
      pushToast(formatApiError(detailError), "error")
    } finally {
      setIsModalLoading(false)
    }
  }

  function closeModal(): void {
    setSelectedMovementDetail(null)
    setEditingForm(null)
    setModalError(null)
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!selectedMovementDetail || !editingForm) {
      return
    }

    setIsSavingEdit(true)
    setModalError(null)

    try {
      const updatedMovement = await updateBankMovement(selectedMovementDetail.id, editingForm)
      setMovements((current) =>
        sortMovements(
          current.map((movement) =>
            movement.id === updatedMovement.id ? updatedMovement : movement,
          ),
        ),
      )
      if (selectedMovementId === updatedMovement.id) {
        setSelectedMovementId(updatedMovement.id)
      }
      pushToast("Movimiento actualizado correctamente.", "success")
      closeModal()
    } catch (updateError) {
      setModalError(formatApiError(updateError))
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleDeleteFromRow(movement: BankMovement): Promise<void> {
    if (Number(movement.assigned_amount_clp) > 0) {
      pushToast("No puedes eliminar un movimiento que ya tiene asignaciones asociadas.", "error")
      return
    }

    const result = await Swal.fire({
      title: "Eliminar movimiento",
      text: `Se eliminara la transferencia "${movement.glosa}". Esta accion no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b85c38",
      cancelButtonColor: "#6b5a49",
      background: "#fffaf5",
      color: "#1f1a14",
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      await deleteBankMovement(movement.id)
      const remainingMovements = movements.filter((item) => item.id !== movement.id)
      setMovements(sortMovements(remainingMovements))
      if (selectedMovementId === movement.id) {
        const nextMovement = remainingMovements.find(
          (item) => Number(item.available_amount_clp) > 0,
        )
        setSelectedMovementId(nextMovement?.id ?? null)
      }
      if (selectedMovementDetail?.id === movement.id) {
        closeModal()
      }
      pushToast("Movimiento eliminado correctamente.", "success")
    } catch (deleteError) {
      pushToast(formatApiError(deleteError), "error")
    }
  }

  const canEditSelectedMovement =
    selectedMovementDetail !== null && Number(selectedMovementDetail.assigned_amount_clp) === 0

  return (
    <AppShell
      eyebrow="Movimientos y conciliacion"
      title="Parte desde la transferencia real y reparte el saldo con criterio."
      description="Esta vista junta el registro de movimientos bancarios con el panel de conciliacion para que el operador nunca pierda de vista cuanto saldo queda por distribuir."
    >
      <PageHeader>
        <div>
          <CardTitle>Nuevo movimiento</CardTitle>
          <CardText>
            Registra transferencias en un modal y vuelve directo al flujo de conciliacion.
          </CardText>
        </div>
        <ModalTrigger
          type="button"
          onClick={() => {
            setError(null)
            setMovementForm(INITIAL_MOVEMENT_FORM)
            setIsCreateModalOpen(true)
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nuevo movimiento</span>
        </ModalTrigger>
      </PageHeader>

      <TopGrid>
        <Card>
          <CardTitle>Selecciona una transferencia</CardTitle>
          <CardText>
            La conciliacion se habilita sobre movimientos con saldo remanente mayor a cero.
          </CardText>
          {isLoading ? <Notice>Cargando movimientos y cobros...</Notice> : null}
          {!isLoading && movements.length === 0 ? (
            <EmptyState>No hay movimientos registrados todavia.</EmptyState>
          ) : null}
          {!isLoading && movements.length > 0 ? (
            <SelectorList>
              {movements.map((movement) => (
                <MovementButton
                  key={movement.id}
                  type="button"
                  $selected={selectedMovementId === movement.id}
                  onClick={() => setSelectedMovementId(movement.id)}
                >
                  <strong>{movement.glosa}</strong>
                  <InlineInfo>
                    <span>{formatDate(movement.fecha)}</span>
                    <span>Total {formatCurrency(movement.monto, "CLP")}</span>
                    <span>
                      Disponible {formatCurrency(movement.available_amount_clp, "CLP")}
                    </span>
                  </InlineInfo>
                </MovementButton>
              ))}
            </SelectorList>
          ) : null}
        </Card>

        <Card>
          <CardTitle>Panel de conciliacion</CardTitle>
          <CardText>
            Selecciona cobros pendientes, completa los abonos y registra la conciliacion.
          </CardText>
          {!selectedMovement ? (
            <EmptyState>
              No hay un movimiento con saldo disponible seleccionado. Crea uno o elige uno del
              panel de la izquierda.
            </EmptyState>
          ) : (
            <ReconciliationLayout>
              <ReconciliationSummary>
                <strong>Movimiento activo: {selectedMovement.glosa}</strong>
                <InlineInfo>
                  <span>{formatDate(selectedMovement.fecha)}</span>
                  <span>Total {formatCurrency(selectedMovement.monto, "CLP")}</span>
                </InlineInfo>
                <SummaryGrid>
                  <SummaryItem>
                    <SummaryLabel>Disponible</SummaryLabel>
                    <SummaryValue>
                      {formatCurrency(selectedMovement.available_amount_clp, "CLP")}
                    </SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Cobros elegidos</SummaryLabel>
                    <SummaryValue>{selectedAllocationCount}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Total a repartir</SummaryLabel>
                    <SummaryValue>{formatCurrency(totalAllocationAmount, "CLP")}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Saldo restante</SummaryLabel>
                    <SummaryValue>{formatCurrency(remainingAfterAllocation, "CLP")}</SummaryValue>
                  </SummaryItem>
                </SummaryGrid>
              </ReconciliationSummary>

              <Form onSubmit={(event) => void handleReconciliationSubmit(event)}>
                {pendingCollections.length === 0 ? (
                  <EmptyState>No hay cobros pendientes para conciliar.</EmptyState>
                ) : (
                  <>
                    <AllocationGrid>
                      {pendingCollections.map((collection) => {
                        const currentAllocation = allocationMap.get(collection.id)
                        const isExpanded = expandedCollectionId === collection.id

                        return (
                          <CollectionCard
                            key={collection.id}
                            $selected={currentAllocation !== undefined || isExpanded}
                          >
                            <CollectionCardButton
                              type="button"
                              onClick={() => toggleAllocation(collection.id)}
                            >
                              <strong>
                                Contrato #{collection.contract_id} -{" "}
                                {formatMonth(collection.mes_cobro)}
                              </strong>
                              <InlineInfo>
                                <span>
                                  Monto {formatCurrency(collection.monto_cobro, collection.moneda)}
                                </span>
                                <span>
                                  Pendiente{" "}
                                  {formatCurrency(collection.remaining_amount_clp, "CLP")}
                                </span>
                              </InlineInfo>
                            </CollectionCardButton>

                            {isExpanded && currentAllocation ? (
                              <AllocationRow>
                                <strong>
                                  Abono para contrato #{collection.contract_id} de{" "}
                                  {formatMonth(collection.mes_cobro)}
                                </strong>
                                <InlineInfo>
                                  <span>
                                    Saldo pendiente{" "}
                                    {formatCurrency(collection.remaining_amount_clp, "CLP")}
                                  </span>
                                  <span>
                                    Monto original{" "}
                                    {formatCurrency(collection.monto_cobro, collection.moneda)}
                                  </span>
                                </InlineInfo>
                                <Label>
                                  Abono a registrar
                                  <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={currentAllocation.amount}
                                    onChange={(event) =>
                                      updateAllocation(collection.id, event.target.value)
                                    }
                                  />
                                </Label>
                                <Button
                                  type="button"
                                  $variant="ghost"
                                  onClick={() => removeAllocation(collection.id)}
                                >
                                  Quitar abono
                                </Button>
                              </AllocationRow>
                            ) : null}
                          </CollectionCard>
                        )
                      })}
                    </AllocationGrid>

                    {error ? <Notice $tone="error">{error}</Notice> : null}

                    <Button type="submit" disabled={isSubmittingReconciliation}>
                      {isSubmittingReconciliation ? "Conciliando..." : "Registrar conciliacion"}
                    </Button>
                  </>
                )}
              </Form>
            </ReconciliationLayout>
          )}
        </Card>
      </TopGrid>

      <FullWidthCard>
        <CardTitle>Listado de movimientos</CardTitle>
        <CardText>
          Revisa cuanto de cada transferencia ya fue usado y cuanto sigue disponible.
        </CardText>
        {!isLoading && movements.length === 0 ? (
          <EmptyState>No hay movimientos para mostrar.</EmptyState>
        ) : null}
        {!isLoading && movements.length > 0 ? (
          <MovementsTableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Glosa</th>
                  <th>Total</th>
                  <th>Asignado</th>
                  <th>Disponible</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{formatDate(movement.fecha)}</td>
                    <td>{movement.glosa}</td>
                    <td>{formatCurrency(movement.monto, "CLP")}</td>
                    <td>{formatCurrency(movement.assigned_amount_clp, "CLP")}</td>
                    <td>
                      <Badge
                        $tone={Number(movement.available_amount_clp) > 0 ? "warning" : "success"}
                      >
                        {formatCurrency(movement.available_amount_clp, "CLP")}
                      </Badge>
                    </td>
                    <td>
                      <ActionsRow>
                        <IconButton
                          type="button"
                          aria-label={`Editar movimiento ${movement.glosa}`}
                          title="Editar movimiento"
                          onClick={() => void openMovementModal(movement.id)}
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </IconButton>
                        <IconButton
                          type="button"
                          $tone="danger"
                          aria-label={`Eliminar movimiento ${movement.glosa}`}
                          title="Eliminar movimiento"
                          onClick={() => void handleDeleteFromRow(movement)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </IconButton>
                      </ActionsRow>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </MovementsTableWrap>
        ) : null}
      </FullWidthCard>

      {isCreateModalOpen ? (
        <Overlay>
          <Modal>
            <CardTitle>Nuevo movimiento</CardTitle>
            <CardText>
              Registra transferencias reales siempre en CLP. Luego podras usar su saldo disponible
              para uno o mas cobros.
            </CardText>
            <Form onSubmit={(event) => void handleMovementSubmit(event)}>
              <Label>
                Fecha
                <Input
                  autoFocus
                  required
                  type="date"
                  value={movementForm.fecha}
                  onChange={(event) =>
                    setMovementForm({ ...movementForm, fecha: event.target.value })
                  }
                />
              </Label>
              <Label>
                Glosa
                <Textarea
                  required
                  value={movementForm.glosa}
                  onChange={(event) =>
                    setMovementForm({ ...movementForm, glosa: event.target.value })
                  }
                />
              </Label>
              <Label>
                Monto CLP
                <Input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={movementForm.monto}
                  onChange={(event) =>
                    setMovementForm({ ...movementForm, monto: event.target.value })
                  }
                />
              </Label>

              {error ? <Notice $tone="error">{error}</Notice> : null}

              <ActionsRow>
                <Button type="submit" disabled={isSavingMovement}>
                  {isSavingMovement ? "Guardando..." : "Crear movimiento"}
                </Button>
                <Button
                  type="button"
                  $variant="secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
              </ActionsRow>
            </Form>
          </Modal>
        </Overlay>
      ) : null}

      {isModalLoading ? (
        <Overlay>
          <Modal>
            <Notice>Cargando detalle del movimiento...</Notice>
          </Modal>
        </Overlay>
      ) : null}

      {selectedMovementDetail && editingForm ? (
        <Overlay>
          <Modal>
            <CardTitle>Detalle del movimiento #{selectedMovementDetail.id}</CardTitle>
            <CardText>
              Puedes editar este movimiento mientras no tenga asignaciones asociadas.
            </CardText>
            <Form onSubmit={(event) => void handleUpdate(event)}>
              <Label>
                Fecha
                <Input
                  autoFocus
                  required
                  type="date"
                  value={editingForm.fecha}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, fecha: event.target.value })
                  }
                />
              </Label>
              <Label>
                Glosa
                <Textarea
                  required
                  value={editingForm.glosa}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, glosa: event.target.value })
                  }
                />
              </Label>
              <Label>
                Monto CLP
                <Input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editingForm.monto}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, monto: event.target.value })
                  }
                />
              </Label>

              <Notice>
                Asignado {formatCurrency(selectedMovementDetail.assigned_amount_clp, "CLP")} -
                Disponible {formatCurrency(selectedMovementDetail.available_amount_clp, "CLP")}
              </Notice>

              {!canEditSelectedMovement ? (
                <Notice>
                  Este movimiento ya tiene asignaciones asociadas, por eso no puede editarse ni
                  eliminarse.
                </Notice>
              ) : null}

              {modalError ? <Notice $tone="error">{modalError}</Notice> : null}

              <ActionsRow>
                <Button type="submit" disabled={isSavingEdit || !canEditSelectedMovement}>
                  {isSavingEdit ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button type="button" $variant="secondary" onClick={() => closeModal()}>
                  Cancelar
                </Button>
              </ActionsRow>
            </Form>
          </Modal>
        </Overlay>
      ) : null}

      <ToastCenter toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  )
}
