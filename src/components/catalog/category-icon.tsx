import {
  Boxes,
  Building2,
  FileSpreadsheet,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Landmark,
  Receipt,
  Rocket,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Receipt,
  Landmark,
  Users,
  Boxes,
  Store,
  GraduationCap,
  Wallet,
  HandHeart,
  Building2,
  Rocket,
  HeartPulse,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? FileSpreadsheet;
  return <Icon className={className} aria-hidden />;
}
