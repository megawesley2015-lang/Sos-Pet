/**
 * Testes — GET /api/pets/lost-active
 *
 * Cobre: rate limiting, filtros kind=lost + status=active,
 * colunas seguras (sem contact_*), resposta de sucesso e erro.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimitHeaders: vi.fn().mockReturnValue({ "x-ratelimit-limit": "30" }),
}));

const mockLimit = vi.fn();
const mockBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: mockLimit,
};
// Cada método da chain devolve o mesmo builder (fluent API)
mockBuilder.select.mockReturnValue(mockBuilder);
mockBuilder.eq.mockReturnValue(mockBuilder);
mockBuilder.order.mockReturnValue(mockBuilder);

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => mockBuilder),
  })),
}));

// ── Imports após mocks ────────────────────────────────────────────────────────

import { GET } from "@/app/api/pets/lost-active/route";
import { checkRateLimit } from "@/lib/rate-limit";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(url = "http://localhost/api/pets/lost-active"): NextRequest {
  return new NextRequest(url);
}

const mockRlAllowed = { allowed: true, remaining: 29, reset: Date.now() + 60000 };
const mockRlBlocked = { allowed: false, remaining: 0, reset: Date.now() + 60000 };

const mockPets = [
  { id: "uuid-1", name: "Mel", species: "dog", city: "Santos", neighborhood: "Gonzaga", photo_url: null },
  { id: "uuid-2", name: "Bolinha", species: "cat", city: "Guarujá", neighborhood: null, photo_url: "https://example.com/bolinha.jpg" },
];

// ── Testes ────────────────────────────────────────────────────────────────────

describe("GET /api/pets/lost-active", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockRlAllowed);
  });

  it("retorna lista de pets quando rate limit permite", async () => {
    mockLimit.mockResolvedValue({ data: mockPets, error: null });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.pets).toHaveLength(2);
    expect(body.data.pets[0].name).toBe("Mel");
  });

  it("retorna 429 quando rate limit esgotado", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockRlBlocked);

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.code).toBe("RATE_LIMITED");
  });

  it("o SELECT não inclui contact_name, contact_phone ou contact_whatsapp", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    await GET(makeReq());

    const selectArg: string = mockBuilder.select.mock.calls[0][0];
    expect(selectArg).not.toContain("contact_name");
    expect(selectArg).not.toContain("contact_phone");
    expect(selectArg).not.toContain("contact_whatsapp");
  });

  it("filtra apenas kind=lost", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    await GET(makeReq());

    const eqCalls = mockBuilder.eq.mock.calls;
    const kindCall = eqCalls.find(([col]: [string]) => col === "kind");
    expect(kindCall).toBeDefined();
    expect(kindCall![1]).toBe("lost");
  });

  it("filtra apenas status=active", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    await GET(makeReq());

    const eqCalls = mockBuilder.eq.mock.calls;
    const statusCall = eqCalls.find(([col]: [string]) => col === "status");
    expect(statusCall).toBeDefined();
    expect(statusCall![1]).toBe("active");
  });

  it("retorna array vazio quando não há pets perdidos ativos", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.pets).toEqual([]);
  });

  it("retorna erro quando Supabase falha", async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: "conexão recusada", code: "500" } });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it("aplica limit de 200 registros na query", async () => {
    mockLimit.mockResolvedValue({ data: mockPets, error: null });

    await GET(makeReq());

    expect(mockLimit).toHaveBeenCalledWith(200);
  });
});
