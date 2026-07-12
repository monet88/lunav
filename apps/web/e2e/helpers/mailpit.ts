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

export async function waitForMailpitMessage(options: {
  mailpitUrl: string
  recipient: string
  subjectIncludes: string
  timeoutMs?: number
}): Promise<MailpitMessageDetail & { ID: string }> {
  const timeoutMs = options.timeoutMs ?? 20_000
  const startedAt = Date.now()
  const recipient = options.recipient.toLowerCase()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const listResponse = await fetch(
        `${options.mailpitUrl}/api/v1/messages?limit=50`
      )

      if (listResponse.ok) {
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
        }
      }
    } catch {
      // Transient Mailpit/network errors should retry until timeout.
    }

    await sleep(500)
  }

  throw new Error(
    `Timed out waiting for Mailpit message to ${options.recipient} containing "${options.subjectIncludes}".`
  )
}

export function extractFirstHttpLink(content: string): string {
  const match = content.match(/https?:\/\/[^\s)"']+/)

  if (!match) {
    throw new Error('Mail message did not contain an HTTP link.')
  }

  return match[0]
}
