import Link from "next/link";

import { SearchBox } from "@/components/landing/search-box";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex max-w-xl flex-col items-center py-20 text-center">
      <p className="cell-label h-8 rounded-md px-3 font-mono text-sm">#¡REF!</p>
      <h1 className="mt-5 text-3xl font-extrabold">No encontramos esta página</h1>
      <p className="mt-2 text-muted-foreground">
        Puede que el enlace esté roto o que la página haya cambiado de lugar.
      </p>
      <SearchBox className="mt-6" />
      <Button asChild variant="outline" className="mt-4">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
