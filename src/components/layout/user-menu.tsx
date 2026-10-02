"use client";

import type { User } from "@supabase/supabase-js";
import { LogOutIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { es } from "@/i18n/es";
import { getBrowserSupabase } from "@/lib/supabase/client";

/** Estado de sesión en el encabezado (se resuelve en el navegador para no volver dinámicas las páginas). */
export function useSessionUser(): { user: User | null; ready: boolean } {
  const [user, setUser] = useState<User | null>(null);
  // Sin Supabase configurado no hay sesión que esperar.
  const [ready, setReady] = useState(() => getBrowserSupabase() === null);
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export function UserMenu() {
  const { user, ready } = useSessionUser();
  const router = useRouter();
  if (!ready) return <div className="h-8 w-20" aria-hidden />;
  if (!user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/login">{es.nav.login}</Link>
      </Button>
    );
  }
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="max-w-40">
          <UserIcon />
          <span className="truncate">{name.split(" ")[0]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/cuenta">{es.nav.account}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await getBrowserSupabase()?.auth.signOut();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOutIcon />
          {es.nav.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
