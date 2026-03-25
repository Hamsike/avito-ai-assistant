import { combineReducers, configureStore } from "@reduxjs/toolkit";
import themeReducer from './slices/themeSlice'
import draftReducer from './slices/draftSlice'
import uiReducer from './slices/uiSlice'

const rootReducer = combineReducers({
  theme: themeReducer,
  draft: draftReducer,
  ui: uiReducer
})

export const store = configureStore({
  reducer: rootReducer
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
