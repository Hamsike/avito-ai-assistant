import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adsApi } from '@/api/ads'
import type { GetAdsParams, AdFormData } from '@/types'

export const adKeys = {
  all: ['ads'] as const,
  lists: () => [...adKeys.all, 'list'] as const,
  list: (params: GetAdsParams) => [...adKeys.lists(), params] as const,
  details: () => [...adKeys.all, 'detail'] as const,
  detail: (id: string) => [...adKeys.details(), id] as const,
}

export const useAds = (params: GetAdsParams) => {
  return useQuery({
    queryKey: adKeys.list(params),
    queryFn: () => adsApi.getAds(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData: any) => previousData,
  })
}

export const useAd = (id: string) => {
  return useQuery({
    queryKey: adKeys.detail(id),
    queryFn: () => adsApi.getAdById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpdateAd = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdFormData }) => 
      adsApi.updateAd(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: adKeys.lists() })
    },
  })
}
