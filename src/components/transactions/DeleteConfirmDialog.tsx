import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import type { Transaction } from '@/types'

interface DeleteConfirmDialogProps {
  transaction: Transaction | null
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({
  transaction,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={!!transaction} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent
        title="Delete transaction?"
        description="This will permanently remove the transaction. You can undo this from the notification that appears after deletion."
      >
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
