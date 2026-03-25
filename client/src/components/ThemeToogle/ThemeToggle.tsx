import React from 'react'
import { Button, Tooltip } from 'antd'
import { BulbOutlined, BulbFilled } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { toggleTheme } from '@/slices/themeSlice'

export const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch()
  const { mode } = useAppSelector((state) => state.theme)

  return (
    <Tooltip title={mode === 'light' ? 'Тёмная тема' : 'Светлая тема'}>
      <Button
        type="text"
        icon={mode === 'light' ? <BulbOutlined /> : <BulbFilled />}
        onClick={() => dispatch(toggleTheme())}
        style={{ fontSize: 18 }}
      />
    </Tooltip>
  )
}
