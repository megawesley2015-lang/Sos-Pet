import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Ambiente Node (sem browser/DOM) — ideal para testar lógica pura
    environment: "node",
    // Relatório legível no terminal + JSON para CI
    reporters: ["verbose", "json"],
    outputFile: "test-results/report.json",
    // Pastas de teste
    include: ["__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
