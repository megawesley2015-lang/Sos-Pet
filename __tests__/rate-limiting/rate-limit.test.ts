/**
 * Testes — lib/rate-limit.ts
 *
 * Cobre: checkInMemory, rateLimitHeaders, getClientIp
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  checkInMemory,
  rateLimitHeaders,
  getClientIp,
} from "@/lib/rate-limit";
import type { RateLimitConfig, RateLimitResult } from "@/lib/rate-limit";

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return `test-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function makeRequest(headers: Record<string, string>): Request {
  return new Request("https://example.com/api", { headers });
}

// Garante que timers reais sejam restaurados após cada suite com fake timers
afterEach(() => {
  vi.useRealTimers();
});

// ── checkInMemory ─────────────────────────────────────────────────────────────

describe("checkInMemory", () => {
  const cfg: RateLimitConfig = { limit: 3, windowMs: 60_000 };

  it("permite o primeiro request e retorna remaining correto", () => {
    const r = checkInMemory(uid(), cfg);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2); // limit - 1
  });

  it("permite até o limite exato (3/3)", () => {
    const key = uid();
    const r1 = checkInMemory(key, cfg);
    const r2 = checkInMemory(key, cfg);
    const r3 = checkInMemory(key, cfg);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("bloqueia ao exceder o limite (4º request)", () => {
    const key = uid();
    checkInMemory(key, cfg); // 1
    checkInMemory(key, cfg); // 2
    checkInMemory(key, cfg); // 3 — último permitido
    const blocked = checkInMemory(key, cfg); // 4 — bloqueado

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it("requests bloqueados consecutivos mantêm remaining = 0", () => {
    const key = uid();
    checkInMemory(key, cfg);
    checkInMemory(key, cfg);
    checkInMemory(key, cfg);

    const b1 = checkInMemory(key, cfg);
    const b2 = checkInMemory(key, cfg);

    expect(b1.allowed).toBe(false);
    expect(b2.allowed).toBe(false);
    expect(b2.remaining).toBe(0);
  });

  it("reseta após a janela expirar", () => {
    vi.useFakeTimers();
    const START = 1_700_000_000_000; // timestamp fixo (não conflita com store real)
    vi.setSystemTime(START);

    const key = `window-reset-${Math.random()}`;
    checkInMemory(key, cfg); // 1
    checkInMemory(key, cfg); // 2
    checkInMemory(key, cfg); // 3 — limite
    const blocked = checkInMemory(key, cfg); // 4 — bloqueado
    expect(blocked.allowed).toBe(false);

    // Avança além da janela
    vi.setSystemTime(START + 61_000);

    const fresh = checkInMemory(key, cfg);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(2); // limit - 1
  });
});

// ── rateLimitHeaders ──────────────────────────────────────────────────────────

describe("rateLimitHeaders", () => {
  it("retorna apenas X-RateLimit-Remaining quando permitido", () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 7,
      resetAt: Date.now() + 60_000,
    };
    const headers = rateLimitHeaders(result);

    expect(headers["X-RateLimit-Remaining"]).toBe("7");
    expect(headers["Retry-After"]).toBeUndefined();
  });

  it("retorna remaining = 0 quando no limite mas ainda permitido", () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    };
    const headers = rateLimitHeaders(result);
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    expect(headers["Retry-After"]).toBeUndefined();
  });

  it("retorna X-RateLimit-Remaining + Retry-After quando bloqueado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_700_000_000_000);

    const resetAt = 1_700_000_000_000 + 30_000; // 30s no futuro
    const result: RateLimitResult = { allowed: false, remaining: 0, resetAt };
    const headers = rateLimitHeaders(result);

    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    expect(Number(headers["Retry-After"])).toBe(30);
  });

  it("Retry-After arredonda para cima (Math.ceil)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_700_000_000_000);

    const resetAt = 1_700_000_000_000 + 30_500; // 30.5s — deve arredondar para 31
    const result: RateLimitResult = { allowed: false, remaining: 0, resetAt };
    const headers = rateLimitHeaders(result);

    expect(Number(headers["Retry-After"])).toBe(31);
  });
});

// ── getClientIp ───────────────────────────────────────────────────────────────

describe("getClientIp", () => {
  it("prefere x-vercel-forwarded-for sobre os demais", () => {
    const req = makeRequest({
      "x-vercel-forwarded-for": "1.2.3.4",
      "x-real-ip": "5.6.7.8",
      "x-forwarded-for": "9.10.11.12",
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("usa x-real-ip quando x-vercel-forwarded-for ausente", () => {
    const req = makeRequest({
      "x-real-ip": "5.6.7.8",
      "x-forwarded-for": "9.10.11.12, 13.14.15.16",
    });
    expect(getClientIp(req)).toBe("5.6.7.8");
  });

  it("usa primeiro IP de x-forwarded-for quando os anteriores ausentes", () => {
    const req = makeRequest({
      "x-forwarded-for": "9.10.11.12, 13.14.15.16",
    });
    expect(getClientIp(req)).toBe("9.10.11.12");
  });

  it("retorna 'unknown' quando nenhum header presente", () => {
    const req = makeRequest({});
    expect(getClientIp(req)).toBe("unknown");
  });
});
