/**
 * Testes — lib/services/turnstile.ts
 *
 * Cobre:
 *   ✓ Bypass em desenvolvimento (chave ausente, NODE_ENV != production)
 *   ✓ Bloqueio em produção (chave ausente)
 *   ✓ Token nulo rejeitado
 *   ✓ Token em branco rejeitado
 *   ✓ Token válido aceito (fetch mockado — success: true)
 *   ✓ Token inválido com error-codes da Cloudflare
 *   ✓ Token inválido via campo alternativo error_codes
 *   ✓ HTTP 500 da Cloudflare tratado graciosamente
 *   ✓ Falha de rede tratada graciosamente
 *   ✓ Parâmetros enviados corretamente à API da Cloudflare
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateTurnstileToken } from "@/lib/services/turnstile";

// ── helpers ───────────────────────────────────────────────────

function mockFetchSuccess() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  );
}

function mockFetchFailure(errorCodes: string[] = []) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, "error-codes": errorCodes }),
    })
  );
}

function mockFetchHttpError(status = 500) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: async () => ({}),
    })
  );
}

function mockFetchNetworkError() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("Network error"))
  );
}

// ── setup / teardown ──────────────────────────────────────────

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// ── testes de chave ausente ───────────────────────────────────

describe("validateTurnstileToken — chave ausente", () => {
  it("libera requisição em desenvolvimento quando chave não está configurada", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "test");

    const result = await validateTurnstileToken("qualquer-token");

    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("bloqueia requisição em produção quando chave não está configurada", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "production");

    const result = await validateTurnstileToken("qualquer-token");

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/indisponível/i);
  });

  it("não chama a API da Cloudflare quando chave está ausente", async () => {
    const mockFetch = vi.fn();
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubGlobal("fetch", mockFetch);

    await validateTurnstileToken("token");

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ── testes de token inválido (sem chamar Cloudflare) ─────────

describe("validateTurnstileToken — validação do token antes do fetch", () => {
  beforeEach(() => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "chave-de-teste-valida");
  });

  it("rejeita token nulo", async () => {
    const result = await validateTurnstileToken(null);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/captcha/i);
  });

  it("rejeita token string vazia", async () => {
    const result = await validateTurnstileToken("");

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/captcha/i);
  });

  it("rejeita token com apenas espaços", async () => {
    const result = await validateTurnstileToken("   ");

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/captcha/i);
  });

  it("não chama fetch quando token é nulo", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    await validateTurnstileToken(null);

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ── testes de integração com API Cloudflare (fetch mockado) ──

describe("validateTurnstileToken — chamada à API Cloudflare", () => {
  beforeEach(() => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "chave-de-teste-valida");
  });

  it("aceita token quando Cloudflare retorna success: true", async () => {
    mockFetchSuccess();

    const result = await validateTurnstileToken("token-valido");

    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("rejeita token quando Cloudflare retorna success: false com error-codes", async () => {
    mockFetchFailure(["invalid-input-response", "timeout-or-duplicate"]);

    const result = await validateTurnstileToken("token-expirado");

    expect(result.valid).toBe(false);
    expect(result.error).toContain("invalid-input-response");
    expect(result.error).toContain("timeout-or-duplicate");
  });

  it("rejeita token quando Cloudflare retorna success: false sem error-codes", async () => {
    mockFetchFailure();

    const result = await validateTurnstileToken("token-invalido");

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Validação falhou");
  });

  it("lida com campo alternativo error_codes (underline) da resposta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error_codes: ["bad-request"],
        }),
      })
    );

    const result = await validateTurnstileToken("token-invalido");

    expect(result.valid).toBe(false);
    expect(result.error).toContain("bad-request");
  });

  it("trata erro HTTP 500 da Cloudflare graciosamente", async () => {
    mockFetchHttpError(500);

    const result = await validateTurnstileToken("token-qualquer");

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/tente novamente/i);
  });

  it("trata falha de rede (fetch throw) graciosamente", async () => {
    mockFetchNetworkError();

    const result = await validateTurnstileToken("token-qualquer");

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/tente novamente/i);
  });
});

// ── testes de contrato da chamada HTTP ───────────────────────

describe("validateTurnstileToken — contrato da requisição HTTP", () => {
  it("envia chave secreta e token corretos para a Cloudflare", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubEnv("TURNSTILE_SECRET_KEY", "minha-chave-secreta");
    vi.stubGlobal("fetch", mockFetch);

    await validateTurnstileToken("meu-token-de-teste");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          secret: "minha-chave-secreta",
          response: "meu-token-de-teste",
        }),
      })
    );
  });

  it("chama a API exatamente uma vez por validação", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubEnv("TURNSTILE_SECRET_KEY", "chave-valida");
    vi.stubGlobal("fetch", mockFetch);

    await validateTurnstileToken("token");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
