import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, ShieldCheck, Search } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";

export const metadata = {
  title: "Adoção | SOS Pet Aumigo",
  description:
    "Encontre seu novo companheiro. Animais disponíveis para adoção em ONGs e protetores da Baixada Santista.",
  alternates: { canonical: "/adotar" },
};

export const dynamic = "force-dynamic";

const SPECIES_LABEL: Record<string, string> = {
  dog: "Cachorro",
  cat: "Gato",
  other: "Animal",
};

const SPECIES_ICON: Record<string, string> = {
  dog: "🐶",
  cat: "🐱",
  other: "🐾",
};

const SIZE_LABEL: Record<string, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
};

const SEX_LABEL: Record<string, string> = {
  male: "Macho",
  female: "Fêmea",
  unknown: "Não informado",
};

interface SearchParams {
  species?: string;
  city?: string;
}

async function PetGrid({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createServiceClient();

  let query = supabase
    .from("shelter_pets")
    .select(`
      id, name, species, breed, color, size, sex,
      estimated_age, health_status, description,
      photo_url, is_castrated, shelter_id,
      shelters ( id, name, city, neighborhood, logo_url )
    `)
    .eq("status", "available")
    .order("rescue_date", { ascending: false })
    .limit(60);

  if (searchParams.species) {
    query = query.eq("species", searchParams.species);
  }

  const { data: pets } = await query;

  if (!pets || pets.length === 0) {
    return (
      <div className="py-20 text-center text-fg-muted">
        <p className="text-4xl">🐾</p>
        <p className="mt-4 font-display text-xl font-bold text-fg">
          Nenhum animal disponível no momento
        </p>
        <p className="mt-2 text-sm">
          Novas ONGs e protetores se cadastram frequentemente. Volte em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {pets.map((pet) => {
        const shelter = pet.shelters as {
          id: string; name: string; city: string;
          neighborhood: string | null; logo_url: string | null;
        } | null;

        return (
          <Link
            key={pet.id}
            href={`/adotar/${pet.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-warm-200 bg-white shadow-warm-card transition-all hover:border-brand-200 hover:shadow-warm-hover"
          >
            {/* Foto */}
            <div className="relative h-48 bg-warm-100">
              {pet.photo_url ? (
                <Image
                  src={pet.photo_url}
                  alt={pet.name ?? SPECIES_LABEL[pet.species] ?? "Animal"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl">
                  {SPECIES_ICON[pet.species] ?? "🐾"}
                </div>
              )}
              {/* Badge castrado */}
              {pet.is_castrated && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-accent-text shadow-sm">
                  <ShieldCheck className="h-3 w-3" />
                  Castrado
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <h3 className="truncate font-display text-base font-bold text-fg">
                {pet.name ?? SPECIES_LABEL[pet.species] ?? "Sem nome"}
              </h3>

              <p className="text-xs text-fg-muted">
                {[
                  SPECIES_LABEL[pet.species],
                  pet.breed,
                  SIZE_LABEL[pet.size],
                  SEX_LABEL[pet.sex],
                  pet.estimated_age,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              {shelter && (
                <p className="mt-auto flex items-center gap-1 pt-2 text-xs text-fg-muted">
                  <MapPin className="h-3 w-3 shrink-0 text-brand-500" />
                  <span className="truncate">
                    {shelter.name} · {shelter.city}
                  </span>
                </p>
              )}
            </div>

            <div className="border-t border-warm-100 px-4 py-2.5">
              <span className="text-xs font-semibold text-brand-600 group-hover:text-brand-500">
                Ver detalhes e adotar →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default async function AdotarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-warm-50">
        {/* Hero */}
        <section className="border-b border-warm-200/80 bg-white px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-700">
              <Heart className="h-3 w-3" />
              Adoção responsável
            </span>
            <h1 className="mt-4 font-display text-3xl font-black text-fg sm:text-4xl">
              Encontre seu novo{" "}
              <span className="text-brand-500">companheiro</span>
            </h1>
            <p className="mt-3 text-fg-muted">
              Animais resgatados por ONGs e protetores da Baixada Santista,
              prontos para um lar cheio de amor.
            </p>

            {/* Filtro rápido por espécie */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                { label: "Todos", value: "" },
                { label: "🐶 Cachorros", value: "dog" },
                { label: "🐱 Gatos", value: "cat" },
                { label: "🐾 Outros", value: "other" },
              ].map(({ label, value }) => (
                <Link
                  key={value}
                  href={value ? `/adotar?species=${value}` : "/adotar"}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    (searchParams.species ?? "") === value
                      ? "bg-brand-500 text-white shadow-glow-brand"
                      : "border border-warm-200 bg-white text-fg-muted hover:border-brand-300 hover:text-brand-600"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <Suspense
            fallback={
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-2xl bg-warm-200"
                  />
                ))}
              </div>
            }
          >
            <PetGrid searchParams={searchParams} />
          </Suspense>
        </section>

        {/* CTA para ONGs */}
        <section className="border-t border-warm-200 bg-white px-4 py-12 text-center">
          <p className="text-sm text-fg-muted">
            É uma ONG ou protetor e quer cadastrar seus animais?
          </p>
          <Link
            href="/ong/cadastro"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/40 px-5 py-2 text-sm font-bold text-accent-text transition-colors hover:bg-accent/10"
          >
            Cadastrar minha ONG gratuitamente →
          </Link>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
