import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Heart, MapPin, ShieldCheck,
  Syringe, Phone, Mail, AlertTriangle,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { AdoptionInterestForm } from "@/components/adocao/AdoptionInterestForm";

const SPECIES_LABEL: Record<string, string> = {
  dog: "Cachorro", cat: "Gato", other: "Animal",
};
const SIZE_LABEL: Record<string, string> = {
  small: "Pequeno", medium: "Médio", large: "Grande",
};
const SEX_LABEL: Record<string, string> = {
  male: "Macho", female: "Fêmea", unknown: "Não informado",
};
const HEALTH_LABEL: Record<string, string> = {
  healthy: "Saudável", recovering: "Em recuperação",
  critical: "Cuidados especiais", treated: "Tratado",
};

export async function generateMetadata({ params }: { params: { petId: string } }) {
  const supabase = createServiceClient();
  const { data: pet } = await supabase
    .from("shelter_pets")
    .select("name, species, description")
    .eq("id", params.petId)
    .eq("status", "available")
    .maybeSingle();

  if (!pet) return { title: "Animal não encontrado | SOS Pet Aumigo" };

  return {
    title: `${pet.name ?? SPECIES_LABEL[pet.species] ?? "Animal"} para adoção | SOS Pet Aumigo`,
    description: pet.description ?? `${SPECIES_LABEL[pet.species]} disponível para adoção.`,
  };
}

