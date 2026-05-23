/**
 * Testes — lib/validation/pet.ts
 *
 * Módulo: Achados e Perdidos
 * Cobre: createPetSchema, validatePhoto
 *
 * Cenários:
 *   ✓ Dados válidos passam sem erro
 *   ✓ Campos obrigatórios rejeitam strings vazias
 *   ✓ Telefone inválido é rejeitado
 *   ✓ Data futura é rejeitada
 *   ✓ Tipo de foto inválido é rejeitado
 *   ✓ Foto grande demais é rejeitada
 *   ✓ Sem foto é aceito (campo opcional)
 */

import { describe, it, expect } from "vitest";
import { createPetSchema, validatePhoto } from "@/lib/validation/pet";

// ── Dados base válidos ────────────────────────────────────────

function petValido(overrides: Record<string, unknown> = {}) {
  return {
    kind: "lost",
    species: "dog",
    color: "Caramelo",
    neighborhood: "Gonzaga",
    city: "Santos",
    state: "SP",
    event_date: "2026-05-01",
    contact_name: "Wesley",
    contact_phone: "13999999999",
    contact_whatsapp: "on",
    ...overrides,
  };
}

// ── createPetSchema ───────────────────────────────────────────

describe("createPetSchema — pet perdido/encontrado", () => {
  it("aceita dados mínimos válidos (pet perdido)", () => {
    const result = createPetSchema.safeParse(petValido());
    expect(result.success).toBe(true);
  });

  it("aceita dados mínimos válidos (pet encontrado)", () => {
    const result = createPetSchema.safeParse(petValido({ kind: "found" }));
    expect(result.success).toBe(true);
  });

  it("rejeita kind inválido", () => {
    const result = createPetSchema.safeParse(petValido({ kind: "unknown" }));
    expect(result.success).toBe(false);
  });

  it("rejeita espécie inválida", () => {
    const result = createPetSchema.safeParse(petValido({ species: "bird" }));
    expect(result.success).toBe(false);
  });

  it("rejeita cor vazia", () => {
    const result = createPetSchema.safeParse(petValido({ color: "" }));
    expect(result.success).toBe(false);
  });

  it("rejeita bairro vazio", () => {
    const result = createPetSchema.safeParse(petValido({ neighborhood: "" }));
    expect(result.success).toBe(false);
  });

  it("rejeita cidade vazia", () => {
    const result = createPetSchema.safeParse(petValido({ city: "" }));
    expect(result.success).toBe(false);
  });

  it("rejeita data no futuro", () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const result = createPetSchema.safeParse(
      petValido({ event_date: amanha.toISOString().split("T")[0] })
    );
    expect(result.success).toBe(false);
  });

  it("aceita data de hoje", () => {
    const hoje = new Date().toISOString().split("T")[0];
    const result = createPetSchema.safeParse(petValido({ event_date: hoje }));
    expect(result.success).toBe(true);
  });

  it("rejeita telefone com caracteres inválidos", () => {
    const result = createPetSchema.safeParse(
      petValido({ contact_phone: "abc123" })
    );
    expect(result.success).toBe(false);
  });

  it("rejeita telefone muito curto", () => {
    const result = createPetSchema.safeParse(
      petValido({ contact_phone: "1234" })
    );
    expect(result.success).toBe(false);
  });

  it("aceita name opcional como undefined", () => {
    const result = createPetSchema.safeParse(petValido({ name: undefined }));
    expect(result.success).toBe(true);
  });

  it("transforma name em null quando vazio", () => {
    const result = createPetSchema.safeParse(petValido({ name: "" }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeNull();
    }
  });

  it("normaliza state para maiúsculas", () => {
    const result = createPetSchema.safeParse(petValido({ state: "sp" }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe("SP");
    }
  });

  it("aceita geolocalizacao válida", () => {
    const result = createPetSchema.safeParse(
      petValido({ latitude: -23.95, longitude: -46.33 })
    );
    expect(result.success).toBe(true);
  });

  it("rejeita latitude fora do range", () => {
    const result = createPetSchema.safeParse(
      petValido({ latitude: 200 })
    );
    expect(result.success).toBe(false);
  });

  it("transforma contact_whatsapp 'on' em true", () => {
    const result = createPetSchema.safeParse(petValido({ contact_whatsapp: "on" }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contact_whatsapp).toBe(true);
    }
  });
});

// ── validatePhoto ─────────────────────────────────────────────

describe("validatePhoto — upload de imagem", () => {
  it("aceita foto sem arquivo (campo opcional)", () => {
    const result = validatePhoto(null);
    expect(result.ok).toBe(true);
  });

  it("aceita foto JPG válida", () => {
    const file = new File(["conteudo"], "foto.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 1024 * 100 }); // 100 KB
    const result = validatePhoto(file);
    expect(result.ok).toBe(true);
  });

  it("rejeita formato inválido (GIF)", () => {
    const file = new File(["conteudo"], "foto.gif", { type: "image/gif" });
    const result = validatePhoto(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Formato inválido");
    }
  });

  it("rejeita arquivo maior que 5 MB", () => {
    const file = new File(["conteudo"], "foto.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 }); // 6 MB
    const result = validatePhoto(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("5 MB");
    }
  });

  it("aceita arquivo PNG no limite (exatamente 5 MB)", () => {
    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 }); // exato
    const result = validatePhoto(file);
    expect(result.ok).toBe(true);
  });
});
