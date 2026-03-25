export type UserRole = 'admin' | 'propietario' | 'arrendatario'

export interface Profile {
  id: string
  role: UserRole // 'admin' | 'propietario' | 'arrendatario'
  condo_id: string | null
  house_id: string | null
  first_name: string | null
  last_name: string | null
  created_at: string
}

export interface Condominium {
  id: string
  name: string
  address: string | null
  total_houses: number
  currency_symbol: string
  currency_name: string
  currency_multiplier: number
  admin_user_id: string
  created_at: string
}

export interface House {
  id: string
  condo_id: string
  house_number: string
  owner_name: string | null
  owner_email: string | null
  avatar_url: string | null
  user_id: string | null
  is_public: boolean
  payment_due_day: number
  custom_payment_deadline: string | null
  created_at: string
}

export interface ExpenseType {
  id: string
  condo_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface Expense {
  id: string
  condo_id: string
  expense_type_id: string
  amount: number
  description: string | null
  date: string
  receipt_url: string | null
  created_by: string
  created_at: string
  expense_type?: ExpenseType
}

export interface IncomeType {
  id: string
  condo_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Income {
  id: string
  condo_id: string
  house_id: string | null
  income_type_id: string
  amount: number
  date: string
  description: string | null
  created_by: string
  created_at: string
  income_type?: IncomeType
  house?: House
}

export interface PaymentReceipt {
  id: string
  income_id: string | null
  house_id: string
  condo_id: string
  receipt_url: string
  upload_date: string
  period_month: number
  period_year: number
  verified: boolean
  verified_by: string | null
  uploaded_by: string
  created_at: string
  house?: House
}

export interface ExemptionType {
  id: string
  condo_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Exemption {
  id: string
  condo_id: string
  house_id: string
  exemption_type_id: string
  is_permanent: boolean
  start_date: string
  end_date: string | null
  reason: string | null
  is_active: boolean
  created_at: string
  exemption_type?: ExemptionType
  house?: House
}

export interface ProjectType {
  id: string
  condo_id: string
  name: string
  created_at: string
}

export interface Project {
  id: string
  condo_id: string
  project_type_id: string | null
  title: string
  description: string | null
  status: 'planificado' | 'en_curso' | 'completado'
  location_photo_url: string | null
  budget: number | null
  start_date: string | null
  end_date: string | null
  created_by: string
  created_at: string
  project_type?: ProjectType
}

export interface ProjectQuotation {
  id: string
  project_id: string
  provider_name: string
  amount: number
  description: string | null
  file_url: string | null
  created_at: string
}

export interface ProjectPhoto {
  id: string
  project_id: string
  photo_url: string
  caption: string | null
  created_at: string
}

export interface Survey {
  id: string
  condo_id: string
  title: string
  description: string | null
  status: 'activa' | 'cerrada'
  created_at: string
  closes_at: string | null
  created_by: string
  options?: SurveyOption[]
}

export interface SurveyOption {
  id: string
  survey_id: string
  option_text: string
  vote_count?: number
}

export interface SurveyVote {
  id: string
  survey_id: string
  option_id: string
  house_id: string
  user_id: string
  voted_at: string
}

export interface DocumentType {
  id: string
  condo_id: string
  name: string
  created_at: string
}

export interface CondoDocument {
  id: string
  condo_id: string
  document_type_id: string
  title: string
  description: string | null
  file_url: string
  uploaded_at: string
  uploaded_by: string
  document_type?: DocumentType
}

export interface Violation {
  id: string
  condo_id: string
  house_id: string
  description: string
  date: string
  fine_amount: number | null
  is_paid: boolean
  paid_date: string | null
  document_id: string | null
  created_at: string
  house?: House
}

export interface RentalSpace {
  id: string
  condo_id: string
  name: string
  photo_url: string | null
  monthly_rate: number
  tenant_name: string | null
  tenant_contact: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

export interface CommonArea {
  id: string
  condo_id: string
  name: string
  description: string | null
  maintenance_responsible: string | null
  is_paid_maintenance: boolean
  maintenance_cost: number | null
  created_at: string
}

export interface BankStatement {
  id: string
  condo_id: string
  file_url: string
  period_month: number
  period_year: number
  description: string | null
  uploaded_at: string
  uploaded_by: string
}
