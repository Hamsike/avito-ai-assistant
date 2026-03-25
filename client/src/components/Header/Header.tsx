import React from 'react'
import styles from './Header.module.css'
import { ThemeToggle } from '../ThemeToogle/ThemeToggle'
import { useAppSelector } from '@/hooks/redux'

export const Header: React.FC = () => {
  const theme = useAppSelector(state => state.theme.mode)

  return (
    <header className={`${styles.header} ${styles[theme]}`}>
      <h1 className={styles.title}>Авито AI Ассистент</h1>
      <ThemeToggle />
    </header>
  )
}