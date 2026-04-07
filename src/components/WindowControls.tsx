import { Minus, Square, X } from 'lucide-react'
import { Button } from './ui/button'

const WindowControls = () => {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        className="no-drag"
        onClick={async () => {
          const { getCurrentWindow } = await import('@tauri-apps/api/window')
          await getCurrentWindow().minimize()
        }}
      >
        <Minus />
      </Button>
      <Button
        variant="ghost"
        className="no-drag"
        onClick={async () => {
          const { getCurrentWindow } = await import('@tauri-apps/api/window')
          await getCurrentWindow().toggleMaximize()
        }}
      >
        <Square />
      </Button>
      <Button
        variant="ghost"
        className="no-drag hover:bg-destructive hover:text-white"
        onClick={async () => {
          const { getCurrentWindow } = await import('@tauri-apps/api/window')
          await getCurrentWindow().close()
        }}
      >
        <X />
      </Button>
    </div>
  )
}

export default WindowControls