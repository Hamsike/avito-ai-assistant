export type Category = 'electronics' | 'auto' | 'real_estate'

export interface ElectronicsParams {
  type?: 'phone' | 'laptop' | 'misc'
  brand?: string
  model?: string
  condition?: 'new' | 'used'
  color?: string
}

export interface AutoParams {
  brand?: string
  model?: string
  yearOfManufacture?: number
  transmission?: 'automatic' | 'manual'
  mileage?: number
  enginePower?: number
}

export interface RealEstateParams {
  type?: 'flat' | 'house' | 'room'
  address?: string
  area?: number
  floor?: number
}

export interface Ad {
  id: string
  category: Category
  title: string
  description?: string
  price: number
  params: ElectronicsParams | AutoParams | RealEstateParams
  createdAt: string
  updatedAt: string
  needsRevision: boolean
}

export interface AdFormData {
  category: Category
  title: string
  description?: string
  price: number
  params: ElectronicsParams | AutoParams | RealEstateParams
}

export interface AdsListResponse {
  items: Ad[]
  total: number
}

export interface GetAdsParams {
  q?: string
  limit?: number
  skip?: number
  needsRevision?: boolean
  categories?: Category[]
  sortColumn?: 'title' | 'createdAt' | 'price'
  sortDirection?: 'asc' | 'desc'
}

export interface CheckRevisionResponse {
  needsRevision: boolean
  missingFields: string[]
}

export interface GeneratedPrice {
  suggested: number
  current: number
  difference: number
  percentage: number
  recommendation: 'выше' | 'ниже' | 'равна'
}

export type SortColumn = 'title' | 'createdAt' | 'price'
export type SortDirection = 'asc' | 'desc'
