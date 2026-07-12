import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"
import {
  extractFirstHttpLink,
  waitForMailpitMessage,
} from "./mailpit"
import type { LocalSupabaseEnvironment } from "./local-env"

export async function fillAndSubmitAuthForm(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [name, value] of Object.entries(fields)) {
    const field = page.locator(`[name="${name}"]`)
    await expect(field).toBeVisible()
    await field.click()
    await field.fill("")
    await field.pressSequentially(value, { delay: 10 })
    await expect(field).toHaveValue(value)
  }

  await Promise.all([
    page.waitForResponse((response) =>
      response.request().method() === "POST" && response.status() < 500
    ),
    page.getByRole("button", { name: "Tiep tuc" }).click(),
  ])
}

export async function openMailLink(
  page: Page,
  environment: LocalSupabaseEnvironment,
  options: {
    recipient: string
    subjectIncludes: string
  }
): Promise<void> {
  const message = await waitForMailpitMessage({
    mailpitUrl: environment.mailpitUrl,
    recipient: options.recipient,
    subjectIncludes: options.subjectIncludes,
  })
  const content = message.Text || message.HTML || ""
  const link = extractFirstHttpLink(content)
  await page.goto(link)
}

export async function expectSignedOutFromAccount(page: Page): Promise<void> {
  await page.goto("/account")
  await expect(page).toHaveURL(/\/sign-in/)
  await expect(page.getByRole("heading", { name: "Dang nhap" })).toBeVisible()
}

export async function expectAccountPage(page: Page, email: string): Promise<void> {
  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByRole("heading", { name: "Tai khoan" })).toBeVisible()
  await expect(page.getByText(email, { exact: true })).toBeVisible()
  await expect(page.getByText("Da xac nhan", { exact: true })).toBeVisible()
}
