import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Category, SortColumn, SortDirection } from '../types'

interface UIState {
  searchQuery: string
  categories: Category[]
  needsRevisionOnly: boolean
  sortColumn: SortColumn
  sortDirection: SortDirection
  currentPage: number
  itemsPerPage: number
  layout: 'grid' | 'list'
  sidebarCollapsed: boolean
}

const initialState: UIState = {
  searchQuery: '',
  categories: [],
  needsRevisionOnly: false,
  sortColumn: 'createdAt',
  sortDirection: 'desc',
  currentPage: 1,
  itemsPerPage: 10,
  layout: 'grid',
  sidebarCollapsed: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
      state.currentPage = 1
    },
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload
      state.currentPage = 1
    },
    toggleCategory: (state, action: PayloadAction<Category>) => {
      const index = state.categories.indexOf(action.payload)
      if (index === -1) state.categories.push(action.payload)
      else state.categories.splice(index, 1)
      state.currentPage = 1
    },
    setNeedsRevisionOnly: (state, action: PayloadAction<boolean>) => {
      state.needsRevisionOnly = action.payload
      state.currentPage = 1
    },
    resetFilters: (state) => {
      state.searchQuery = ''
      state.categories = []
      state.needsRevisionOnly = false
      state.currentPage = 1
    },
    setSort: (state, action: PayloadAction<{ column: SortColumn; direction: SortDirection }>) => {
      state.sortColumn = action.payload.column
      state.sortDirection = action.payload.direction
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    setLayout: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.layout = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
  },
})

export const {
  setSearchQuery,
  setCategories,
  toggleCategory,
  setNeedsRevisionOnly,
  resetFilters,
  setSort,
  setCurrentPage,
  setLayout,
  toggleSidebar,
} = uiSlice.actions
export default uiSlice.reducer