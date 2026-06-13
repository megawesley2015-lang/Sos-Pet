/**
 * Testes — GET /api/ong/available-pets
 *
 * Cobre: autenticação obrigatória, shelter não encontrado,
 * rate limiting, retorno de pets disponíveis, select mínimo.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("10.0.0.1"),
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/auth/safe", () => ({
  getUserSafe: vi.fn(),
}));

// Builder fluent reutilizável para cada chamada .from()
function makeBuilder(result: unknown) {
  const b = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
  };
  b.select.mockReturnValue(b);
  b.eq.mockReturnValue(b);
  b.order.mockReturnValue(b);
  b.maybeSingle.mockResolvedValue(result);
  return b;
}

let shelterBuilder: ReturnType<typeof makeBuilder>;
let petsBuilder: ReturnType<typeof makeBuilder>;
let callCount = 0;

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === "shelters") return shelterBuilder;
      return petsBuilder;
    }),
  })),
}));

import { GET } from "@/app/api/ong/available-pets/route";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserSafe } from "@/lib/auth/safe";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(): NextRequest {
  return new NextRequest("http://localhost/api/ong/available-pets");
}

const mockRlOk = { allowed: true, remaining: 59, reset: Date.now() + 60000 };
const mockRlBlocked = { allowed: false, remaining: 0, reset: Date.now() + 60000 };
const mockUser = { id: "user-uuid-1", email: "ong@example.com" };
const mockShelter = { id: "shelter-uuid-1" };
const mockPets = [
  { id: "pet-1", name: "Caramelo", species: "dog" },
  { id: "pet-2", name: "Mia", species: "cat" },
];

// ── Testes ────────────────────────────────────────────────────────────────────

describe("GET /api/ong/available-pets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callCount = 0;
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockRlOk);
    (getUserSafe as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    shelterBuilder = makeBuilder({ data: mockShelter, error: null });
    petsBuilder = makeBuilder({ data: mockPets, error: null });
    // order retorna a promessa final de pets
    petsBuilder.order.mockResolvedValue({ data: mockPets, error: null });
  });

  it("retorna 429 quando rate limit esgotado", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockRlBlocked);

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.code).toBe("RATE_LIMITED");
  });

  it("retorna erro quando usuário não está autenticado", async () => {
    (getUserSafe as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it("retorna pets=[] quando shelter não encontrado para o usuário", async () => {
    shelterBuilder = makeBuilder({ data: null, error: null });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.pets).toEqual([]);
  });

  it("retorna lista de pets disponíveis quando shelter existe", async () => {
    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.pets).toHaveLength(2);
    expect(body.data.pets[0].name).toBe("Caramelo");
  });

  it("o SELECT de pets inclui apenas id, name, species (sem dados sensíveis)", async () => {
    await GET(makeReq());

    const selectArg: string = petsBuilder.select.mock.calls[0][0];
    expect(selectArg).toBe("id, name, species");
    expect(selectArg).not.toContain("contact");
    expect(selectArg).not.toContain("owner");
  });

  it("filtra pets por shelter_id do usuário autenticado", async () => {
    await GET(makeReq());

    const eqCalls = petsBuilder.eq.mock.calls;
    const shelterIdCall = eqCalls.find(([col]: [string]) => col === "shelter_id");
    expect(shelterIdCall).toBeDefined();
    expect(shelterIdCall![1]).toBe(mockShelter.id);
  });

  it("filtra apenas status=available", async () => {
    await GET(makeReq());

    const eqCalls = petsBuilder.eq.mock.calls;
    const statusCall = eqCalls.find(([col]: [string]) => col === "status");
    expect(statusCall).toBeDefined();
    expect(statusCall![1]).toBe("available");
  });
});
