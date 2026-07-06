import { useEffect, useState } from 'react'
import { adminApi } from '../api/session.api'
import { Card, CardHeader } from '../components/ui/Card'
import type { UserResponse } from '../types'
import { Shield, Users, Trash2, Loader2, GraduationCap, BookOpen, Search } from 'lucide-react'

const roleLabel = (role: string) =>
  role === 'PROF' ? 'Professeur' : role === 'ADMIN' ? 'Admin' : 'Étudiant'

const roleColor = (role: string) =>
  role === 'PROF'
    ? 'bg-blue-500/10 text-blue-600'
    : role === 'ADMIN'
    ? 'bg-red-500/10 text-red-600'
    : 'bg-green-500/10 text-green-600'

const RoleIcon = ({ role }: { role: string }) =>
  role === 'PROF' ? <BookOpen size={14} /> :
  role === 'ADMIN' ? <Shield size={14} /> :
  <GraduationCap size={14} />

export function AdminDashboard() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<UserResponse | null>(null)

  useEffect(() => {
    adminApi.getUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (user: UserResponse) => {
    setDeletingId(user.id)
    setConfirmDelete(null)
    try {
      await adminApi.deleteUser(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
    } catch {}
    finally { setDeletingId(null) }
  }

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const counts = {
    STUDENT: users.filter(u => u.role === 'STUDENT').length,
    PROF: users.filter(u => u.role === 'PROF').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Shield size={20} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">Administration</h1>
          <p className="text-xs text-[var(--color-muted)]">Gestion des utilisateurs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Étudiants', value: counts.STUDENT, color: 'text-green-500 bg-green-500/10' },
          { label: 'Professeurs', value: counts.PROF, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Admins', value: counts.ADMIN, color: 'text-red-500 bg-red-500/10' },
        ].map(stat => (
          <Card key={stat.label} hover={false} className="flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
              <Users size={16} />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text)]">{stat.value}</p>
              <p className="text-xs text-[var(--color-muted)]">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Users list */}
      <Card hover={false}>
        <CardHeader
          title="Utilisateurs"
          subtitle={`${users.length} compte(s) enregistré(s)`}
          action={
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="ss-input pl-8 py-1.5 text-xs w-48"
              />
            </div>
          }
        />
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-lg skeleton-shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <Users size={32} className="mx-auto text-[var(--color-border)] mb-3" />
            <p className="text-sm text-[var(--color-muted)]">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <RoleIcon role={u.role} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{u.fullName}</p>
                    <p className="text-xs text-[var(--color-muted)] truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${roleColor(u.role)}`}>
                    <RoleIcon role={u.role} />
                    {roleLabel(u.role)}
                  </span>
                  <button
                    onClick={() => setConfirmDelete(u)}
                    disabled={deletingId === u.id}
                    className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Supprimer l'utilisateur"
                  >
                    {deletingId === u.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm p-6 space-y-4" hover={false}>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h2 className="text-sm font-bold text-[var(--color-text)]">Supprimer l'utilisateur ?</h2>
              <p className="text-xs text-[var(--color-muted)]">
                <strong>{confirmDelete.fullName}</strong> sera supprimé définitivement.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 text-sm border border-[var(--color-border)] rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-bg)] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all"
              >
                Supprimer
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
