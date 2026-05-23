/**
 * Testes — lib/validation/auth.ts
 *
 * Módulo: Autenticação (login, registro, recuperação de senha)
 * Cobre: loginSchema, registerSchema, forgotPasswordSchema, parseFormData
 *
 * Cenários:
 *   ✓ Login válido aceito
 *   ✓ E-mail inválido rejeitado
 *   ✓ Senha vazia rejeitada no login
 *   ✓ Registro válido aceito
 *   ✓ Senhas não coincidentes rejeitadas no registro
 *   ✓ Senha curta (menos de 8 chars) rejeitada no registro
 *   ✓ parseFormData extrai erros corretos do FormData
 */

import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  parseFormData,
} from "@/lib/validation/auth";

// ── loginSchema ───────────────────────────────────────────────

describe("loginSchema — Entrar na conta", () => {
  it("aceita e-mail e senha válidos", () => {
    const result = loginSchema.safeParse({
      email: "wes@sospet.com.br",
      password: "senhaSegura123",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail sem @", () => {
    const result = loginSchema.safeParse({
      email: "nao-eh-email",
      password: "senhaSegura123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("inválido");
    }
  });

  it("rejeita e-mail vazio", () => {
    const result = loginSchema.safeParse({ email: "", password: "senha123" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha vazia", () => {
    const result = loginSchema.safeParse({
      email: "wes@sospet.com.br",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

// ── registerSchema ────────────────────────────────────────────

describe("registerSchema — Criar conta", () => {
  it("aceita cadastro válido", () => {
    const result = registerSchema.safeParse({
      full_name: "Wesley Costa",
      email: "wes@sospet.com.br",
      password: "MinhaSenh@123",
      confirm: "MinhaSenh@123",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    const result = registerSchema.safeParse({
      full_name: "Wesley Costa",
      email: "wes@sospet.com.br",
      password: "curta",
      confirm: "curta",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs.some((m) => m.includes("8"))).toBe(true);
    }
  });

  it("rejeita quando as senhas não coincidem", () => {
    const result = registerSchema.safeParse({
      full_name: "Wesley Costa",
      email: "wes@sospet.com.br",
      password: "MinhaSenh@123",
      confirm: "SenhaErrada456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs.some((m) => m.includes("coincidem"))).toBe(true);
    }
  });

  it("rejeita nome com menos de 2 caracteres", () => {
    const result = registerSchema.safeParse({
      full_name: "W",
      email: "wes@sospet.com.br",
      password: "MinhaSenh@123",
      confirm: "MinhaSenh@123",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita e-mail inválido no registro", () => {
    const result = registerSchema.safeParse({
      full_name: "Wesley Costa",
      email: "invalido",
      password: "MinhaSenh@123",
      confirm: "MinhaSenh@123",
    });
    expect(result.success).toBe(false);
  });
});

// ── forgotPasswordSchema ──────────────────────────────────────

describe("forgotPasswordSchema — Recuperar senha", () => {
  it("aceita e-mail válido", () => {
    const result = forgotPasswordSchema.safeParse({ email: "wes@sospet.com.br" });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const result = forgotPasswordSchema.safeParse({ email: "nao-email" });
    expect(result.success).toBe(false);
  });
});

// ── parseFormData ─────────────────────────────────────────────

describe("parseFormData — helper de Server Action", () => {
  it("extrai dados válidos do FormData", () => {
    const fd = new FormData();
    fd.append("email", "wes@sospet.com.br");
    fd.append("password", "senhaValida");

    const result = parseFormData(loginSchema, fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("wes@sospet.com.br");
    }
  });

  it("retorna erros estruturados quando dados são inválidos", () => {
    const fd = new FormData();
    fd.append("email", "nao-eh-email");
    fd.append("password", "senha");

    const result = parseFormData(loginSchema, fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveProperty("email");
    }
  });
});
