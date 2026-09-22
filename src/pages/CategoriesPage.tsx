import { useState, useCallback } from 'react'
import { categoryService } from '@/services/categoryService'
import { Plus, Pencil, Trash2, Lock } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useToast } from '@/components/ui/Toast'
import { CategoryIcon, ICON_NAMES } from '@/components/ui/CategoryIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/Dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'
import type { Category, TransactionType } from '@/types'

// ─── Colour palette for custom categories ─────────────────────────────────────

const COLOUR_OPTIONS = [
  '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F97316', '#6366F1', '#0EA5E9', '#0D9488',
  '#DC2626', '#6B7280', '#84CC16', '#A855F7', '#14B8A6',
]

// ─── Category form (create + edit) ───────────────────────────────────────────

interface CategoryFormState {
  name: string
  icon: string
  color: string
  type: TransactionType
}

const EMPTY_FORM: CategoryFormState = {
  name: '',
  icon: 'MoreHorizontal',
  color: '#6B7280',
  type: 'expense',
}

function fromCategory(c: Category): CategoryFormState {
  return { name: c.name, icon: c.icon, color: c.color ?? '#6B7280', type: c.type }
}

interface CategoryFormDialogProps {
  open: boolean
  initial?: Category          // undefined = create mode
  defaultType: TransactionType
  onSave: (values: CategoryFormState) => Promise<void>
  onClose: () => void
}

