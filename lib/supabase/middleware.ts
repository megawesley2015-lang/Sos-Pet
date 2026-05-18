/**
 * Helper do Supabase para uso DENTRO do middleware.ts (root).
 *
 * Por que existe: Server Components não podem setar cookies durante render.
 * O middleware é o lugar canônico pra refrescar o token de auth e propagar
 * o cookie atualizado pra próxima request.
 *
 * Referência: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    // unsafe-eval necessário pro Next.js (hydration) e Leaflet
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://vercel.live https://*.vercel-scripts.com https://unpkg.com",
    "style-src 'self' 'unsafe-inline'",
    // blob: para preview local de foto antes do upload
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    // Supabase REST + Realtime, Sentry, Nominatim, Vercel insights
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://*.sentry.io https://sentry.io https://vitals.vercel-insights.com https://vercel.live https://unpkg.com",
    // Leaflet usa blob workers
    "worker-src 'self' blob:",
    // Turnstile (captcha) roda em iframe
    "frame-src https://challenges.cloudflare.com https://vercel.live",
    "base-uri 'self'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  // SAMEORIGIN em vez de DENY para não quebrar iframes próprios (ex: preview de mapa)
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // geolocation=* habilita GPS nos formulários de cadastro
  "Permissions-Policy": "geolocation=*, camera=(), microphone=()",
  "X-XSS-Protection": "0",
};

function addSecurityHeaders(response: NextResponse, request: NextRequest) {
  Object.entries(SECURITY_HEADERS).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  return response;
}

/**
 * Rotas que exigem usuário autenticado. Tudo fora dessa lista é público.
 * Usar matchers genéricos — middleware.ts faz o gate fino.
 */
const PROTECTED_PATHS = [
  "/meus-pets",
  "/perfil",
  "/resgate",
  "/prestadores/novo",
  "/dashboard-prestador",
  "/admin",
  "/ong",
];
const PROTECTED_PATTERNS = [
  /^\/pets\/[^/]+\/editar/,
  /^\/prestadores\/[^/]+\/editar/,
];

function isProtected(pathname: string): boolean {
  if (PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return PROTECTED_PATTERNS.some((re) => re.test(pathname));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  response = addSecurityHeaders(response, request);

  // Propaga o pathname atual via header para Server Components que precisam dele
  // (ex: ONG layout que precisa detectar se está em /ong/cadastro para evitar loop)
  response.headers.set("x-pathname", request.nextUrl.pathname);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          response = addSecurityHeaders(response, request);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: getUser() valida o JWT contra o servidor.
  // Não usar getSession() aqui — só lê o cookie sem validar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Auth gate: se rota protegida e sem user, manda pro login com redirect
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(url);
    return addSecurityHeaders(redirectResponse, request);
  }

  // Se logado e tentando acessar /login ou /registro, manda pra /pets
  if (
    user &&
    (pathname === "/login" || pathname === "/registro")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/pets";
    const redirectResponse = NextResponse.redirect(url);
    return addSecurityHeaders(redirectResponse, request);
  }

  return response;
}
