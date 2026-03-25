import { useAppSelector } from "@/hooks/redux"
import { ConfigProvider, theme } from "antd"
import type React from "react"
import ruRU from 'antd/locale/ru_RU'

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider = ({children}: ThemeProviderProps) => {
  const mode = useAppSelector(state => state.theme.mode);

  return (
      <ConfigProvider
        locale={ruRU}
        theme={{
          algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm
        }}
      >
        {children}
      </ConfigProvider>
  )
}
