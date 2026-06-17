export type Currency = "CLP" | "UF"

export type PaymentDetail = {
  id: number
  bank_movement_id: number
  fecha: string
  glosa: string
  amount_clp: string
  created_at: string
}

export type Collection = {
  id: number
  contract_id: number
  mes_cobro: string
  monto_cobro: string
  moneda: Currency
  monto_cobro_clp: string
  total_paid_clp: string
  remaining_amount_clp: string
  payments: PaymentDetail[]
  created_at: string
  updated_at: string
}

export type BankMovement = {
  id: number
  fecha: string
  glosa: string
  monto: string
  assigned_amount_clp: string
  available_amount_clp: string
  created_at: string
  updated_at: string
}

export type ReconciliationAllocation = {
  collection_id: number
  amount_clp: string
}

export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export type ApiErrorEnvelope = {
  success: false
  message: string
  errors: Record<string, unknown> | string[] | string
}
