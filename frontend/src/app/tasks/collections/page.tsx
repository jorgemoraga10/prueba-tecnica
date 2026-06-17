"use client"

import { faPlus, faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { FormEvent, useCallback, useEffect, useState } from "react"
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
  Select,
  Table,
  TableWrap,
} from "@/components/ui"
import {
  createCollection,
  deleteCollection,
  formatApiError,
  getCollectionDetail,
  getCollections,
  updateCollection,
} from "@/lib/api"
import { formatCurrency, formatMonth } from "@/lib/format"
import { Collection, Currency } from "@/lib/types"

type FormState = {
  contract_id: string
  mes_cobro: string
  monto_cobro: string
  moneda: Currency
}

type ToastTone = ToastItem["tone"]

const INITIAL_FORM: FormState = {
  contract_id: "",
  mes_cobro: "",
  monto_cobro: "",
  moneda: "CLP",
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

const FullWidthCard = styled(Card)`
  width: 100%;
  margin-top: 12px;
`

const CollectionsTableWrap = styled(TableWrap)`
  max-height: 380px;
  overflow: auto;
`

function mapCollectionToForm(collection: Collection): FormState {
  return {
    contract_id: String(collection.contract_id),
    mes_cobro: collection.mes_cobro,
    monto_cobro: collection.monto_cobro,
    moneda: collection.moneda,
  }
}

function sortCollections(items: Collection[]): Collection[] {
  return [...items].sort((left, right) => {
    if (left.mes_cobro === right.mes_cobro) {
      return right.id - left.id
    }
    return left.mes_cobro < right.mes_cobro ? 1 : -1
  })
}

export default function CollectionsPage(): JSX.Element {
  const [collections, setCollections] = useState<Collection[]>([])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [editingForm, setEditingForm] = useState<FormState | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  useEffect(() => {
    void loadCollections()
  }, [])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return
      }

      if (isCreateModalOpen) {
        setIsCreateModalOpen(false)
      }

      if (selectedCollection) {
        closeModal()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isCreateModalOpen, selectedCollection])

  async function loadCollections(): Promise<void> {
    setIsLoading(true)
    setError(null)
    try {
      setCollections(await getCollections())
    } catch (loadError) {
      setError(formatApiError(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const createdCollection = await createCollection({
        contract_id: Number(form.contract_id),
        mes_cobro: form.mes_cobro,
        monto_cobro: form.monto_cobro,
        moneda: form.moneda,
      })
      setCollections((current) => sortCollections([createdCollection, ...current]))
      setForm(INITIAL_FORM)
      setIsCreateModalOpen(false)
      pushToast("Cobro creado correctamente.", "success")
    } catch (submitError) {
      setError(formatApiError(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function openCollectionModal(collectionId: number): Promise<void> {
    setIsModalLoading(true)
    setModalError(null)

    try {
      const detail = await getCollectionDetail(collectionId)
      setSelectedCollection(detail)
      setEditingForm(mapCollectionToForm(detail))
    } catch (detailError) {
      pushToast(formatApiError(detailError), "error")
    } finally {
      setIsModalLoading(false)
    }
  }

  function closeModal(): void {
    setSelectedCollection(null)
    setEditingForm(null)
    setModalError(null)
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!selectedCollection || !editingForm) {
      return
    }

    setIsSavingEdit(true)
    setModalError(null)

    try {
      const updatedCollection = await updateCollection(selectedCollection.id, {
        contract_id: Number(editingForm.contract_id),
        mes_cobro: editingForm.mes_cobro,
        monto_cobro: editingForm.monto_cobro,
        moneda: editingForm.moneda,
      })
      setCollections((current) =>
        sortCollections(
          current.map((collection) =>
            collection.id === updatedCollection.id ? updatedCollection : collection,
          ),
        ),
      )
      pushToast("Cobro actualizado correctamente.", "success")
      closeModal()
    } catch (updateError) {
      setModalError(formatApiError(updateError))
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleDeleteFromRow(collection: Collection): Promise<void> {
    if (collection.payments.length > 0) {
      pushToast("No puedes eliminar un cobro que ya tiene pagos asociados.", "error")
      return
    }

    const result = await Swal.fire({
      title: "Eliminar cobro",
      text: `Se eliminara el cobro del contrato #${collection.contract_id}. Esta accion no se puede deshacer.`,
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
      await deleteCollection(collection.id)
      setCollections((current) => current.filter((item) => item.id !== collection.id))
      if (selectedCollection?.id === collection.id) {
        closeModal()
      }
      pushToast("Cobro eliminado correctamente.", "success")
    } catch (deleteError) {
      pushToast(formatApiError(deleteError), "error")
    }
  }

  const canEditSelectedCollection =
    selectedCollection !== null && selectedCollection.payments.length === 0

  return (
    <AppShell
      eyebrow="Cobros"
      title="Modela el calendario de cobros antes de asignar transferencias."
      description="Aqui registras cada cobro mensual, en CLP o UF, y ves de inmediato cuanto queda pendiente para las siguientes conciliaciones."
    >
      <PageHeader>
        <div>
          <CardTitle>Nuevo cobro</CardTitle>
          <CardText>
            Registra el cobro en un modal y deja el listado libre para revisar saldos.
          </CardText>
        </div>
        <ModalTrigger
          type="button"
          onClick={() => {
            setError(null)
            setForm(INITIAL_FORM)
            setIsCreateModalOpen(true)
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nuevo cobro</span>
        </ModalTrigger>
      </PageHeader>

      <FullWidthCard>
        <CardTitle>Cobros registrados</CardTitle>
        <CardText>Administra cada cobro desde la columna de accion y revisa su saldo pendiente.</CardText>
        {isLoading ? <Notice>Cargando cobros...</Notice> : null}
        {!isLoading && collections.length === 0 ? (
          <EmptyState>No hay cobros aun. Crea el primero desde el boton superior.</EmptyState>
        ) : null}
        {!isLoading && collections.length > 0 ? (
          <CollectionsTableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Mes</th>
                  <th>Monto</th>
                  <th>Equivalente CLP</th>
                  <th>Pendiente</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection) => (
                  <tr key={collection.id}>
                    <td>#{collection.contract_id}</td>
                    <td>{formatMonth(collection.mes_cobro)}</td>
                    <td>{formatCurrency(collection.monto_cobro, collection.moneda)}</td>
                    <td>{formatCurrency(collection.monto_cobro_clp, "CLP")}</td>
                    <td>
                      <Badge
                        $tone={Number(collection.remaining_amount_clp) > 0 ? "warning" : "success"}
                      >
                        {formatCurrency(collection.remaining_amount_clp, "CLP")}
                      </Badge>
                    </td>
                    <td>
                      <ActionsRow>
                        <IconButton
                          type="button"
                          aria-label={`Editar cobro ${collection.contract_id}`}
                          title="Editar cobro"
                          onClick={() => void openCollectionModal(collection.id)}
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </IconButton>
                        <IconButton
                          type="button"
                          $tone="danger"
                          aria-label={`Eliminar cobro ${collection.contract_id}`}
                          title="Eliminar cobro"
                          onClick={() => void handleDeleteFromRow(collection)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </IconButton>
                      </ActionsRow>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CollectionsTableWrap>
        ) : null}
      </FullWidthCard>

      {isCreateModalOpen ? (
        <Overlay>
          <Modal>
            <CardTitle>Nuevo cobro</CardTitle>
            <CardText>
              Usa siempre el primer dia del mes para mantener una referencia mensual consistente.
            </CardText>
            <Form onSubmit={(event) => void handleCreate(event)}>
              <Label>
                Contrato
                <Input
                  autoFocus
                  required
                  type="number"
                  min="1"
                  value={form.contract_id}
                  onChange={(event) => setForm({ ...form, contract_id: event.target.value })}
                />
              </Label>
              <Label>
                Mes de cobro
                <Input
                  required
                  type="date"
                  value={form.mes_cobro}
                  onChange={(event) => setForm({ ...form, mes_cobro: event.target.value })}
                />
              </Label>
              <Label>
                Monto
                <Input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.monto_cobro}
                  onChange={(event) => setForm({ ...form, monto_cobro: event.target.value })}
                />
              </Label>
              <Label>
                Moneda
                <Select
                  value={form.moneda}
                  onChange={(event) =>
                    setForm({ ...form, moneda: event.target.value as Currency })
                  }
                >
                  <option value="CLP">CLP</option>
                  <option value="UF">UF</option>
                </Select>
              </Label>

              {error ? <Notice $tone="error">{error}</Notice> : null}

              <ActionsRow>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Crear cobro"}
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
            <Notice>Cargando detalle del cobro...</Notice>
          </Modal>
        </Overlay>
      ) : null}

      {selectedCollection && editingForm ? (
        <Overlay>
          <Modal>
            <CardTitle>Detalle del cobro #{selectedCollection.contract_id}</CardTitle>
            <CardText>Puedes editar este cobro mientras no tenga pagos asociados.</CardText>
            <Form onSubmit={(event) => void handleUpdate(event)}>
              <Label>
                Contrato
                <Input
                  autoFocus
                  required
                  type="number"
                  min="1"
                  value={editingForm.contract_id}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, contract_id: event.target.value })
                  }
                />
              </Label>
              <Label>
                Mes de cobro
                <Input
                  required
                  type="date"
                  value={editingForm.mes_cobro}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, mes_cobro: event.target.value })
                  }
                />
              </Label>
              <Label>
                Monto
                <Input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editingForm.monto_cobro}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, monto_cobro: event.target.value })
                  }
                />
              </Label>
              <Label>
                Moneda
                <Select
                  value={editingForm.moneda}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, moneda: event.target.value as Currency })
                  }
                >
                  <option value="CLP">CLP</option>
                  <option value="UF">UF</option>
                </Select>
              </Label>

              <Notice>
                Pagado {formatCurrency(selectedCollection.total_paid_clp, "CLP")} - Pendiente{" "}
                {formatCurrency(selectedCollection.remaining_amount_clp, "CLP")}
              </Notice>

              {!canEditSelectedCollection ? (
                <Notice>
                  Este cobro ya tiene pagos asociados, por eso no puede editarse ni eliminarse.
                </Notice>
              ) : null}

              {modalError ? <Notice $tone="error">{modalError}</Notice> : null}

              <ActionsRow>
                <Button type="submit" disabled={isSavingEdit || !canEditSelectedCollection}>
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
