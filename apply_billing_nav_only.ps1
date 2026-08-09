# NexOrder AI - Billing Navigation Only Patch
# This script makes ONLY two small navigation changes:
# 1. Adds Billing to the client portal navigation between Channels and Settings.
# 2. Adds Billing to the admin Control Center navigation after Clients.
# It does not replace layout files and does not touch auth, Stripe, billing logic, Gmail, Outlook, Cin7, or database files.

$ErrorActionPreference = "Stop"

$root = Get-Location
$clientFile = Join-Path $root "components\ClientPortalFrame.tsx"
$adminFile = Join-Path $root "app\admin\launch\AdminPortalShell.tsx"

if (!(Test-Path $clientFile)) {
  throw "Client navigation file not found: $clientFile"
}

if (!(Test-Path $adminFile)) {
  throw "Admin navigation file not found: $adminFile"
}

# Create backups before editing
Copy-Item $clientFile "$clientFile.bak-billing-nav" -Force
Copy-Item $adminFile "$adminFile.bak-billing-nav" -Force

$client = Get-Content -Raw -LiteralPath $clientFile
$admin = Get-Content -Raw -LiteralPath $adminFile

# Add client Billing link only if missing
if ($client -notmatch "href:\s*['\"`]/billing['\"`]") {
  $clientPatterns = @(
    "\{\s*label:\s*['\"`]Channels['\"`],\s*href:\s*['\"`]/email['\"`]\s*\},\s*\r?\n\s*\{\s*label:\s*['\"`]Settings['\"`],\s*href:\s*['\"`]/settings['\"`]\s*\}",
    "\{\s*label:\s*['\"`]Channels['\"`],\s*href:\s*['\"`]/email['\"`]\s*\},\s*\r?\n\s*\{\s*label:\s*['\"`]Cin7['\"`],\s*href:\s*['\"`]/settings['\"`]\s*\}"
  )

  $clientReplacement = "{ label: 'Channels', href: '/email' },`r`n  { label: 'Billing', href: '/billing' },`r`n  { label: 'Settings', href: '/settings' }"
  $changed = $false

  foreach ($pattern in $clientPatterns) {
    if ($client -match $pattern) {
      $client = [regex]::Replace($client, $pattern, $clientReplacement, 1)
      $changed = $true
      break
    }
  }

  if (-not $changed) {
    throw "Could not safely find client Channels -> Settings navigation area. No client file changes were written."
  }

  Set-Content -LiteralPath $clientFile -Value $client -NoNewline
  Write-Host "[OK] Added Billing to client navigation."
} else {
  Write-Host "[SKIP] Client Billing link already exists."
}

# Add admin Billing link only if missing
if ($admin -notmatch "href:\s*['\"`]/admin/billing['\"`]") {
  $adminPatterns = @(
    "\{\s*label:\s*['\"`]Clients['\"`],\s*href:\s*['\"`]/admin/launch/clients['\"`]\s*\},",
    "\{\s*label:\s*['\"`]Clients['\"`],\s*href:\s*['\"`]/admin/clients['\"`]\s*\},"
  )

  $changed = $false
  foreach ($pattern in $adminPatterns) {
    if ($admin -match $pattern) {
      $matchText = ([regex]::Match($admin, $pattern)).Value
      $replacement = "$matchText`r`n  { label: 'Billing', href: '/admin/billing' },"
      $admin = [regex]::Replace($admin, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $replacement }, 1)
      $changed = $true
      break
    }
  }

  if (-not $changed) {
    throw "Could not safely find admin Clients navigation area. No admin file changes were written."
  }

  Set-Content -LiteralPath $adminFile -Value $admin -NoNewline
  Write-Host "[OK] Added Billing to admin navigation."
} else {
  Write-Host "[SKIP] Admin Billing link already exists."
}

Write-Host "Done. Review git diff before committing."
