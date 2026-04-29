"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import SightingModal from "./SightingModal";

interface Props {
  petId: string;
  petName: string;
}

export default function SightingButton({ petId, petName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
      >
        <MapPin className="h-3.5 w-3.5" />
        Reportar avistamento
      </button>

      <SightingModal
        isOpen={open}
        onClose={() => setOpen(false)}
        petId={petId}
        petName={petName}
      />
    </>
  );
}
