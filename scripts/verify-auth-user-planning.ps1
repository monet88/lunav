param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('US-004', 'US-005', 'US-006', 'US-007', 'US-008')]
    [string]$StoryId
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

$storyFolders = @{
    'US-004' = 'docs/stories/US-004-auth-user-epic'
    'US-005' = 'docs/stories/US-005-auth-session-identity'
    'US-006' = 'docs/stories/US-006-profile-persistence-rls'
    'US-007' = 'docs/stories/US-007-web-auth-account'
    'US-008' = 'docs/stories/US-008-mobile-auth-account'
}

$requiredStoryFiles = @('overview.md', 'design.md', 'validation.md', 'execplan.md')
$storyFolder = Join-Path $repoRoot $storyFolders[$StoryId]

foreach ($fileName in $requiredStoryFiles) {
    $path = Join-Path $storyFolder $fileName
    if (-not (Test-Path $path)) {
        throw "Missing required story artifact: $path"
    }
}

if ($StoryId -eq 'US-004') {
    $requiredEpicFiles = @(
        'docs/superpowers/specs/2026-07-10-auth-user-epic-design.md',
        'docs/superpowers/plans/2026-07-10-auth-user-epic.md'
    )

    foreach ($relativePath in $requiredEpicFiles) {
        $path = Join-Path $repoRoot $relativePath
        if (-not (Test-Path $path)) {
            throw "Missing required epic artifact: $path"
        }
    }
}

$overview = Get-Content (Join-Path $storyFolder 'overview.md') -Raw
if ($overview -notmatch 'high-risk') {
    throw "$StoryId must remain in the high-risk lane"
}

$packet = $requiredStoryFiles |
    ForEach-Object { Get-Content (Join-Path $storyFolder $_) -Raw } |
    Out-String

$requiredMarkers = @{
    'US-004' = @('US-005', 'US-006', 'US-007', 'US-008', 'exclusive ownership')
    'US-005' = @('apps/web/proxy.ts', 'email confirmation', 'canonical pathname', 'cleanup')
    'US-006' = @('UPDATE (display_name)', 'auth.uid()', 'cross-user', 'updated_at')
    'US-007' = @('enumeration-safe', 'replayed', 'secure cookie', 'verified user')
    'US-008' = @('Android App Links', 'assetlinks.json', 'replayed', 'Android emulator')
}

foreach ($marker in $requiredMarkers[$StoryId]) {
    if ($packet -notmatch [regex]::Escape($marker)) {
        throw "$StoryId planning packet is missing required marker: $marker"
    }
}

$planningBoundary = 'This planning verifier authorizes scheduling, not implementation completion.'
if ($packet -notmatch [regex]::Escape($planningBoundary)) {
    throw "$StoryId planning packet does not protect the planning/implementation proof boundary"
}

Write-Output "$StoryId planning packet verified"