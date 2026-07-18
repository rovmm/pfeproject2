import Icon, { type IconName } from '../Icon'
import { getFileColorVar, isCodeFile, isImageFile, isPdfFile } from '../../utils/driveUtils'

const SIZE_PX: Record<'sm' | 'md' | 'lg', number> = { sm: 16, md: 24, lg: 40 }

function iconFor(fileType: string): IconName {
  if (isPdfFile(fileType)) return 'file-text'
  if (isCodeFile(fileType)) return 'code'
  if (isImageFile(fileType)) return 'image'
  return 'file-text'
}

export default function FileIcon({
  fileType,
  size = 'md',
}: {
  fileType: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const px = SIZE_PX[size]
  return <Icon name={iconFor(fileType)} size={px} color={getFileColorVar(fileType)} />
}
