import React from 'react'
import { FolderOpen, Users, Code2, FileText, Search } from 'lucide-react'
import { Button } from './Button'

type EmptyVariant = 'sessions' | 'users' | 'code' | 'pdf' | 'search' | 'default'

interface EmptyStateProps {
  variant?: EmptyVariant
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const variants: Record<EmptyVariant, {
  icon: React.ReactNode
  defaultTitle: string
  defaultDesc: string
}> = {
  sessions: {
    icon: <FolderOpen size={40} strokeWidth={1.25} />,
    defaultTitle: 'Aucune session',
    defaultDesc:  'Créez votre première session pour commencer à enseigner.',
  },
  users: {
    icon: <Users size={40} strokeWidth={1.25} />,
    defaultTitle: 'Aucun utilisateur',
    defaultDesc:  'Aucun utilisateur trouvé dans le système.',
  },
  code: {
    icon: <Code2 size={40} strokeWidth={1.25} />,
    defaultTitle: 'Prêt à coder',
    defaultDesc:  'Écrivez votre code et appuyez sur Exécuter.',
  },
  pdf: {
    icon: <FileText size={40} strokeWidth={1.25} />,
    defaultTitle: 'Aucun fichier',
    defaultDesc:  'Glissez-déposez un PDF pour obtenir un résumé IA.',
  },
  search: {
    icon: <Search size={40} strokeWidth={1.25} />,
    defaultTitle: 'Aucun résultat',
    defaultDesc:  'Essayez de modifier vos critères de recherche.',
  },
  default: {
    icon: <FolderOpen size={40} strokeWidth={1.25} />,
    defaultTitle: 'Rien ici',
    defaultDesc:  'Cette section est vide pour le moment.',
  },
}

export function EmptyState({ variant = 'default', title, description, action }: EmptyStateProps) {
  const cfg = variants[variant]
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-[var(--color-muted)] mb-4 opacity-60">
        {cfg.icon}
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">
        {title ?? cfg.defaultTitle}
      </h3>
      <p className="text-sm text-[var(--color-muted)] max-w-xs leading-relaxed mb-5">
        {description ?? cfg.defaultDesc}
      </p>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
