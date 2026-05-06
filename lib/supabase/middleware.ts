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

const isDev = process.env.NODE_ENV !== "production";

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    // unsafe-inline necessário para Next.js inline scripts; unsafe-eval apenas em dev
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live`,
    // Supabase fetch/websocket + Google Analytics + Vercel Live toolbar
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com",
    "img-src 'self' https: data: blob:",
    // Leaflet tiles precisam de tiles.stadiamaps e similares
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
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
