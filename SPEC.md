# ZIWEI AI — Roadmap Spec

## 1. Mục tiêu sản phẩm

Xây dựng lại ZIWEI AI từ đầu với:

* Web app thực tế, hỗ trợ SEO và trải nghiệm desktop.
* Mobile app native cho iOS và Android.
* Backend realtime, phù hợp với AI workflows.
* Codebase dễ tiếp tục phát triển bằng AI coding agents.
* Kiến trúc đơn giản ở giai đoạn đầu nhưng có boundary rõ để scale dần.

## 2. Stack nền tảng

```txt
Monorepo:  pnpm + Turborepo
Web:       Next.js App Router
Mobile:    Expo Router
Backend:   Convex
Auth:      Clerk
Validation: Zod
Language:  TypeScript strict
Web UI:    Tailwind + shadcn/ui
Mobile UI: React Native + NativeWind hoặc Tamagui
Testing:   Vitest + Playwright, mobile smoke tests bổ sung sau
```

## 3. Cấu trúc mục tiêu

```txt
apps/
  web/
  mobile/

convex/
  schema.ts
  users.ts
  charts.ts
  explanations.ts
  conversations.ts
  vision.ts
  billing.ts
  quotas.ts
  workflows/
  internal/

packages/
  contracts/
  domain/
  prompts/
  ui-tokens/
  constants/
  config/

docs/
  ROADMAP.md
  ARCHITECTURE.md
  DATA_MODEL.md
  INVARIANTS.md
  FEATURES/
  DECISIONS/

AGENTS.md
```

---

# Roadmap

## Phase 0 — Reference Audit

### Mục tiêu

Dùng repo `F:\CodeBase\ziweiai-web` làm tài liệu tham khảo để rút ra:

* Domain và terminology.
* Core product flows.
* Contracts và data shapes.
* Astrology engine boundary.
* Vietnamese-only UI invariant.
* Các feature đã có giá trị.
* Những lỗi kiến trúc không nên lặp lại.

### Deliverables

```txt
docs/REFERENCE_AUDIT.md
docs/PRODUCT_SCOPE.md
docs/INVARIANTS.md
```

### Không làm

* Không copy nguyên code.
* Không port nguyên architecture.
* Không bắt đầu implement feature.

---

## Phase 1 — Foundation

### Mục tiêu

Tạo monorepo và toàn bộ nền kỹ thuật.

### Scope

* Next.js web scaffold.
* Expo mobile scaffold.
* Convex backend scaffold.
* Clerk auth skeleton.
* Shared packages.
* TypeScript strict.
* ESLint, formatting, tests và CI cơ bản.
* `AGENTS.md`.
* Architecture docs.

### Gate

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Tất cả phải pass.

---

## Phase 2 — Auth & User

### Mục tiêu

Một user có thể đăng ký, đăng nhập và sử dụng cùng một tài khoản trên web và mobile.

### Scope

* Clerk web integration.
* Clerk Expo integration.
* Convex identity integration.
* User profile sync.
* Protected routes.
* Sign-in, sign-up, sign-out.
* Basic account settings.

### Gate

* Web login/logout hoạt động.
* Mobile login/logout hoạt động.
* Convex xác định đúng current user.
* Không có secret trong client.

---

## Phase 3 — Core Chart

### Mục tiêu

Hoàn thành core loop đầu tiên:

```txt
Nhập dữ liệu sinh
  -> tạo lá số
  -> lưu snapshot
  -> xem chi tiết
  -> xem lịch sử
```

### Scope

* Birth data contracts.
* Chart schema.
* Server-only astrology engine.
* Create chart workflow.
* Chart status: pending, ready, failed.
* Chart history.
* Chart detail trên web và mobile.

### Gate

* Web và mobile tạo được chart.
* Engine không xuất hiện trong client bundle.
* User không đọc được chart của người khác.
* Reload hoặc mở lại app vẫn xem được kết quả.

---

## Phase 4 — AI Explanation

### Mục tiêu

Sinh và lưu luận giải AI cho lá số.

### Scope

* Explanation contracts.
* Prompt package.
* AI provider abstraction.
* Explanation workflow.
* Status: queued, running, ready, failed.
* Retry.
* Persist result.
* Markdown rendering trên web và mobile.

### Gate

* AI provider chỉ được gọi server-side.
* Failed generation không làm hỏng dữ liệu.
* Retry không tạo duplicate result.
* Kết quả được lưu và tải lại được.

---

## Phase 5 — Assistant Chat

### Mục tiêu

Cho phép user trò chuyện với trợ lý AI dựa trên context của lá số.

### Scope

* Conversations.
* Messages.
* Chart context injection.
* Assistant response generation.
* Persist user và assistant messages.
* Retry failed response.
* Realtime UI update.

