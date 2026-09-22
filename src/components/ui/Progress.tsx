import * as RadixProgress from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number // 0–100
  className?: string
  indicatorClassName?: string
  /** Accessible label — e.g. "Food: 64% of budget used" */
  label?: string
}

export function Progress({ value, className, indicatorClassName, label }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <RadixProgress.Root
      value={clamped}
      aria-label={label ?? `${clamped}% used`}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]',
        className
      )}
    >
      <RadixProgress.Indicator
        className={cn(
          'h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300',
          'motion-reduce:transition-none',
          indicatorClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </RadixProgress.Root>
  )
}
