import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas del apartado de fotos en un navegador real, sin Supabase ni Next:
 *   npm run test:photos
 * El formulario real se empaqueta con Supabase falso (ver tests/photos/global-setup.ts).
 */
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "tests/photos",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: [["list"]],
  globalSetup: "./tests/photos/global-setup.ts",
  use: { baseURL: "http://localhost:4319", locale: "es-CO", launchOptions: { executablePath } },
  projects: [{ name: "android", use: { ...devices["Pixel 7"], launchOptions: { executablePath } } }],
});
