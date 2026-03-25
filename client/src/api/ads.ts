import { apiClient } from './axios'
import type { Ad, AdFormData, AdsListResponse, GetAdsParams } from '@/types'

export const adsApi = {
  getAds: async (params: GetAdsParams): Promise<AdsListResponse> => {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.append('q', params.q)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.skip) searchParams.append('skip', params.skip.toString())
    if (params.needsRevision) searchParams.append('needsRevision', 'true')
    if (params.categories?.length) searchParams.append('categories', params.categories.join(','))
    if (params.sortColumn) searchParams.append('sortColumn', params.sortColumn)
    if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection)

    const response = await apiClient.get(`/items?${searchParams.toString()}`)
    return response.data
  },

  getAdById: async (id: string): Promise<Ad> => {
    const response = await apiClient.get(`/items/${id}`)
    return response.data
  },

  updateAd: async (id: string, data: AdFormData): Promise<Ad> => {
    const response = await apiClient.put(`/items/${id}`, data)
    return response.data
  },

}