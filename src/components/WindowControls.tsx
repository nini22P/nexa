import { Minus, Square, Xmark } from '@gravity-ui/icons'
import { Button } from '@heroui/react'

const WindowControls = () => {
  return (
    <div className="flex gap-1">
      <Button
        isIconOnly
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
        isIconOnly
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
        isIconOnly
        variant="ghost"
        className="no-drag hover:bg-danger hover:text-white"
        onClick={async () => {
          const { getCurrentWindow } = await import('@tauri-apps/api/window')
          await getCurrentWindow().close()
        }}
      >
        <Xmark />
      </Button>
    </div>
  )
}

export default WindowControls