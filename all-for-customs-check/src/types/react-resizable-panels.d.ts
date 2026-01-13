declare module 'react-resizable-panels' {
  import * as React from 'react'

  export interface PanelGroupProps extends React.ComponentPropsWithoutRef<'div'> {
    direction?: 'horizontal' | 'vertical'
    autoSaveId?: string
    children?: React.ReactNode
  }

  export const PanelGroup: React.ComponentType<PanelGroupProps>

  export interface PanelProps extends React.ComponentPropsWithoutRef<'div'> {
    defaultSize?: number
    minSize?: number
    maxSize?: number
    order?: number
    collapsible?: boolean
  }

  export const Panel: React.ComponentType<PanelProps>

  export interface PanelResizeHandleProps extends React.ComponentPropsWithoutRef<'div'> {
    className?: string
    hitAreaMargins?: number
  }

  export const PanelResizeHandle: React.ComponentType<PanelResizeHandleProps>
}