function CategoryFormDialog({ open, initial, defaultType, onSave, onClose }: CategoryFormDialogProps) {
  const [form, setForm] = useState<CategoryFormState>(() =>
    initial ? fromCategory(initial) : { ...EMPTY_FORM, type: defaultType }
  )
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setForm(initial ? fromCategory(initial) : { ...EMPTY_FORM, type: defaultType })
      setNameError('')
    } else {
      onClose()
    }
  }

  const set = <K extends keyof CategoryFormState>(k: K, v: CategoryFormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setNameError('Name is required'); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (e) {
      setNameError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const isEditing = !!initial
  const title = isEditing ? 'Edit category' : 'New category'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent title={title}>
        <div className="flex flex-col gap-4">
          {/* Type toggle — only shown when creating */}
          {!isEditing && (
            <div className="flex gap-2 rounded-xl bg-[var(--color-surface-muted)] p-1">
              {(['expense', 'income'] as TransactionType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('type', t)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-sm font-medium transition-all capitalize',
                    form.type === t
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-muted)]'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Name */}
          <Input
            label="Name"
            placeholder="e.g. Pet care"
            value={form.name}
            onChange={e => { set('name', e.target.value); setNameError('') }}
            error={nameError}
            autoFocus
          />

          {/* Icon picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Icon</span>
            <div className="grid max-h-36 grid-cols-8 gap-1.5 overflow-y-auto rounded-xl border border-[var(--color-border)] p-2">
              {ICON_NAMES.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => set('icon', name)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    form.icon === name
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
                  )}
                  title={name}
                >
                  <CategoryIcon name={name} size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Colour picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Colour</span>
            <div className="flex flex-wrap gap-2">
              {COLOUR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-transform active:scale-95',
                    form.color === c ? 'border-[var(--color-text-primary)] scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-muted)] px-4 py-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: form.color + '33' }}
            >
              <CategoryIcon name={form.icon} size={18} style={{ color: form.color }} />
            </span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {form.name || 'Preview'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </DialogClose>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

interface DeleteDialogProps {
  category: Category | null
  onConfirm: () => Promise<void>
  onCancel: () => void
}

function DeleteDialog({ category, onConfirm, onCancel }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setDeleting(true)
    setError('')
    try {
      await onConfirm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete category')
      setDeleting(false)
    }
  }

  return (
    <Dialog open={!!category} onOpenChange={o => { if (!o) { setError(''); onCancel() } }}>
      <DialogContent
        title="Delete category?"
        description={
          error
            ? undefined
            : `"${category?.name}" will be permanently removed.`
        }
      >
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          {!error && (
            <Button variant="destructive" className="flex-1" onClick={handleConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          )}
          {error && (
            <Button variant="outline" className="flex-1" onClick={() => { setError(''); onCancel() }}>
              OK
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Single category row ──────────────────────────────────────────────────────

interface CategoryRowProps {
  category: Category
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}

function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const color = category.color ?? '#6B7280'
  return (
    <div className="group flex items-center gap-3 px-4 py-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: color + '22' }}
      >
        <CategoryIcon name={category.icon} size={16} style={{ color }} />
      </span>

      <span className="flex-1 text-sm text-[var(--color-text-primary)]">{category.name}</span>

      {category.isDefault ? (
        <span
          className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]"
          title="Default categories cannot be edited or deleted"
        >
          <Lock size={11} />
          Default
        </span>
      ) : (
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            onClick={() => onEdit(category)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
            aria-label={`Edit ${category.name}`}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            aria-label={`Delete ${category.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Category list panel ──────────────────────────────────────────────────────

function CategoryList({
  type,
  categories,
  onAdd,
  onEdit,
  onDelete,
}: {
  type: TransactionType
  categories: Category[]
  onAdd: () => void
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}) {
  const filtered = categories.filter(c => c.type === type)
  const defaults = filtered.filter(c => c.isDefault)
  const custom   = filtered.filter(c => !c.isDefault)

  return (
    <div className="flex flex-col gap-4">
      {/* Add button */}
      <Button variant="outline" size="sm" onClick={onAdd} className="self-start gap-1.5">
        <Plus size={14} />
        New {type} category
      </Button>

      {/* Custom categories */}
      {custom.length > 0 && (
        <section>
          <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Custom
          </p>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
            {custom.map(c => (
              <CategoryRow key={c.id} category={c} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </section>
      )}

      {/* Default categories */}
      <section>
        <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Default
        </p>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
          {defaults.map(c => (
            <CategoryRow key={c.id} category={c} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CategoriesPage() {
  const { categories, createCategory, reload } = useCategories()
  const toast = useToast()

  const [formOpen,   setFormOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<Category | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [addType, setAddType] = useState<TransactionType>('expense')

  const handleAdd = useCallback((type: TransactionType) => {
    setEditTarget(undefined)
    setAddType(type)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((c: Category) => {
    setEditTarget(c)
    setFormOpen(true)
  }, [])

  const handleSave = useCallback(async (values: CategoryFormState) => {
    if (editTarget) {
      await categoryService.update(editTarget.id, {
        name: values.name,
        icon: values.icon,
        color: values.color,
      })
      await reload()
      toast.success('Category updated')
    } else {
      await createCategory({
        name: values.name,
        type: values.type,
        icon: values.icon,
        color: values.color,
        isDefault: false,
      })
      toast.success('Category created')
    }
  }, [editTarget, createCategory, reload, toast])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    await categoryService.delete(deleteTarget.id)
    await reload()
    setDeleteTarget(null)
    toast.success('Category deleted')
  }, [deleteTarget, reload, toast])

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Categories</h1>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
          Manage your spending and income categories
        </p>
      </header>

      <Tabs defaultValue="expense">
        <TabsList className="w-full">
          <TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger>
          <TabsTrigger value="income"  className="flex-1">Income</TabsTrigger>
        </TabsList>

        <TabsContent value="expense">
          <CategoryList
            type="expense"
            categories={categories}
            onAdd={() => handleAdd('expense')}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
        </TabsContent>

        <TabsContent value="income">
          <CategoryList
            type="income"
            categories={categories}
            onAdd={() => handleAdd('income')}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
        </TabsContent>
      </Tabs>

      {/* Create / edit dialog */}
      <CategoryFormDialog
        open={formOpen}
        initial={editTarget}
        defaultType={addType}
        onSave={handleSave}
        onClose={() => { setFormOpen(false); setEditTarget(undefined) }}
      />

      {/* Delete confirmation */}
      <DeleteDialog
        category={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