export default async function AdotarPetPage({ params }: { params: { petId: string } }) {
  const supabase = createServiceClient();

  type PetRow = {
    id: string; name: string | null; species: string; breed: string | null;
    color: string; size: string; sex: string; estimated_age: string | null;
    health_status: string; behavior: string | null; description: string | null;
    photo_url: string | null; is_castrated: boolean; rescue_date: string;
    shelter_id: string;
  };

  const { data: petRaw } = await supabase
    .from("shelter_pets")
    .select("id, name, species, breed, color, size, sex, estimated_age, health_status, behavior, description, photo_url, is_castrated, rescue_date, shelter_id")
    .eq("id", params.petId)
    .eq("status", "available")
    .maybeSingle();

  if (!petRaw) notFound();
  const pet = petRaw as PetRow;

  type ShelterRow = {
    id: string; name: string; type: string; city: string;
    neighborhood: string | null; phone: string; email: string | null;
    logo_url: string | null; description: string | null;
  };

  type VacinaRow = {
    vaccine_name: string;
    applied_at: string | null;
    next_due_at: string | null;
    notes: string | null;
  };

  // shelter depende de pet.shelter_id, mas vacinas só precisa de petId — paralelo
  const [{ data: shelterRaw }, { data: vacinasRaw }] = await Promise.all([
    supabase
      .from("shelters")
      .select("id, name, type, city, neighborhood, phone, email, logo_url, description")
      .eq("id", pet.shelter_id)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("pet_vaccinations")
      .select("vaccine_name, applied_at, next_due_at, notes")
      .eq("pet_id", params.petId)
      .order("applied_at", { ascending: false })
      .limit(10),
  ]);

  const shelter = shelterRaw as ShelterRow | null;
  const vacinas = vacinasRaw as VacinaRow[] | null;

  const displayName = pet.name ?? SPECIES_LABEL[pet.species] ?? "Sem nome";

  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-warm-50 pb-20">
        {/* Breadcrumb */}
        <div className="border-b border-warm-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-2 text-sm text-fg-muted">
            <Link href="/adotar" className="flex items-center gap-1 hover:text-brand-600">
              <ArrowLeft className="h-3.5 w-3.5" />
              Adoção
            </Link>
            <span>/</span>
            <span className="truncate font-medium text-fg">{displayName}</span>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 pt-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

            {/* Coluna esquerda — foto + info */}
            <div className="space-y-6">
              {/* Foto */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-warm-100">
                {pet.photo_url ? (
                  <Image
                    src={pet.photo_url}
                    alt={displayName}
                    fill
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-7xl">
                    {pet.species === "dog" ? "🐶" : pet.species === "cat" ? "🐱" : "🐾"}
                  </div>
                )}
              </div>

              {/* Detalhes */}
              <div className="rounded-2xl border border-warm-200 bg-white p-6">
                <h1 className="font-display text-2xl font-black text-fg sm:text-3xl">
                  {displayName}
                </h1>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{SPECIES_LABEL[pet.species]}</Badge>
                  {pet.breed && <Badge>{pet.breed}</Badge>}
                  {pet.size && <Badge>{SIZE_LABEL[pet.size]}</Badge>}
                  {pet.sex && pet.sex !== "unknown" && <Badge>{SEX_LABEL[pet.sex]}</Badge>}
                  {pet.estimated_age && <Badge>{pet.estimated_age}</Badge>}
                  {pet.is_castrated && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent-text">
                      <ShieldCheck className="h-3 w-3" />
                      Castrado
                    </span>
                  )}
                  {pet.health_status && (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      pet.health_status === "healthy"
                        ? "bg-green-100 text-green-700"
                        : "bg-brand-100 text-brand-700"
                    }`}>
                      {HEALTH_LABEL[pet.health_status]}
                    </span>
                  )}
                </div>

                {/* Descrição */}
                {pet.description && (
                  <p className="mt-4 leading-relaxed text-fg-muted">{pet.description}</p>
                )}

                {/* Comportamento */}
                {pet.behavior && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">
                      Comportamento
                    </p>
                    <p className="mt-1 text-sm text-fg">{pet.behavior}</p>
                  </div>
                )}
              </div>

              {/* Vacinas */}
              {vacinas && vacinas.length > 0 && (
                <div className="rounded-2xl border border-warm-200 bg-white p-6">
                  <h2 className="flex items-center gap-2 font-display text-base font-bold text-fg">
                    <Syringe className="h-4 w-4 text-brand-500" />
                    Histórico de vacinação
                  </h2>
                  <ul className="mt-4 space-y-2">
                    {vacinas.map((v, i) => (
                      <li key={i} className="flex items-center justify-between rounded-xl border border-warm-100 bg-warm-50 px-4 py-2.5 text-sm">
                        <span className="font-medium text-fg">{v.vaccine_name}</span>
                        <span className="text-xs text-fg-muted">
                          {v.applied_at
                            ? new Date(v.applied_at).toLocaleDateString("pt-BR")
                            : "—"}
                          {v.next_due_at && (
                            <> · próxima {new Date(v.next_due_at).toLocaleDateString("pt-BR")}</>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-fg-muted">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-brand-400" />
                    Informações fornecidas pela ONG responsável. Sempre consulte um veterinário.
                  </p>
                </div>
              )}
            </div>

            {/* Coluna direita — ONG + formulário */}
            <div className="space-y-5">
              {/* Card da ONG */}
              {shelter && (
                <div className="rounded-2xl border border-warm-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    {shelter.logo_url ? (
                      <Image
                        src={shelter.logo_url}
                        alt={shelter.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-xl">
                        🏠
                      </div>
                    )}
                    <div>
                      <p className="font-display text-sm font-bold text-fg">{shelter.name}</p>
                      <p className="flex items-center gap-1 text-xs text-fg-muted">
                        <MapPin className="h-3 w-3" />
                        {shelter.neighborhood
                          ? `${shelter.neighborhood}, ${shelter.city}`
                          : shelter.city}
                      </p>
                    </div>
                  </div>

                  {shelter.description && (
                    <p className="mt-3 text-xs leading-relaxed text-fg-muted">
                      {shelter.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-2">
                    {shelter.phone && (
                      <a
                        href={`https://wa.me/55${shelter.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-400"
                      >
                        <Phone className="h-4 w-4" />
                        Falar via WhatsApp
                      </a>
                    )}
                    {shelter.email && (
                      <a
                        href={`mailto:${shelter.email}?subject=Interesse em adotar ${displayName}`}
                        className="flex items-center gap-2 rounded-xl border border-warm-200 px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-warm-100"
                      >
                        <Mail className="h-4 w-4" />
                        Enviar e-mail
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Formulário de interesse */}
              <div className="rounded-2xl border border-warm-200 bg-white p-5">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-fg">
                  <Heart className="h-4 w-4 text-brand-500" />
                  Tenho interesse em adotar
                </h2>
                <p className="mt-1 text-xs text-fg-muted">
                  Deixe seus dados e a ONG entrará em contato.
                </p>
                <AdoptionInterestForm
                  petId={pet.id}
                  petName={displayName}
                  shelterId={pet.shelter_id}
                  shelterEmail={shelter?.email ?? null}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-warm-200 bg-warm-50 px-3 py-1 text-xs font-medium text-fg-muted">
      {children}
    </span>
  );
}
