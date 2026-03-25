import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AdFormData } from '../types'

interface DraftState {
  drafts: Record<string, AdFormData>
  currentDraftId: string | null
}

const DRAFTS_STORAGE_KEY = 'ad_drafts'

const loadDraftsFromStorage = (): Record<string, AdFormData> => {
  try {
    const saved = localStorage.getItem(DRAFTS_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Ошибка загрузки черновиков:', error)
  }
  return {}
}

const saveDraftsToStorage = (drafts: Record<string, AdFormData>) => {
  try {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
  } catch (error) {
    console.error('Ошибка сохранения черновиков:', error)
  }
}

const initialState: DraftState = {
  drafts: loadDraftsFromStorage(),
  currentDraftId: null,
}

const draftSlice = createSlice({
  name: 'draft',
  initialState,
  reducers: {
    saveDraft: (state, action: PayloadAction<{ id: string; data: AdFormData }>) => {
      const { id, data } = action.payload
      state.drafts[id] = { ...data }
      saveDraftsToStorage(state.drafts)
    },
    
    clearDraft: (state, action: PayloadAction<string>) => {
      const id = action.payload
      delete state.drafts[id]
      saveDraftsToStorage(state.drafts)
      if (state.currentDraftId === id) {
        state.currentDraftId = null
      }
    },
    
    setCurrentDraft: (state, action: PayloadAction<string | null>) => {
      state.currentDraftId = action.payload
    },
    
    clearAllDrafts: (state) => {
      state.drafts = {}
      state.currentDraftId = null
      localStorage.removeItem(DRAFTS_STORAGE_KEY)
    },
  },
})

export const { saveDraft, clearDraft, setCurrentDraft, clearAllDrafts } = draftSlice.actions
export default draftSlice.reducer