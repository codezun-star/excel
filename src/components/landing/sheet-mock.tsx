/** Ilustración del hero: una factura en una mini hoja de cálculo. */
const COLS = ["A", "B", "C", "D", "E"];
const ROWS: { cells: string[]; header?: boolean; total?: boolean }[] = [
  { cells: ["#", "Descripción", "Cant.", "Precio", "Total"], header: true },
  { cells: ["1", "Camisa polo bordada", "2", "L 350.00", "L 680.00"] },
  { cells: ["2", "Gorra con logo", "3", "L 180.00", "L 540.00"] },
  { cells: ["3", "Servicio de bordado", "1", "L 250.00", "L 250.00"] },
  { cells: ["", "", "", "ISV 15 %", "L 220.50"], total: true },
  { cells: ["", "", "", "Total", "L 1,690.50"], total: true },
];

export function SheetMock() {
  return (
    <div
      className="relative overflow-hidden rounded-xl border bg-card shadow-xl shadow-black/5"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-green-500/80" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          factura-con-isv-hn.xlsx
        </span>
      </div>
      <div className="flex items-center gap-2 border-b px-3 py-1.5 font-mono text-xs">
        <span className="font-bold text-brand-strong">ƒx</span>
        <span className="truncate text-muted-foreground">=SUMIF(Tipo,&quot;ISV 15%&quot;,ISV)</span>
      </div>
      <table className="w-full table-fixed border-collapse text-[11px] sm:text-xs">
        <thead>
          <tr>
            <th className="w-7 border-r border-b bg-cell-header" />
            {COLS.map((c) => (
              <th
                key={c}
                className="border-r border-b bg-cell-header py-1 font-mono font-medium text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr key={i}>
              <td className="border-r border-b bg-cell-header text-center font-mono text-muted-foreground">
                {i + 1}
              </td>
              {row.cells.map((cell, j) => (
                <td
                  key={j}
                  className={[
                    "truncate border-r border-b px-1.5 py-1.5",
                    row.header ? "bg-primary font-semibold text-primary-foreground" : "",
                    row.total && j >= 3 ? "bg-brand-soft font-semibold" : "",
                    j >= 2 && !row.header ? "text-right tabular-nums" : "",
                  ].join(" ")}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-1 border-t px-2 pt-1.5 pb-2 text-[11px]">
        <span className="rounded-t-md border border-b-0 bg-background px-2 py-0.5 font-semibold">
          Factura
        </span>
        <span className="px-2 py-0.5 text-muted-foreground">Parámetros</span>
        <span className="px-2 py-0.5 text-muted-foreground">Instrucciones</span>
      </div>
    </div>
  );
}
