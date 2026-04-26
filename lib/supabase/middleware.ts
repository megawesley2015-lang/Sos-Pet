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

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Rotas que exigem usuário autenticado. Tudo fora dessa lista é público.
 * Usar matchers genéricos — middleware.ts faz o gate fino.
 */
const PROTECTED_PATHS = [
  "/meus-pets",
  "/perfil",
  "/pets/novo",
  "/resgate",
  "/prestadores/novo",
  "/dashboard-prestador",
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

  const supabase = createServerClient(
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
    return NextResponse.redirect(url);
  }

  // Se logado e tentando acessar /login ou /registro, manda pra /pets
  if (
    user &&
    (pathname === "/login" || pathname === "/registro")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/pets";
    return NextResponse.redirect(url);
  }

  return response;
}
