"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Loader2, MapPin, Navigation } from "lucide-react";
import { registrarAvistamento } from "../actions";
import type { SightingFormState } from "../actions";

const initialState: SightingFormState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-danger">{errors[0]}</p>;
}

/**
 * /avistamentos/novo — Formulário público (sem login).
 *
 * Aceita ?pet=<uuid> para pré-selecionar o pet.
 * Geolocalização via navigator.geolocation + Nominatim reverse geocoding.
 */
export default function NovoAvistamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const [state, action, isPending] = useActionState(registrarAvistamento, initialState);

  const [petId, setPetId] = useState("");
  const [pets, setPets] = useState<{ id: string; name: string | null; species: string }[]>([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [address, setAddress] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const successRef = useRef(false);

  useEffect(() => {
    // Pré-seleciona pet se veio por querystring
    searchParams.then((p) => {
      if (p.pet) setPetId(p.pet);
    });

    // Busca pets perdidos ativos para o select
    fetch("/api/pets/lost-active")
      .then((r) => r.json())
      .then((d) => setPets(d.pets ?? []))
      .catch(() => {});
  }, [searchParams]);

  // Geolocalização automática
  function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoError("Seu navegador não suporta geolocalização.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));

        // Reverse geocoding via Nominatim (gratuito, sem API key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`,
            { headers: { "User-Agent": "SOSPet/1.0 (sospet.app)" } }
          );
          const data = await res.json();
          if (data.display_name) {
            // Extrai trecho curto: rua + bairro + cidade
            const addr = data.address ?? {};
            const parts = [
              addr.road,
              addr.suburb ?? addr.neighbourhood,
              addr.city ?? addr.town ?? addr.village,
            ].filter(Boolean);
            setAddress(parts.join(", ") || data.display_name.split(",").slice(0, 3).join(","));
          }
        } catch {
          // reverse geocoding falhou — tudo bem, coordenadas já estão salvas
        }

        setGeoLoading(false);
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? "Permissão de localização negada. Preencha o endereço manualmente."
            : "Não conseguimos obter sua localização. Preencha manualmente."
        );
        setGeoLoading(false);
      },
      { timeout: 10_000, enableHighAccuracy: true }
    );
  }

  const SPECIES_EMOJI: Record<string, string> = { dog: "🐶", cat: "🐱", other: "🐾" };

  if (state.success && !successRef.current) {
    successRef.current = true;
  }

  return (
    <div className="min-h-screen bg-bg" data-theme="light">
      {/* Header fixo */}
      <header className="sticky top-0 z-40 border-b border-warm-200 bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/avistamentos" className="rounded-lg p-2 text-fg-muted hover:bg-warm-100 hover:text-fg">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-display text-sm font-bold text-fg">Reportar avistamento</span>
          <span className="ml-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
            Sem login
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-6">
        {state.success ? (
          /* ── Sucesso ── */
          <div className="flex flex-col items-center gap-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/15 text-3xl">
              👀
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-fg">Avistamento registrado!</h2>
              <p className="mt-2 text-sm text-fg-muted">
                Obrigado por ajudar. O tutor do pet será notificado.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/avistamentos/novo"
                className="rounded-xl border border-warm-200 bg-warm-50 px-5 py-2.5 text-sm font-medium text-fg-muted hover:bg-warm-100"
              >
                Reportar outro
              </Link>
              <Link
                href="/pets"
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-400"
              >
                Ver pets na rede
              </Link>
            </div>
          </div>
        ) : (
          /* ── Formulário ── */
          <>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-fg">Onde você viu?</h1>
              <p className="mt-1 text-sm text-fg-muted">
                Qualquer informação ajuda o tutor a encontrar seu pet. Não precisa de conta.
              </p>
            </div>

            {state.error && (
              <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {state.error}
              </div>
            )}

            <form action={action} className="space-y-5">
              {/* Hidden: lat/lng */}
              <input type="hidden" name="lat" value={lat} />
              <input type="hidden" name="lng" value={lng} />

              {/* Pet */}
              <section className="rounded-xl border border-warm-200 bg-warm-50 p-5">
                <h2 className="mb-4 text-sm font-semibold text-fg">Qual pet você viu?</h2>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                    Pet <span className="text-danger">*</span>
                  </label>
                  <select
                    name="pet_id"
                    required
                    value={petId}
                    onChange={(e) => setPetId(e.target.value)}
                    className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-fg focus:border-brand-500/60 focus:outline-none"
                  >
                    <option value="">-- Selecione o pet perdido --</option>
                    {pets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {SPECIES_EMOJI[p.species]} {p.name ?? "Sem nome"} ({p.id.slice(0, 6)}…)
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state.fieldErrors?.pet_id} />
                  <p className="mt-1.5 text-xs text-fg-subtle">
                    Não sabe qual é?{" "}
                    <Link href="/pets?kind=lost" className="text-brand-500 hover:underline">
                      Veja os pets perdidos na rede
                    </Link>
                  </p>
                </div>
              </section>

              {/* Localização */}
              <section className="rounded-xl border border-warm-200 bg-warm-50 p-5">
                <h2 className="mb-1 text-sm font-semibold text-fg">Onde você viu?</h2>
                <p className="mb-4 text-xs text-fg-muted">
                  Use o GPS ou descreva o endereço. As coordenadas ajudam a plotar no mapa.
                </p>

                {/* Botão GPS */}
                <button
                  type="button"
                  onClick={handleGeolocate}
                  disabled={geoLoading}
                  className="mb-4 flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-500/20 disabled:opacity-50"
                >
                  {geoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  {geoLoading ? "Obtendo localização…" : "Usar minha localização agora"}
                </button>

                {geoError && (
                  <p className="mb-3 text-xs text-danger">{geoError}</p>
                )}

                {/* Coordenadas preenchidas */}
                {lat && lng && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-700">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    Coordenadas capturadas: {parseFloat(lat).toFixed(4)}°, {parseFloat(lng).toFixed(4)}°
                  </div>
                )}

                {/* Endereço textual */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                    Endereço / referência{!lat ? " *" : " (opcional com GPS ativo)"}
                  </label>
                  <input
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required={!lat}
                    placeholder="Ex.: Rua das Flores próximo ao mercado, Vila Santa Rosa"
                    maxLength={300}
                    className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500/60 focus:outline-none"
                  />
                  <FieldError errors={state.fieldErrors?.lat} />
                </div>
              </section>

              {/* Descrição */}
              <section className="rounded-xl border border-warm-200 bg-warm-50 p-5">
                <h2 className="mb-4 text-sm font-semibold text-fg">Detalhes do avistamento</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                      O que você observou?
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      maxLength={500}
                      placeholder="Ex.: Vi um cão da mesma raça próximo à praça, parecia assustado e estava sozinho. Horário: ~15h."
                      className="w-full resize-none rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                      Seu nome (opcional)
                    </label>
                    <input
                      name="reporter_name"
                      maxLength={100}
                      placeholder="Ex.: Maria Silva"
                      className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500/60 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-fg-subtle">
                      Opcional. Aparece no registro para o tutor.
                    </p>
                  </div>
                </div>
              </section>

              <button
                type="submit"
                disabled={isPending || !petId || (!lat && !address)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-glow-brand transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Registrando…
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" /> Registrar avistamento
                  </>
                )}
              </button>

              <p className="text-center text-xs text-fg-subtle">
                Seus dados são usados apenas para ajudar na localização do pet.
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
