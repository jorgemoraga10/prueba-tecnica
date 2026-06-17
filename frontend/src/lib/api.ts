"use client"

import { BankMovement, Collection, ReconciliationAllocation } from "@/lib/types"

type UnknownRecord = Record<string, unknown>

type RequestOptions = {
  body?: UnknownRecord
  method?: "DELETE" | "GET" | "PATCH" | "POST"
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

export class ApiClientError extends Error {
  public readonly errors: unknown

  constructor(message: string, errors: unknown) {
    super(message)
    this.name = "ApiClientError"
    this.errors = errors
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no esta configurada.")
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  })

  const payload = (await response.json()) as
    | { data: T; message: string; success: boolean }
    | { errors: unknown; message: string; success: boolean }

  if (!response.ok || !payload.success || !("data" in payload)) {
    throw new ApiClientError(payload.message, "errors" in payload ? payload.errors : null)
  }

  return payload.data
}

export function getCollections(): Promise<Collection[]> {
  return request<Collection[]>("/api/collections/")
}

export function getCollectionDetail(id: number): Promise<Collection> {
  return request<Collection>(`/api/collections/${id}/`)
}

export function createCollection(input: {
  contract_id: number
  mes_cobro: string
  monto_cobro: string
  moneda: "CLP" | "UF"
}): Promise<Collection> {
  return request<Collection>("/api/collections/", {
    method: "POST",
    body: input,
  })
}

export function updateCollection(
  id: number,
  input: Partial<{
    contract_id: number
    mes_cobro: string
    monto_cobro: string
    moneda: "CLP" | "UF"
  }>,
): Promise<Collection> {
  return request<Collection>(`/api/collections/${id}/`, {
    method: "PATCH",
    body: input,
  })
}

export function deleteCollection(id: number): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/api/collections/${id}/`, {
    method: "DELETE",
  })
}

export function getBankMovements(): Promise<BankMovement[]> {
  return request<BankMovement[]>("/api/bank-movements/")
}

export function getBankMovementDetail(id: number): Promise<BankMovement> {
  return request<BankMovement>(`/api/bank-movements/${id}/`)
}

export function createBankMovement(input: {
  fecha: string
  glosa: string
  monto: string
}): Promise<BankMovement> {
  return request<BankMovement>("/api/bank-movements/", {
    method: "POST",
    body: input,
  })
}

export function updateBankMovement(
  id: number,
  input: Partial<{
    fecha: string
    glosa: string
    monto: string
  }>,
): Promise<BankMovement> {
  return request<BankMovement>(`/api/bank-movements/${id}/`, {
    method: "PATCH",
    body: input,
  })
}

export function deleteBankMovement(id: number): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/api/bank-movements/${id}/`, {
    method: "DELETE",
  })
}

export function createReconciliation(input: {
  bank_movement_id: number
  allocations: ReconciliationAllocation[]
}): Promise<{
  bank_movement: BankMovement
  allocations_created: number
  collections: Collection[]
}> {
  return request<{
    bank_movement: BankMovement
    allocations_created: number
    collections: Collection[]
  }>("/api/reconciliations/", {
    method: "POST",
    body: input,
  })
}

export function getCollectionHistory(): Promise<Collection[]> {
  return request<Collection[]>("/api/collections/history/")
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (typeof error.errors === "string") {
      return `${error.message}: ${error.errors}`
    }

    if (Array.isArray(error.errors)) {
      return `${error.message}: ${error.errors.join(", ")}`
    }

    if (error.errors && typeof error.errors === "object") {
      const values = Object.values(error.errors as UnknownRecord)
      const flattened = values.flatMap((value) => {
        if (Array.isArray(value)) {
          return value.map(String)
        }
        return [String(value)]
      })
      return `${error.message}: ${flattened.join(" ")}`
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Ocurrio un error inesperado."
}
