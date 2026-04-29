import { createServiceClient } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Package,
  QrCode,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { renotificarFornecedorAction } from "./actions";

type OrderStatus =
  | "awaiting_payment"
  | "queued"
  | "sent_to_supplier"
  | "in_production"
  | "shipped"
  | "delivered";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  awaiting_payment: { label: "Aguardando pagamento", color: "text-fg-subtle", icon: Clock },
  queued:           { label: "Na fila", color: "text-yellow-400", icon: Clock },
  sent_to_supplier: { label: "Enviado ao fornecedor", color: "text-cyan-400", icon: Package },
  in_production:    { label: "Em produção", color: "text-brand-400", icon: Package },
  shipped:          { label: "Despachado", color: "text-cyan-300", icon: Truck },
  delivered:        { label: "Entregue", color: "text-green-400", icon: CheckCircle },
};

export const metadata = { title: "Plaquinhas — Admin · SOS Pet" };

export default async function AdminPlaquinhasPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const service = createServiceClient();

  const { data: orders } = await service
    .from("pet_tag_orders")
    .select(`
      id, created_at, amount_cents,
      payment_status, supplier_status, supplier_notified_at,
      shipping_name, shipping_address, tag_contact_phone,
      tracking_code,
      pets ( id, name, species, photo_url )
    `)
    .order("created_at", { ascending: false });

  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  // Métricas rápidas
  const total = orders?.length ?? 0;
  const paid = orders?.filter((o) => o.payment_status === "paid").length ?? 0;
  const pending = orders?.filter((o) => o.payment_status === "pending_payment").length ?? 0;
  const shipped = orders?.filter((o) => o.supplier_status === "shipped" || o.supplier_status === "delivered").length ?? 0;

  return (
    <div className="min-h-screen bg-ink-900 p-6 text-fg">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin" className="mb-1 text-xs text-fg-subtle hover:text-fg">
              ← Admin
            </Link>
            <h1 className="font-display text-2xl font-black text-fg">
              Plaquinhas
            </h1>
            <p className="text-sm text-fg-muted">{total} pedidos no total</p>
          </div>
          <Link
            href="/plaquinha"
            target="_blank"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
          >
            <QrCode className="h-4 w-4" />
            Ver página de venda
          </Link>
        </div>

        {/* Métricas */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total de pedidos", value: total, color: "text-fg" },
            { label: "Pagos", value: paid, color: "text-green-400" },
            { label: "Aguardando pagamento", value: pending, color: "text-yellow-400" },
            { label: "Despachados", value: shipped, color: "text-cyan-400" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-white/10 bg-ink-700/50 p-4"
            >
              <p className={`font-display text-3xl font-black ${m.color}`}>
                {m.value}
              </p>
              <p className="mt-0.5 text-xs text-fg-subtle">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Lista de pedidos */}
        <div className="space-y-3">
          {!orders?.length && (
            <div className="rounded-2xl border border-white/10 bg-ink-700/40 p-12 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-fg-subtle" />
              <p className="text-fg-muted">Nenhum pedido ainda.</p>
            </div>
          )}

          {orders?.map((order) => {
            const pet = order.pets as unknown as {
              id: string;
              name: string | null;
              species: string;
              photo_url: string | null;
            } | null;

            const supplierStatus = (order.supplier_status ?? "awaiting_payment") as OrderStatus;
            const config = STATUS_CONFIG[supplierStatus] ?? STATUS_CONFIG.awaiting_payment;
            const StatusIcon = config.icon;
            const addr = order.shipping_address as Record<string, string>;
            const petUrl = `${APP_URL}/pets/${pet?.id}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(petUrl)}`;
            const isPaid = order.payment_status === "paid";

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-white/10 bg-ink-700/40 p-5"
              >
                <div className="flex flex-wrap items-start gap-4">
                  {/* QR Code miniatura */}
                  <a href={qrUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="QR Code"
                      width={64}
                      height={64}
                      className="rounded-lg bg-white p-1"
                    />
                  </a>

                  {/* Dados principais */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold text-fg">
                        {pet?.name ?? "Sem nome"}
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-fg-subtle">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${config.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </span>
                      {!isPaid && (
                        <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                          Pagamento pendente
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-fg-muted">
                      <span>📞 {order.tag_contact_phone}</span>
                      <span>
                        📦 {addr.logradouro}, {addr.numero} — {addr.cidade}/{addr.estado}
                      </span>
                      <span>
                        💰 R$ {((order.amount_cents ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <span>
                        🕐 {new Date(order.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    {order.tracking_code && (
                      <p className="mt-1 text-xs text-cyan-400">
                        📬 Rastreio: <strong>{order.tracking_code}</strong>
                      </p>
                    )}

                    {order.supplier_notified_at && (
                      <p className="mt-1 text-[11px] text-fg-subtle">
                        Fornecedor notificado em{" "}
                        {new Date(order.supplier_notified_at).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href={petUrl}
                      target="_blank"
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-fg-muted hover:bg-white/5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver pet
                    </Link>

                    {isPaid && (
                      <form action={renotificarFornecedorAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button
                          type="submit"
                          className="flex w-full items-center gap-1.5 rounded-lg border border-brand-500/40 px-3 py-1.5 text-xs text-brand-400 hover:bg-brand-500/10"
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          Reenviar email
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
