import { defineConfig, devices } from "@playwright/test"
import {
  readLocalSupabaseEnvironment,
  toWebProcessEnvironment,
} from "./e2e/helpers/local-env"

const localEnvironment = readLocalSupabaseEnvironment()
const webEnv = toWebProcessEnvironment(localEnvironment)

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  globalSetup: "./e2e/global-setup.ts",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: localEnvironment.webOrigin,
    trace: "retain-on-failure",
    video: "off",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm exec next dev --hostname 127.0.0.1 --port 3000",
    cwd: __dirname,
    env: {
      ...process.env,
      ...webEnv,
      NODE_ENV: "development",
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: localEnvironment.webOrigin,
  },
})
