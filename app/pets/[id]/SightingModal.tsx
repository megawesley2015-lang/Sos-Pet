"use client";

import { useState, useRef, useCallback, useEffect, useTransition } from "react";
import { MapPin, Camera, Image as ImageIcon, X, Check, Loader2 } from "lucide-react";
import { registrarAvistamentoAction } from "./actions";

interface SightingModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
}

type Step = "photo" | "location" | "confirm";

interface LocationState {
  status: "idle" | "loading" | "success" | "error";
  coords: { lat: number; lng: number } | null;
  address: string | null;
  error: string | null;
}

export default function SightingModal({
  isOpen,
  onClose,
  petId,
  petName,
}: SightingModalProps) {
  const [step, setStep] = useState<Step>("photo");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [location, setLocation] = useState<LocationState>({
    status: "idle",
    coords: null,
    address: null,
    error: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ——— Câmera ———

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch {
      fileInputRef.current?.click();
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `avistamento-${Date.now()}.jpg`, { type: "image/jpeg" });
      setPhotoFile(file);
      setPhotoPreview(canvas.toDataURL("image/jpeg"));
      stopCamera();
      setStep("location");
    }, "image/jpeg", 0.8);
  }, [stopCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Selecione uma imagem válida.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
      setPhotoFile(file);
      setStep("location");
    };
    reader.readAsDataURL(file);
  }, []);

  // ——— GPS ———

  const getLocation = useCallback(() => {
    setLocation((p) => ({ ...p, status: "loading" }));

    if (!navigator.geolocation) {
      setLocation({ status: "error", coords: null, address: null, error: "Geolocalização não suportada." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        let address: string | null = null;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
          );
          const data = await res.json();
          address = data.display_name ?? null;
        } catch { /* silencioso */ }
        setLocation({ status: "success", coords, address, error: null });
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: "Permissão negada. Permite o acesso à localização nas configurações.",
          2: "Localização indisponível. Verifique o GPS.",
          3: "Tempo esgotado. Tente novamente.",
        };
        setLocation({ status: "error", coords: null, address: null, error: msgs[err.code] ?? "Erro ao obter localização." });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // ——— Envio ———

  const handleSubmit = useCallback(() => {
    if (!photoFile || !location.coords) return;
    setSubmitError(null);

    const fd = new FormData();
    fd.append("pet_id", petId);
    fd.append("lat", String(location.coords.lat));
    fd.append("lng", String(location.coords.lng));
    if (location.address) fd.append("address", location.address);
    if (description) fd.append("description", description);
    fd.append("photo", photoFile);

    startTransition(async () => {
      const result = await registrarAvistamentoAction({ }, fd);
      if (result.error) {
        setSubmitError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  }, [photoFile, location, description, petId]);

  const resetForm = useCallback(() => {
    setStep("photo");
    setPhotoPreview(null);
    setPhotoFile(null);
    setDescription("");
    setLocation({ status: "idle", coords: null, address: null, error: null });
    setSubmitError(null);
    setSubmitted(false);
    stopCamera();
  }, [stopCamera]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Busca GPS automaticamente ao entrar na etapa de localização
  useEffect(() => {
    if (step === "location" && location.status === "idle") {
      getLocation();
    }
  }, [step, location.status, getLocation]);

  // Para câmera ao fechar
  useEffect(() => {
    if (!isOpen) stopCamera();
  }, [isOpen, stopCamera]);

  if (!isOpen) return null;

  const STEPS: Step[] = ["photo", "location", "confirm"];
  const stepIdx = STEPS.indexOf(step);

  // ——— Sucesso ———
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-ink-700 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-display text-xl font-bold text-fg">Avistamento registrado!</h2>
          <p className="mt-2 text-sm text-fg-muted">
            Obrigado! Seu registro pode ajudar a reunir <span className="text-brand-300">{petName}</span> com a família.
          </p>
          <button
            onClick={handleClose}
            className="mt-6 w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-ink-700 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
              <MapPin className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-semibold text-fg">Reportar Avistamento</h2>
              <p className="text-xs text-fg-muted">
                Pet: <span className="text-cyan-400">{petName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-fg-muted hover:bg-white/10 hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 bg-ink-800/50 px-4 py-2.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors
                ${step === s ? "bg-cyan-500 text-white" : i < stepIdx ? "bg-success text-white" : "bg-white/10 text-fg-subtle"}`}
              >
                {i < stepIdx ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              {i < 2 && (
                <div className={`mx-1 h-0.5 flex-1 transition-colors ${i < stepIdx ? "bg-success" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">

          {/* ETAPA 1: FOTO */}
          {step === "photo" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-fg-muted">
                Tire uma foto do pet ou selecione da galeria
              </p>

              <div className="relative aspect-video overflow-hidden rounded-xl bg-ink-800">
                {cameraActive ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                    <div className="pointer-events-none absolute inset-4 rounded-lg border-2 border-white/20">
                      <div className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-cyan-400 rounded-tl" />
                      <div className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-cyan-400 rounded-tr" />
                      <div className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
                      <div className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-cyan-400 rounded-br" />
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-fg-subtle">
                    <Camera className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Câmera não ativada</p>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="grid grid-cols-2 gap-3">
                {cameraActive ? (
                  <>
                    <button onClick={stopCamera} className="rounded-xl border border-white/10 py-3 text-sm text-fg-muted hover:bg-white/5">
                      Cancelar
                    </button>
                    <button onClick={capturePhoto} className="rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white hover:bg-cyan-600 flex items-center justify-center gap-2">
                      <Camera className="h-4 w-4" /> Capturar
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={startCamera} className="rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white hover:bg-cyan-600 flex items-center justify-center gap-2">
                      <Camera className="h-4 w-4" /> Abrir Câmera
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-white/10 py-3 text-sm text-fg-muted hover:bg-white/5 flex items-center justify-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Da Galeria
                    </button>
                  </>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
            </div>
          )}

          {/* ETAPA 2: LOCALIZAÇÃO */}
          {step === "location" && (
            <div className="space-y-4">
              {photoPreview && (
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); setStep("photo"); }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <span className="absolute bottom-2 left-2 rounded bg-success/80 px-2 py-0.5 text-xs font-medium text-white">
                    ✓ Foto selecionada
                  </span>
                </div>
              )}

              {/* Status GPS */}
              <div className={`rounded-xl border p-4 ${
                location.status === "success" ? "border-success/30 bg-success/10"
                : location.status === "error" ? "border-danger/30 bg-danger/5"
                : "border-white/10 bg-ink-800/50"}`}
              >
                {location.status === "loading" && (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-fg">Obtendo localização…</p>
                      <p className="text-xs text-fg-muted">Pode levar alguns segundos</p>
                    </div>
                  </div>
                )}
                {location.status === "success" && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    <div>
                      <p className="text-sm font-medium text-success">Localização obtida!</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-fg-muted">
                        {location.address ?? `${location.coords?.lat.toFixed(5)}, ${location.coords?.lng.toFixed(5)}`}
                      </p>
                    </div>
                  </div>
                )}
                {location.status === "error" && (
                  <div className="space-y-2">
                    <p className="text-sm text-danger-fg">{location.error}</p>
                    <button onClick={getLocation} className="text-xs text-cyan-400 hover:underline">
                      Tentar novamente
                    </button>
                  </div>
                )}
                {location.status === "idle" && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-fg-subtle" />
                    <p className="text-sm text-fg-muted">Aguardando GPS…</p>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">Observações (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Vi o pet perto do parque, parecia assustado…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-ink-800 px-4 py-3 text-sm text-fg placeholder:text-fg-subtle focus:border-cyan-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep("photo")} className="rounded-xl border border-white/10 py-3 text-sm text-fg-muted hover:bg-white/5">
                  ← Voltar
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  disabled={location.status !== "success"}
                  className="rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 3: CONFIRMAÇÃO */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-center">
                <p className="text-2xl">🎯</p>
                <h3 className="mt-1 font-bold text-fg">Pronto para enviar!</h3>
                <p className="mt-0.5 text-xs text-fg-muted">
                  Sua contribuição pode ajudar a reunir {petName} com a família
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-ink-800/50 p-4 space-y-3">
                {photoPreview && (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-medium text-fg">Foto capturada</p>
                      <p className="text-xs text-fg-muted">{new Date().toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                  <p className="text-xs text-fg-muted">
                    {location.address ?? `${location.coords?.lat.toFixed(4)}, ${location.coords?.lng.toFixed(4)}`}
                  </p>
                </div>
                {description && (
                  <p className="text-xs text-fg-muted italic">"{description}"</p>
                )}
              </div>

              {submitError && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger-fg">
                  {submitError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep("location")} disabled={isPending} className="rounded-xl border border-white/10 py-3 text-sm text-fg-muted hover:bg-white/5 disabled:opacity-40">
                  ← Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 rounded-xl bg-success py-3 text-sm font-bold text-white hover:bg-success/90 disabled:opacity-60"
                >
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
                  ) : (
                    <><Check className="h-4 w-4" /> Enviar Avistamento</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
