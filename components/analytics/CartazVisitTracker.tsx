"use client";

import { useEffect, useRef } from "react";
import { trackCartazScanVisit } from "@/lib/analytics/cartaz-funnel";

interface CartazVisitTrackerProps {
  petId: string;
  src?: string;
}

export function CartazVisitTracker({ petId, src }: CartazVisitTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current || src !== "cartaz") return;
    trackedRef.current = true;
    trackCartazScanVisit(petId);
  }, [petId, src]);

  return null;
}
