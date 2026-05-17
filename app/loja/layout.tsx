import { TopBar } from "@/components/layout/TopBar";

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />
      <main>{children}</main>
    </div>
  );
}
