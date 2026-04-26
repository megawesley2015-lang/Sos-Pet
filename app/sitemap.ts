import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/utils/url";

/**
 * sitemap.xml dinâmico — lista rotas estáticas + pets ativos + prestadores.
 *
 * Next chama isto no build e em tempo de request. Em prod (Vercel) é cacheado.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const now = new Date();

  // Rotas estáticas (públicas)
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/pets`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/prestadores`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/dicas`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/parcerias`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/termos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Rotas dinâmicas — pets ativos + prestadores ativos
  // Catch + return parcial: se o Supabase falhar, sitemap continua útil
  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: petsRaw }, { data: prestadoresRaw }] = await Promise.all([
      supabase
        .from("pets")
        .select("id, updated_at")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1000),
      supabase
        .from("prestadores")
        .select("slug, updated_at")
        .eq("status", "ativo")
        .order("updated_at", { ascending: false })
        .limit(1000),
    ]);

    type PetSlim = { id: string; updated_at: string };
    type ProviderSlim = { slug: string; updated_at: string };
    const pets = (petsRaw as PetSlim[] | null) ?? [];
    const prestadores = (prestadoresRaw as ProviderSlim[] | null) ?? [];

    const petRoutes: MetadataRoute.Sitemap = pets.map((p) => ({
      url: `${base}/pets/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const providerRoutes: MetadataRoute.Sitemap = prestadores.map((p) => ({
      url: `${base}/prestadores/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...petRoutes, ...providerRoutes];
  } catch {
    return staticRoutes;
  }
}
