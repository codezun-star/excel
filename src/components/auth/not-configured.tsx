import { InfoIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { es } from "@/i18n/es";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function NotConfiguredNotice() {
  if (isSupabaseConfigured()) return null;
  return (
    <Alert variant="warning" className="mb-4">
      <InfoIcon />
      <AlertDescription>{es.auth.notConfigured}</AlertDescription>
    </Alert>
  );
}
