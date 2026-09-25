// Escala de cinco pasos del registro emocional, de mejor a peor.
// El color va de salvia a vino: nunca se usa el terracota de error,
// porque sentirse mal no es un fallo.
export const EMOCIONES = [
  { valor: "muy_bien", etiqueta: "Muy bien", color: "bg-sage" },
  { valor: "bien", etiqueta: "Bien", color: "bg-sage/55" },
  { valor: "normal", etiqueta: "Normal", color: "bg-border-strong/60" },
  { valor: "mal", etiqueta: "Mal", color: "bg-accent-soft" },
  { valor: "muy_mal", etiqueta: "Muy mal", color: "bg-accent" },
] as const;

export type ValorEmocion = (typeof EMOCIONES)[number]["valor"];

export function emocion(valor: string) {
  return EMOCIONES.find((e) => e.valor === valor) ?? EMOCIONES[2];
}
