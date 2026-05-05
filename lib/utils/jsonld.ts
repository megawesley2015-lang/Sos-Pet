/**
 * Builders de JSON-LD (schema.org) para SEO estruturado.
 *
 * Por que: Google enriquece o snippet quando há JSON-LD válido (rich result
 * para LocalBusiness, breadcrumbs, etc). Para pets perdidos/encontrados não
 * há type oficial, então usamos `Article` com `mainEntity: Animal` — Google
 * tolera campos extras e o que importa pra ele (image, datePublished,
 * description, locationCreated) está tipado corretamente.
 *
 * Como usar:
 *   import { petArticleJsonLd, providerJsonLd } from "@/lib/utils/jsonld";
 *
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: JSON.stringify(petArticleJsonLd(pet, baseUrl)) }}
 *   />
 *
 * NÃO sanitizar o output — JSON.stringify já escapa <, > e & no contexto
 * de application/ld+json. Apenas garantir que o objeto venha de fontes
 * controladas (DB sob nosso schema).
 */
import type { PetRow, PrestadorRow } from "@/lib/types/database";

interface PetArticleLd {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  image?: string[];
  articleSection: "Pet perdido" | "Pet encontrado";
  inLanguage: "pt-BR";
  isAccessibleForFree: true;
  publisher: {
    "@type": "Organization";
    name: "SOS Pet";
    url: string;
  };
  mainEntity: {
    "@type": "Thing";
    name: string;
    description: string;
    image?: string;
    additionalType: "Animal";
    additionalProperty: Array<{
      "@type": "PropertyValue";
      name: string;
      value: string;
    }>;
  };
  spatialCoverage?: {
    "@type": "Place";
    name: string;
    address: {
      "@type": "PostalAddress";
      addressLocality: string;
      addressRegion: string | null;
      addressCountry: "BR";
    };
  };
}

/**
 * JSON-LD para a página de detalhe de um pet (perdido ou encontrado).
 * @param pet — registro do banco
 * @param baseUrl — URL canônica do site (ex: https://sospet.com.br)
 */
export function petArticleJsonLd(pet: PetRow, baseUrl: string): PetArticleLd {
  const isLost = pet.kind === "lost";
  const nome = pet.name?.trim() || (isLost ? "Pet perdido" : "Pet encontrado");
  const localCurto = `${pet.neighborhood}, ${pet.city}`;
  const headline = isLost
    ? `Procura-se: ${nome} em ${pet.city}`
    : `Encontrado: ${nome} em ${pet.city}`;

  const properties: Array<{ "@type": "PropertyValue"; name: string; value: string }> = [
    { "@type": "PropertyValue", name: "Espécie", value: pet.species },
    { "@type": "PropertyValue", name: "Cor", value: pet.color },
  ];
  if (pet.breed) properties.push({ "@type": "PropertyValue", name: "Raça", value: pet.breed });
  if (pet.size) properties.push({ "@type": "PropertyValue", name: "Porte", value: pet.size });
  if (pet.sex) properties.push({ "@type": "PropertyValue", name: "Sexo", value: pet.sex });
  if (pet.age_approx) properties.push({ "@type": "PropertyValue", name: "Idade", value: pet.age_approx });

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description:
      pet.description?.trim() ||
      `${isLost ? "Procura-se" : "Encontrado"} ${nome} em ${localCurto}. Veja detalhes e ajude na rede SOS Pet.`,
    datePublished: pet.created_at,
    dateModified: pet.updated_at ?? pet.created_at,
    image: pet.photo_url ? [pet.photo_url] : undefined,
    articleSection: isLost ? "Pet perdido" : "Pet encontrado",
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    publisher: {
      "@type": "Organization",
      name: "SOS Pet",
      url: baseUrl,
    },
    mainEntity: {
      "@type": "Thing",
      name: nome,
      description: pet.description ?? `${pet.species} ${pet.color}`,
      image: pet.photo_url ?? undefined,
      additionalType: "Animal",
      additionalProperty: properties,
    },
    spatialCoverage: {
      "@type": "Place",
      name: localCurto,
      address: {
        "@type": "PostalAddress",
        addressLocality: pet.city,
        addressRegion: pet.state ?? null,
        addressCountry: "BR",
      },
    },
  };
}

interface LocalBusinessLd {
  "@context": "https://schema.org";
  "@type": "LocalBusiness";
  name: string;
  description?: string;
  image?: string;
  url: string;
  telephone?: string;
  address: {
    "@type": "PostalAddress";
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    addressCountry: "BR";
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
    bestRating: 5;
    worstRating: 1;
  };
  sameAs?: string[];
}

const CATEGORIA_TO_TYPE: Record<PrestadorRow["categoria"], string> = {
  veterinario: "VeterinaryCare",
  petshop: "PetStore",
  adestrador: "LocalBusiness",
  hospedagem: "AnimalShelter",
  banho_tosa: "PetStore",
  outro: "LocalBusiness",
};

/**
 * JSON-LD para detalhe de prestador (LocalBusiness).
 * Inclui aggregateRating se tiver ≥1 avaliação.
 */
export function providerJsonLd(
  prestador: PrestadorRow,
  baseUrl: string
): LocalBusinessLd & { "@type": string } {
  const tipo = CATEGORIA_TO_TYPE[prestador.categoria] ?? "LocalBusiness";

  const sameAs: string[] = [];
  if (prestador.site) sameAs.push(prestador.site);
  if (prestador.instagram) {
    const handle = prestador.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
    sameAs.push(`https://www.instagram.com/${handle}`);
  }

  const ld: LocalBusinessLd & { "@type": string } = {
    "@context": "https://schema.org",
    "@type": tipo as "LocalBusiness",
    name: prestador.nome,
    description: prestador.descricao ?? undefined,
    image: prestador.logo_url ?? prestador.capa_url ?? undefined,
    url: `${baseUrl}/prestadores/${prestador.slug}`,
    telephone: prestador.telefone ?? prestador.whatsapp ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: prestador.endereco ?? undefined,
      addressLocality: prestador.cidade,
      addressRegion: prestador.estado ?? undefined,
      addressCountry: "BR",
    },
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  if ((prestador.total_avaliacoes ?? 0) > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(prestador.media_avaliacoes ?? 0),
      reviewCount: prestador.total_avaliacoes,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return ld;
}
