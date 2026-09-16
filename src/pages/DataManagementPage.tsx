import { useRef, useState } from 'react'
import { Download, Upload, FileText, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { backupService } from '@/services/backupService'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'

// ─── Action row ───────────────────────────────────────────────────────────────

interface ActionRowProps {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
  danger?: boolean
}

function ActionRow({ icon, title, description, action, danger }: ActionRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <span className={danger ? 'text-red-500 dark:text-red-400 mt-0.5' : 'text-[var(--color-primary)] mt-0.5'}>
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

function DeleteAllDialog({ open, onConfirm, onCancel }: DeleteDialogProps) {
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped]           = useState('')
  const CONFIRM_WORD = 'DELETE'

  const handleOpenChange = (o: boolean) => { if (!o) { setTyped(''); onCancel() } }

  const handleConfirm = async () => {
    if (typed !== CONFIRM_WORD) return
    setConfirming(true)
    try   { await onConfirm() }
    finally { setConfirming(false); setTyped('') }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent title="Delete all data?" description="This cannot be undone. Export a backup first if you want to restore later.">
        <div className="flex flex-col gap-4">
          {/* Warning box */}
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-900/20">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-xs text-red-700 dark:text-red-400">
              All transactions, budgets, and custom categories will be permanently deleted.
              Default categories will be restored. Settings will be reset.
            </p>
          </div>

          {/* Type-to-confirm */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--color-text-secondary)]">
              Type <strong className="font-mono">{CONFIRM_WORD}</strong> to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value.toUpperCase())}
              placeholder={CONFIRM_WORD}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              disabled={typed !== CONFIRM_WORD || confirming}
            >
              {confirming ? 'Deleting…' : 'Delete everything'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Import result banner ─────────────────────────────────────────────────────

interface ImportResult {
  transactions: number
  categories: number
  budgets: number
}

function ImportSuccessBanner({ result, onDismiss }: { result: ImportResult; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/40 dark:bg-emerald-900/20">
      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Import successful</p>
        <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
          Restored {result.transactions} transaction{result.transactions !== 1 ? 's' : ''},&nbsp;
          {result.categories} categor{result.categories !== 1 ? 'ies' : 'y'},&nbsp;
          {result.budgets} budget{result.budgets !== 1 ? 's' : ''}.
        </p>
      </div>
      <button onClick={onDismiss} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400">
        ×
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DataManagementPage() {
  const toast                    = useToast()
  const fileInputRef             = useRef<HTMLInputElement>(null)
  const [busy, setBusy]          = useState<string | null>(null)   // which action is running
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError]   = useState<string | null>(null)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleExportJSON = async () => {
    setBusy('json')
    try   { await backupService.exportJSON(); toast.success('Backup downloaded') }
    catch (e) { toast.success((e instanceof Error ? e.message : 'Export failed')) }
    finally   { setBusy(null) }
  }

  const handleExportCSV = async () => {
    setBusy('csv')
    try   { await backupService.exportCSV(); toast.success('CSV downloaded') }
    catch (e) { toast.success((e instanceof Error ? e.message : 'Export failed')) }
    finally   { setBusy(null) }
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!e.target.files) return
    // Reset so selecting the same file again re-triggers onChange
    e.target.value = ''
    if (!file) return

    setImportResult(null)
    setImportError(null)
    setBusy('import')

    try {
      const result = await backupService.importJSON(file)
      setImportResult(result.imported)
      toast.success('Data restored from backup')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setBusy(null)
    }
  }

  const handleDeleteAll = async () => {
    setDeleteOpen(false)
    setBusy('delete')
    try {
      await backupService.deleteAllData()
      setImportResult(null)
      setImportError(null)
      toast.success('All data deleted')
    } catch (e) {
      toast.success((e instanceof Error ? e.message : 'Delete failed'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Data Management</h1>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
          Export, import, and manage your local data
        </p>
      </header>

      {/* Import result / error feedback */}
      {importResult && (
        <ImportSuccessBanner result={importResult} onDismiss={() => setImportResult(null)} />
      )}
      {importError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-900/20">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Import failed</p>
            <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">{importError}</p>
          </div>
          <button onClick={() => setImportError(null)} className="text-red-500">×</button>
        </div>
      )}

      {/* Export section */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] px-4">
        <p className="py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Export</p>

        <ActionRow
          icon={<Download size={16} />}
          title="Export backup (JSON)"
          description="Full backup of all transactions, budgets, categories, and settings."
          action={
            <Button size="sm" variant="outline" onClick={handleExportJSON} disabled={busy === 'json'}>
              {busy === 'json' ? 'Exporting…' : 'Export'}
            </Button>
          }
        />

        <ActionRow
          icon={<FileText size={16} />}
          title="Export transactions (CSV)"
          description="Spreadsheet-friendly export of all transactions."
          action={
            <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={busy === 'csv'}>
              {busy === 'csv' ? 'Exporting…' : 'Export'}
            </Button>
          }
        />
      </section>

      {/* Import section */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] px-4">
        <p className="py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Import</p>

        <ActionRow
          icon={<Upload size={16} />}
          title="Restore from backup"
          description="Replaces all current data with the contents of a Paisa backup file. The file is validated before any changes are made."
          action={
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileSelected}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy === 'import'}
              >
                {busy === 'import' ? 'Importing…' : 'Choose file'}
              </Button>
            </>
          }
        />
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-200 bg-[var(--color-surface)] dark:border-red-900/40 divide-y divide-red-100 dark:divide-red-900/20 px-4">
        <p className="py-3 text-xs font-semibold uppercase tracking-wide text-red-500">Danger zone</p>

        <ActionRow
          icon={<Trash2 size={16} />}
          title="Delete all data"
          description="Permanently deletes all transactions, budgets, and custom categories. This cannot be undone. Export a backup first."
          danger
          action={
            <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)} disabled={!!busy}>
              Delete all
            </Button>
          }
        />
      </section>

      <DeleteAllDialog
        open={deleteOpen}
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
