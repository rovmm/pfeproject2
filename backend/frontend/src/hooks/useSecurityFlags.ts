import { useEffect } from 'react'
import { useToast } from '../components/Toast'

interface SecurityFlags {
  disableCopyPaste: boolean
  warnOnTabSwitch: boolean
}

export function useSecurityFlags(flags: SecurityFlags) {
  const pushToast = useToast()

  // DISABLE COPY/PASTE
  useEffect(() => {
    if (!flags.disableCopyPaste) return

    const blockKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        pushToast('warning', 'Copy/paste is disabled during this session')
      }
    }
    const blockMenu = (e: MouseEvent) => e.preventDefault()
    const blockClip = (e: ClipboardEvent) => e.preventDefault()
    const blockDrop = (e: DragEvent) => e.preventDefault()

    document.addEventListener('keydown', blockKey)
    document.addEventListener('contextmenu', blockMenu)
    document.addEventListener('copy', blockClip)
    document.addEventListener('paste', blockClip)
    document.addEventListener('cut', blockClip)
    document.addEventListener('drop', blockDrop)

    return () => {
      document.removeEventListener('keydown', blockKey)
      document.removeEventListener('contextmenu', blockMenu)
      document.removeEventListener('copy', blockClip)
      document.removeEventListener('paste', blockClip)
      document.removeEventListener('cut', blockClip)
      document.removeEventListener('drop', blockDrop)
    }
  }, [flags.disableCopyPaste, pushToast])

  // WARN ON TAB SWITCH
  useEffect(() => {
    if (!flags.warnOnTabSwitch) return
    let count = 0

    const handleVisibility = () => {
      if (document.hidden) {
        count++
      } else {
        pushToast('error', `Warning: You left the page ${count} time(s). This may be reported.`)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [flags.warnOnTabSwitch, pushToast])
}
