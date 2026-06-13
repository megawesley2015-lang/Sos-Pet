/**
 * Testes — GET /api/user/export-data (LGPD art. 18)
 *
 * Cobre: autenticação obrigatória, rate limiting restritivo (2/hora),
 * estrutura do payload exportado, contact_* incluídos APENAS para o dono.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("192.168.1.1"),
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockPetsOrder = vi.fn();

// Builder fluent para profiles
const profileBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: mockProfileSingle,
};

// Builder fluent para pets
const petsBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: mockPetsOrder,
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") return profileBuilder;
      return petsBuilder;
    }),
  })),
}));

import { GET } from "@/app/api/user/export-data/route";
import { checkRateLimit } from "@/lib/rate-limit";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(): NextRequest {
  return new NextRequest("http://localhost/api/user/export-data");
}

const mockUser = { id: "user-uuid", email: "tutor@example.com" };
const mockProfile = { id: "user-uuid", full_name: "João Tutor", phone: "13999990000", role: "tutor" };
const mockPets = [
  {
    id: "pet-1", name: "Mel", kind: "lost", status: "active",
    contact_name: "João", contact_phone: "13999990000", contact_whatsapp: true,
    owner_id: "user-uuid",
  },
];

const mockRlOk = { allowed: true, remaining: 1, reset: Date.now() + 3600000 };
const mockRlBlocked = { allowed: false, remaining: 0, reset: Date.now() + 3600000 };

// ── Testes ────────────────────────────────────────────────────────────────────

describe("GET /api/user/export-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockRlOk);
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockProfileSingle.mockResolvedValue({ data: mockProfile, error: null });
    mockPetsOrder.mockResolvedValue({ data: mockPets, error: null });
  });

  it("retorna 429 quando rate limit de 2/hora esgotado", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockRlBlocked);

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.code).toBe("RATE_LIMITED");
  });

  it("retorna erro quando usuário não está autenticado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).not.toBe(200);
    expect(body.success).toBe(false);
  });

  it("retorna payload LGPD com campos obrigatórios quando autenticado", async () => {
    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("exported_at");
    expect(body.data).toHaveProperty("email", mockUser.email);
    expect(body.data).toHaveProperty("profile");
    expect(body.data).toHaveProperty("pets");
  });

  it("exported_at é uma string ISO 8601 válida", async () => {
    const res = await GET(makeReq());
    const body = await res.json();

    const date = new Date(body.data.exported_at);
    expect(date.getTime()).not.toBeNaN();
    expect(body.data.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("inclui contact_name e contact_phone nos pets exportados (dono vê seus próprios dados)", async () => {
    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.data.pets).toHaveLength(1);
    expect(body.data.pets[0]).toHaveProperty("contact_name");
    expect(body.data.pets[0]).toHaveProperty("contact_phone");
  });

  it("pets é array vazio quando usuário não tem pets cadastrados", async () => {
    mockPetsOrder.mockResolvedValue({ data: [], error: null });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.data.pets).toEqual([]);
  });

  it("profile é null quando não encontrado no banco", async () => {
    mockProfileSingle.mockResolvedValue({ data: null, error: null });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.profile).toBeNull();
  });

  it("filtra pets por owner_id do usuário autenticado", async () => {
    await GET(makeReq());

    const eqCalls = petsBuilder.eq.mock.calls;
    const ownerCall = eqCalls.find(([col]: [string]) => col === "owner_id");
    expect(ownerCall).toBeDefined();
    expect(ownerCall![1]).toBe(mockUser.id);
  });
});
