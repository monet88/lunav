export interface MailpitMessageSummary {
  ID: string
  Subject: string
  To: Array<{ Address: string }>
  Created: string
}

interface MailpitListResponse {
  messages: MailpitMessageSummary[]
}

interface MailpitMessageDetail {
  HTML?: string
  Text?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function formatErrorCause(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return String(error)
}

export async function waitForMailpitMessage(options: {
  mailpitUrl: string
  recipient: string
  subjectIncludes: string
  timeoutMs?: number
}): Promise<MailpitMessageDetail & { ID: string }> {
  const timeoutMs = options.timeoutMs ?? 20_000
  const startedAt = Date.now()
  const recipient = options.recipient.toLowerCase()
  let lastProbeIssue: string | null = null

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const listResponse = await fetch(
        `${options.mailpitUrl}/api/v1/messages?limit=50`
      )

      if (!listResponse.ok) {
        lastProbeIssue = `Mailpit list failed with HTTP ${listResponse.status}`
      } else {
        const list = (await listResponse.json()) as MailpitListResponse
        const match = list.messages.find((message) => {
          const addresses =
            message.To?.map((entry) => entry.Address.toLowerCase()) ?? []
          return (
            addresses.includes(recipient) &&
            message.Subject.toLowerCase().includes(
              options.subjectIncludes.toLowerCase()
            )
          )
        })

        if (match) {
          const detailResponse = await fetch(
            `${options.mailpitUrl}/api/v1/message/${match.ID}`
          )

          if (detailResponse.ok) {
            const detail = (await detailResponse.json()) as MailpitMessageDetail
            return { ...detail, ID: match.ID }
          }

          lastProbeIssue = `Mailpit message fetch failed with HTTP ${detailResponse.status}`
        } else {
          lastProbeIssue = null
        }
      }
    } catch (error) {
      // Transient Mailpit/network errors should retry until timeout, but keep
      // the last probe failure so the final timeout error remains diagnosable.
      lastProbeIssue = `Mailpit probe error: ${formatErrorCause(error)}`
    }

    await sleep(500)
  }

  const diagnostic =
    lastProbeIssue === null
      ? 'Mailpit responded, but no matching message arrived.'
      : lastProbeIssue

  throw new Error(
    `Timed out waiting for Mailpit message to ${options.recipient} containing "${options.subjectIncludes}". Last probe: ${diagnostic}`
  )
}

export function extractFirstHttpLink(content: string): string {
  const match = content.match(/https?:\/\/[^\s)"']+/)

  if (!match) {
    throw new Error('Mail message did not contain an HTTP link.')
  }

  return match[0]
}
