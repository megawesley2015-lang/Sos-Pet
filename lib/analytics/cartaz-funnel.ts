"use client";

import { hasAnalyticsConsent, trackEvent } from "@/lib/analytics";

type CartazShareChannel = "auto" | "again" | "download";
type ContactChannel = "whatsapp" | "call";

function trackCartazEvent(eventName: string, params: Record<string, unknown>) {
  if (hasAnalyticsConsent() !== true) return;
  trackEvent(eventName, params);
}

export function trackCartazOpen(petId: string) {
  trackCartazEvent("cartaz_open", { pet_id: petId });
}

export function trackCartazGenerated(petId: string) {
  trackCartazEvent("cartaz_generated", { pet_id: petId });
}

export function trackCartazShared(
  petId: string,
  channel: CartazShareChannel
) {
  trackCartazEvent("cartaz_shared", { pet_id: petId, channel });
}

export function trackCartazScanVisit(petId: string) {
  trackCartazEvent("cartaz_scan_visit", { pet_id: petId, src: "cartaz" });
}

export function trackPetContactClick(
  petId: string,
  channel: ContactChannel,
  src?: string
) {
  trackCartazEvent("pet_contact_click", {
    pet_id: petId,
    channel,
    ...(src ? { src } : {}),
  });
}
