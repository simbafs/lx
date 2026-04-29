import { ReactNode } from 'react'
import { appStyles } from '../styles'

interface LayoutProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  children?: ReactNode
}

export default function Layout({ leftPanel, rightPanel, children }: LayoutProps) {
  return (
    <div style={appStyles.app}>
      <div style={appStyles.left}>{leftPanel}</div>
      <div style={appStyles.right}>{rightPanel}</div>
      {children}
    </div>
  )
}