### Gate

* Chat hoạt động trên web và mobile.
* Messages persist.
* Ownership được kiểm tra.
* Không tạo duplicate assistant reply khi retry.

---

## Phase 6 — Core Product Stabilization

### Mục tiêu

Biến các flow hiện có thành một MVP có thể dùng thật.

### Scope

* Dashboard.
* Navigation.
* History.
* Empty states.
* Loading states.
* Error states.
* Responsive web.
* Mobile safe area.
* Keyboard handling.
* Basic settings.
* Basic landing page.

### MVP Gate

Một user mới có thể hoàn thành toàn bộ flow sau trên cả web và mobile:

```txt
Đăng ký
  -> tạo lá số
  -> xem lá số
  -> sinh luận giải
  -> chat với assistant
  -> mở lại lịch sử
```

---

## Phase 7 — Quota & Credits

### Mục tiêu

Kiểm soát AI cost và chuẩn bị cho monetization.

### Scope

* Free quota.
* Usage events.
* Append-only credit ledger.
* Reserve credits.
* Spend credits.
* Release hoặc refund khi task fail.
* Idempotency keys.
* Usage and quota UI.

### Gate

* Workflow retry không double-charge.
* Failed task hoàn trả đúng.
* User hết quota bị chặn đúng.
* Ledger có thể audit.

---

## Phase 8 — Vision

### Mục tiêu

Thêm face reading và palm reading bằng ảnh.

### Scope

* Web image upload.
* Mobile image picker.
* File validation.
* Vision analysis workflow.
* Result history.
* Delete image và result.
* Privacy notice.

### Gate

* Upload hoạt động trên web và mobile.
* User có thể xóa dữ liệu.
* Không nhận dạng danh tính.
* Không suy đoán thuộc tính nhạy cảm.
* Không đưa ra chẩn đoán sức khỏe.

---

## Phase 9 — Expanded Modules

### Mục tiêu

Mở rộng các hệ luận giải sau khi core product ổn định.

### Module candidates

```txt
Tarot
Bát Tự
Hợp Hôn
Ngày tốt/xấu
Giải mộng
Xin xăm
Lục Hào
Mai Hoa
```

Mỗi module phải có riêng:

```txt
Contract
Domain logic
Prompt
Convex backend
Web UI
Mobile UI
History integration
Quota integration
Tests
Feature spec
```

Không triển khai nhiều module song song.

---

## Phase 10 — Monetization

### Mục tiêu

Thêm thanh toán và entitlement thật.

### Scope sẽ được quyết định bằng ADR:

* Subscription hay credit pack.
* Web payment provider.
* Mobile IAP strategy.
* RevenueCat hoặc native IAP.
* Webhook handling.
* Billing reconciliation.
* Paywall web/mobile.

Không implement payment trước khi chốt monetization model.

---

## Phase 11 — Growth & Public Web

### Mục tiêu

Dùng Next.js làm growth surface.

### Scope

* Landing pages.
* Pricing.
* Blog.
* Public share pages.
* SEO metadata.
* Sitemap.
* Open Graph.
* Programmatic SEO sau khi có content strategy.
* Analytics events.

Private app data không được xuất hiện trên public pages.

---

## Phase 12 — Production Hardening

### Mục tiêu

Chuẩn bị vận hành ổn định.

### Scope

* Sentry.
* PostHog.
* Rate limiting.
* Error taxonomy.
* AI cost visibility.
* Provider fallback.
* Abuse prevention.
* Delete account/data.
* Admin tools tối thiểu.
* Runbook.
* Incident checklist.

---

# Quy tắc kiến trúc tổng quát

## 1. Client và server

Web/mobile không được:

* Import astrology engine.
* Import package server-only.
* Gọi trực tiếp AI provider.
* Chứa API secret.
* Tự quyết định billing hoặc credits.
* Đọc record của user khác.

Mọi engine, AI, billing và privileged operation chạy server-side.

---

## 2. Contracts-first

Mọi dữ liệu crossing boundary phải có schema trong:

```txt
packages/contracts
```

Không được:

* Định nghĩa lại DTO trong web.
* Định nghĩa lại DTO trong mobile.
* Dùng type tự viết để thay thế contract.
* Trust raw AI output hoặc external response.

Mọi external input và AI output phải được parse.

---

## 3. Domain logic

Pure business logic nằm trong:

```txt
packages/domain
```

Không để business rules nằm rải rác trong:

* React components.
* Routes.
* Convex query handlers.
* UI event handlers.

Convex functions nên điều phối, validate, authorize và persist. Domain package xử lý logic thuần khi phù hợp.

---

## 4. Prompts

Tất cả prompt nằm trong:

