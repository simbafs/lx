import { ReactNode } from 'react'
import { appStyles } from '../styles'

interface LayoutProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  leftHeader?: ReactNode
  rightHeader?: ReactNode
  children?: ReactNode
}

export default function Layout({
  leftPanel,
  rightPanel,
  leftHeader,
  rightHeader,
  children,
}: LayoutProps) {
  return (
    <div style={appStyles.app}>
      <div style={appStyles.left}>
        {leftHeader}
        {leftPanel}
      </div>
      <div style={appStyles.right}>
        {rightHeader}
        {rightPanel}
      </div>
      {children}
    </div>
  )
}