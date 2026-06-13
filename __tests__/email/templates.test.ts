/**
 * Testes — lib/email/templates.ts
 *
 * Funções puras: sem mocks necessários.
 * Cobre: estrutura HTML, XSS escaping, campos condicionais,
 *        cálculos de score%, pluralização de dias.
 */

import { describe, it, expect } from "vitest";
import {
  petConfirmationTemplate,
  matchFoundTemplate,
  adoptionConfirmationTemplate,
  petFollowUpTemplate,
  partnershipWelcomeTemplate,
  partnershipAdminAlertTemplate,
  partnershipApprovedTemplate,
  partnershipRejectedTemplate,
} from "@/lib/email/templates";

const SITE = "https://sospetamigo.com.br";

// ── Helpers ────────────────────────────────────────────────────────────────────

function isValidHtml(html: string): boolean {
  return html.includes("<!DOCTYPE html>") && html.includes("</html>");
}

// ── petConfirmationTemplate ────────────────────────────────────────────────────

describe("petConfirmationTemplate", () => {
  const base = { petName: "Mel", petId: "abc-123", species: "cachorro", siteUrl: SITE };

  it("retorna HTML válido com DOCTYPE", () => {
    expect(isValidHtml(petConfirmationTemplate(base))).toBe(true);
  });

  it("inclui o nome do pet e a espécie", () => {
    const html = petConfirmationTemplate(base);
    expect(html).toContain("Mel");
    expect(html).toContain("cachorro");
  });

  it("inclui link para o pet", () => {
    const html = petConfirmationTemplate(base);
    expect(html).toContain(`/pets/${base.petId}`);
  });

  it("inclui img quando photoUrl é fornecido", () => {
    const html = petConfirmationTemplate({ ...base, photoUrl: "https://example.com/mel.jpg" });
    expect(html).toContain("<img");
    expect(html).toContain("mel.jpg");
  });

  it("omite img quando photoUrl não é fornecido", () => {
    const html = petConfirmationTemplate(base);
    expect(html).not.toContain("<img");
  });

  it("escapa caracteres HTML perigosos no nome (XSS)", () => {
    const html = petConfirmationTemplate({ ...base, petName: '<script>alert("xss")</script>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

// ── matchFoundTemplate ─────────────────────────────────────────────────────────

describe("matchFoundTemplate", () => {
  const base = {
    petName: "Bolinha",
    matchPetName: "Max",
    matchCity: "Santos",
    matchId: "match-456",
    score: 0.87,
    siteUrl: SITE,
  };

  it("retorna HTML válido", () => {
    expect(isValidHtml(matchFoundTemplate(base))).toBe(true);
  });

  it("exibe percentual de compatibilidade arredondado", () => {
    const html = matchFoundTemplate(base);
    expect(html).toContain("87%");
  });

  it("arredonda corretamente (0.755 → 76%)", () => {
    const html = matchFoundTemplate({ ...base, score: 0.755 });
    expect(html).toContain("76%");
  });

  it("inclui link para o match", () => {
    expect(matchFoundTemplate(base)).toContain(`/pets/${base.matchId}`);
  });

  it("inclui foto do match quando fornecida", () => {
    const html = matchFoundTemplate({ ...base, matchPhotoUrl: "https://cdn.example.com/max.jpg" });
    expect(html).toContain("max.jpg");
  });
});

// ── adoptionConfirmationTemplate ───────────────────────────────────────────────

describe("adoptionConfirmationTemplate", () => {
  const base = { petName: "Luna", petId: "pet-789", adopterName: "Maria", siteUrl: SITE };

  it("retorna HTML válido", () => {
    expect(isValidHtml(adoptionConfirmationTemplate(base))).toBe(true);
  });

  it("menciona o nome do adotante", () => {
    expect(adoptionConfirmationTemplate(base)).toContain("Maria");
  });

  it("inclui link para o pet", () => {
    expect(adoptionConfirmationTemplate(base)).toContain(`/pets/${base.petId}`);
  });
});

// ── petFollowUpTemplate ────────────────────────────────────────────────────────

describe("petFollowUpTemplate", () => {
  const base = { petName: "Thor", petId: "pet-001", daysSinceLost: 3, siteUrl: SITE };

  it("retorna HTML válido", () => {
    expect(isValidHtml(petFollowUpTemplate(base))).toBe(true);
  });

  it("usa plural 'dias' quando > 1", () => {
    expect(petFollowUpTemplate(base)).toContain("3 dias");
  });

  it("usa singular 'dia' quando = 1", () => {
    const html = petFollowUpTemplate({ ...base, daysSinceLost: 1 });
    expect(html).toContain("1 dia");
    expect(html).not.toContain("1 dias");
  });

  it("inclui link para atualização", () => {
    expect(petFollowUpTemplate(base)).toContain(`/pets/${base.petId}`);
  });
});

// ── partnershipWelcomeTemplate ─────────────────────────────────────────────────

describe("partnershipWelcomeTemplate", () => {
  const base = { nome: "João Silva", tipoNegocio: "Veterinário", cidade: "Guarujá", siteUrl: SITE };

  it("retorna HTML válido", () => {
    expect(isValidHtml(partnershipWelcomeTemplate(base))).toBe(true);
  });

  it("menciona nome, tipo e cidade", () => {
    const html = partnershipWelcomeTemplate(base);
    expect(html).toContain("João Silva");
    expect(html).toContain("Veterinário");
    expect(html).toContain("Guarujá");
  });

  it("escapa caracteres especiais PT-BR no nome (& < >)", () => {
    const html = partnershipWelcomeTemplate({ ...base, nome: "Café & Bar <Santos>" });
    expect(html).not.toContain("<Santos>");
    expect(html).toContain("&lt;Santos&gt;");
  });
});

// ── partnershipAdminAlertTemplate ──────────────────────────────────────────────

describe("partnershipAdminAlertTemplate", () => {
  const base = {
    nome: "Ana Costa",
    email: "ana@pet.com",
    telefone: "13999990000",
    tipoNegocio: "Pet Shop",
    cidade: "Santos",
    adminUrl: `${SITE}/admin`,
  };

  it("retorna HTML válido", () => {
    expect(isValidHtml(partnershipAdminAlertTemplate(base))).toBe(true);
  });

  it("exibe todos os dados do solicitante", () => {
    const html = partnershipAdminAlertTemplate(base);
    expect(html).toContain("Ana Costa");
    expect(html).toContain("ana@pet.com");
    expect(html).toContain("Pet Shop");
  });

  it("inclui linha de mensagem quando fornecida", () => {
    const html = partnershipAdminAlertTemplate({ ...base, mensagem: "Preciso de ajuda com o cadastro" });
    expect(html).toContain("Preciso de ajuda");
  });

  it("omite linha de mensagem quando não fornecida", () => {
    const html = partnershipAdminAlertTemplate(base);
    expect(html).not.toContain("Mensagem");
  });
});

// ── partnershipApprovedTemplate / partnershipRejectedTemplate ──────────────────

describe("partnershipApprovedTemplate", () => {
  it("retorna HTML com link para dashboard-prestador", () => {
    const html = partnershipApprovedTemplate({ nome: "Carlos", siteUrl: SITE });
    expect(isValidHtml(html)).toBe(true);
    expect(html).toContain("dashboard-prestador");
    expect(html).toContain("Carlos");
  });
});

describe("partnershipRejectedTemplate", () => {
  it("retorna HTML com link de contato", () => {
    const html = partnershipRejectedTemplate({ nome: "Fernanda", siteUrl: SITE });
    expect(isValidHtml(html)).toBe(true);
    expect(html).toContain("/contato");
    expect(html).toContain("Fernanda");
  });
});
