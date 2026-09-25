import { emocion } from "@/lib/emociones";

export default function MarcaEmocion({
  valor,
  intensidad,
}: {
  valor: string;
  intensidad?: number | null;
}) {
  const e = emocion(valor);
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${e.color}`} aria-hidden />
      <span className="font-medium">{e.etiqueta}</span>
      {intensidad ? <span className="text-ink-soft tabular-nums">· {intensidad}/10</span> : null}
    </span>
  );
}
