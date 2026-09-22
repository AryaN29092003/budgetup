import {
  UtensilsCrossed, Home, Car, ShoppingCart, ShoppingBag,
  Tv, FileText, RefreshCw, Plane, HeartPulse, GraduationCap,
  MoreHorizontal, Briefcase, Laptop, Gift, RotateCcw, Plus,
  HelpCircle, Music, Coffee, Dumbbell, Baby, PawPrint,
  Scissors, Fuel, Bus, Bike, Wallet, CreditCard, Star,
  Shirt, BookOpen, Gamepad2, Pizza, Zap, Droplets,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  UtensilsCrossed, Home, Car, ShoppingCart, ShoppingBag,
  Tv, FileText, RefreshCw, Plane, HeartPulse, GraduationCap,
  MoreHorizontal, Briefcase, Laptop, Gift, RotateCcw, Plus,
  Music, Coffee, Dumbbell, Baby, PawPrint,
  Scissors, Fuel, Bus, Bike, Wallet, CreditCard, Star,
  Shirt, BookOpen, Gamepad2, Pizza, Zap, Droplets,
}

export const ICON_NAMES = Object.keys(ICON_MAP)

interface CategoryIconProps extends LucideProps {
  name: string
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const Icon = ICON_MAP[name] ?? HelpCircle
  return <Icon {...props} />
}
