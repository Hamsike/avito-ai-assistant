import { useMutation } from '@tanstack/react-query'
import { aiApi } from '@/api/ai'
import type { AdFormData } from '@/types'

export const useGenerateDescription = () => {
  return useMutation({
    mutationFn: (ad: AdFormData) => aiApi.generateDescription(ad),
    retry: 1,
  })
}

export const useSuggestPrice = () => {
  return useMutation({
    mutationFn: (ad: AdFormData) => aiApi.suggestPrice(ad),
  })
}
