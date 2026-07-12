import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import {
  deleteAuthUser,
  findAuthUserIdByEmail,
} from "./helpers/auth-admin"
import {
  expectAccountPage,
  expectSignedOutFromAccount,
  fillAndSubmitAuthForm,
  openMailLink,
} from "./helpers/auth-ui"
import { readLocalSupabaseEnvironment } from "./helpers/local-env"

const environment = readLocalSupabaseEnvironment()

test("completes local web auth confirmation, account, recovery, and logout", async ({
  page,
}) => {
  const password = `Lunav-${randomUUID().replace(/-/g, "")}9aA`
  const nextPassword = `Lunav-${randomUUID().replace(/-/g, "")}9bB`
  const email = `web-e2e-${randomUUID()}@example.com`
  const displayName = `Doc gia ${randomUUID().slice(0, 8)}`
  let userId: string | null = null

  try {
    await page.goto("/sign-up")
    await fillAndSubmitAuthForm(page, {
      email,
      password,
      passwordConfirmation: password,
    })
    await expect(
      page.getByText(
        "Neu dia chi email hop le, ban se nhan duoc huong dan xac nhan."
      )
    ).toBeVisible()

    userId = await findAuthUserIdByEmail(environment, email)
    expect(userId).toBeTruthy()

    await expectSignedOutFromAccount(page)

    await page.goto("/sign-in?returnTo=/account")
    await fillAndSubmitAuthForm(page, {
      email,
      password,
    })
    await expect(
      page.getByText(
        "Email hoac mat khau khong dung, hoac email chua duoc xac nhan."
      )
    ).toBeVisible()

    // Keep the same browser context so the PKCE code verifier cookie from
    // signup is still available for the confirmation callback exchange.
    await openMailLink(page, environment, {
      recipient: email,
      subjectIncludes: "Confirm your email",
    })
    await expect(page).toHaveURL(/\/sign-in\?confirmed=1/)
    await expect(
      page.getByText("Email cua ban da duoc xac nhan.")
    ).toBeVisible()

    await page.goto("/sign-in?returnTo=/account")
    await fillAndSubmitAuthForm(page, {
      email,
      password,
    })
    await expectAccountPage(page, email)

    await page.reload()
    await expectAccountPage(page, email)

    await page.locator("#displayName").fill(displayName)
    await expect(page.locator("#displayName")).toHaveValue(displayName)
    await page.getByRole("button", { name: "Luu thay doi" }).click()
    await expect(page.getByText("Thong tin da duoc cap nhat.")).toBeVisible()
    await page.reload()
    await expectAccountPage(page, email)
    await expect(page.locator("#displayName")).toHaveValue(displayName)

    await page.getByRole("button", { name: "Dang xuat" }).click()
    await expect(page).toHaveURL(/\/sign-in/)
    await expectSignedOutFromAccount(page)

    await page.goto("/forgot-password")
    await fillAndSubmitAuthForm(page, { email })
    await expect(
      page.getByText(
        "Neu dia chi email hop le, ban se nhan duoc huong dan dat lai mat khau."
      )
    ).toBeVisible()

    await openMailLink(page, environment, {
      recipient: email,
      subjectIncludes: "Reset",
    })
    await expect(page).toHaveURL(/\/reset-password/)
    await fillAndSubmitAuthForm(page, {
      password: nextPassword,
      passwordConfirmation: nextPassword,
    })
    await expect(page.getByText("Mat khau da duoc cap nhat.")).toBeVisible()

    await page.goto("/sign-in?returnTo=/account")
    await fillAndSubmitAuthForm(page, {
      email,
      password: nextPassword,
    })
    await expectAccountPage(page, email)

    await page.getByRole("button", { name: "Dang xuat" }).click()
    await expect(page).toHaveURL(/\/sign-in/)
    await expectSignedOutFromAccount(page)
  } finally {
    if (!userId) {
      userId = await findAuthUserIdByEmail(environment, email)
    }

    await deleteAuthUser(environment, userId)
  }
})
