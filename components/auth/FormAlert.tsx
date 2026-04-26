import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FormAlertProps {
  type: "error" | "success";
  message: string;
}

export function FormAlert({ type, message }: FormAlertProps) {
  const isError = type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "mb-4 flex items-start gap-2 rounded-lg border p-3 text-xs",
        isError
          ? "border-danger/40 bg-danger/10 text-danger-fg"
          : "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
