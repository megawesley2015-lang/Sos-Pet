/**
 * Testes — lib/utils/format.ts
 *
 * Cobre: formatPhone, whatsappLink, SPECIES_LABEL, KIND_LABEL, SIZE_LABEL
 */

import { describe, it, expect } from "vitest";
import {
  formatPhone,
  whatsappLink,
  SPECIES_LABEL,
  KIND_LABEL,
  SIZE_LABEL,
  SEX_LABEL,
} from "@/lib/utils/format";

// ── formatPhone ───────────────────────────────────────────────

describe("formatPhone", () => {
  it("formata celular com 11 dígitos (com 9)", () => {
    expect(formatPhone("13999999999")).toBe("(13) 99999-9999");
  });

  it("formata fixo com 10 dígitos", () => {
    expect(formatPhone("1332221111")).toBe("(13) 3222-1111");
  });

  it("remove caracteres especiais antes de formatar", () => {
    expect(formatPhone("(13) 99999-9999")).toBe("(13) 99999-9999");
  });

  it("retorna original se formato desconhecido", () => {
    expect(formatPhone("12345")).toBe("12345");
  });
});

// ── whatsappLink ──────────────────────────────────────────────

describe("whatsappLink", () => {
  it("gera link com prefixo 55 para número sem prefixo", () => {
    const link = whatsappLink("13999999999");
    expect(link).toContain("wa.me/5513999999999");
  });

  it("não duplica prefixo 55 se já estiver no número", () => {
    const link = whatsappLink("5513999999999");
    expect(link).toContain("wa.me/5513999999999");
    expect(link).not.toContain("wa.me/555513");
  });

  it("codifica mensagem na URL", () => {
    const link = whatsappLink("13999999999", "Vi seu pet no Pet Aumigo!");
    expect(link).toContain("?text=");
    expect(link).toContain(encodeURIComponent("Vi seu pet no Pet Aumigo!"));
  });

  it("gera link sem texto se mensagem não for passada", () => {
    const link = whatsappLink("13999999999");
    expect(link).not.toContain("?text=");
  });
});

// ── Labels i18n ───────────────────────────────────────────────

describe("Labels de tradução", () => {
  it("SPECIES_LABEL traduz corretamente", () => {
    expect(SPECIES_LABEL["dog"]).toBe("Cão");
    expect(SPECIES_LABEL["cat"]).toBe("Gato");
    expect(SPECIES_LABEL["other"]).toBe("Outro");
  });

  it("KIND_LABEL traduz corretamente", () => {
    expect(KIND_LABEL["lost"]).toBe("Perdido");
    expect(KIND_LABEL["found"]).toBe("Encontrado");
  });

  it("SIZE_LABEL traduz corretamente", () => {
    expect(SIZE_LABEL["small"]).toBe("Pequeno");
    expect(SIZE_LABEL["medium"]).toBe("Médio");
    expect(SIZE_LABEL["large"]).toBe("Grande");
  });

  it("SEX_LABEL existe e tem as chaves esperadas", () => {
    expect(SEX_LABEL).toHaveProperty("male");
    expect(SEX_LABEL).toHaveProperty("female");
  });
});