```txt
packages/prompts
```

Không hardcode prompt dài trong:

* Convex actions.
* React components.
* Route files.
* Utility functions không liên quan.

Prompt phải có version hoặc identifier để trace output.

---

## 5. Web và mobile

Web và mobile là hai UI riêng.

Được phép share:

* Contracts.
* Domain logic.
* Constants.
* Prompt definitions.
* Design tokens.
* Feature semantics.

Không ép share sớm:

* Components.
* Navigation.
* Forms.
* Modals.
* Screen layouts.
* File picker.
* Camera interactions.

Chỉ extract shared UI khi duplication đã ổn định và lợi ích rõ ràng.

---

## 6. Server-only astrology engine

Astrology engine phải nằm trong package hoặc module server-only.

Client bị cấm import trực tiếp hoặc gián tiếp:

```txt
iztro
lunar-javascript
swisseph
sweph-wasm
@ziweiai/astro-engine
@ziweiai/core
```

Engine output phải được normalize trước khi lưu hoặc gửi cho client.

---

## 7. Vietnamese-only UI

User-facing UI phải dùng tiếng Việt.

* Không hiển thị raw engine labels.
* Không fallback ngầm sang chữ Hán.
* Có CJK guard cho output quan trọng.
* AI output không hợp lệ phải được sanitize hoặc reject.
* Internal identifiers nên dùng ASCII slug.

---

## 8. AI workflows

Mọi AI task phải có status rõ ràng:

```txt
queued
running
ready
failed
```

Mỗi task cần cân nhắc:

* Idempotency.
* Retry.
* Timeout.
* Ownership.
* Error code.
* Persisted result.
* Usage tracking.
* Credit reservation và release.

Không để trạng thái quan trọng chỉ tồn tại trong UI memory.

---

## 9. Billing và credits

Credit ledger là append-only.

Không dùng một field balance đơn lẻ làm source of truth duy nhất.

Các operation chính:

```txt
grant
reserve
spend
release
refund
adjustment
```

Mọi operation quan trọng phải có:

```txt
idempotencyKey
userId
source
amount
createdAt
```

---

## 10. Dependency rule

Không thêm dependency mới nếu chưa trả lời được:

1. Dependency giải quyết vấn đề gì?
2. Có thể giải quyết bằng stack hiện tại không?
3. Có hoạt động trên cả môi trường cần thiết không?
4. Có tăng maintenance burden đáng kể không?
5. Có package nhẹ hơn hoặc built-in alternative không?

Không thêm microservice, database hoặc queue mới chỉ để “chuẩn bị scale”.

---

## 11. Documentation rule

Khi thay đổi kiến trúc, schema hoặc invariant, phải cập nhật docs.

```txt
Architecture change -> ADR
Schema change       -> DATA_MODEL.md
Feature behavior    -> FEATURES/<feature>.md
Global rule         -> AGENTS.md hoặc INVARIANTS.md
```

Docs phải phản ánh code hiện tại, không chỉ mô tả ý định tương lai.

---

## 12. Phase rule

Không bắt đầu phase tiếp theo khi gate của phase hiện tại chưa pass.

Không build feature mới để tránh sửa bug hoặc hoàn thiện core flow.

Một phase có thể được chia nhỏ thành:

```txt
Planning
Contracts
Backend
Web
Mobile
Tests
Documentation
Hardening
```

---

# Quy trình cho mỗi feature

```txt
1. Viết hoặc cập nhật feature spec
2. Xác định contracts
3. Xác định data model
4. Implement backend
5. Implement web
6. Implement mobile
7. Viết tests
8. Chạy validation
9. Cập nhật docs
10. Ghi lại limitation và next steps
```

Không bắt đầu từ UI nếu data flow và contracts chưa rõ.

---

# Definition of Done

Một feature hoặc phase chỉ được coi là hoàn thành khi:

```txt
Typecheck pass
Lint pass
Tests pass
Build pass
Contracts không bị duplicate
Không có forbidden import
Không có secret trong client
Ownership checks đầy đủ
Error states được xử lý
Web flow hoạt động
Mobile flow hoạt động nếu có UI
Docs được cập nhật
Known limitations được ghi rõ
```

---

# Nguyên tắc ưu tiên

```txt
Correctness trước abstraction
Core loop trước feature breadth
Security trước convenience
Persisted state trước UI-only state
Contracts trước implementation
Một provider trước multi-provider
Một module ổn định trước nhiều module dang dở
Web và mobile thực dụng trước shared UI hoàn hảo
```

Đây là spec nền. Chi tiết từng phase và feature được mở rộng dần trong `docs/FEATURES/` và `docs/DECISIONS/` khi bắt đầu triển khai.
