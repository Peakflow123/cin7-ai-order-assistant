$ErrorActionPreference = "Stop"

$clientFile = "components\ClientPortalFrame.tsx"
$adminFile = "app\admin\launch\AdminPortalShell.tsx"

if (!(Test-Path $clientFile)) { throw "Missing file: $clientFile" }
if (!(Test-Path $adminFile)) { throw "Missing file: $adminFile" }

$client = Get-Content -Raw -LiteralPath $clientFile
$admin = Get-Content -Raw -LiteralPath $adminFile

$clientChanged = $false
$adminChanged = $false

# Client desktop nav array in current file uses: { href: '/email', label: 'Channels' }
if ($client -notmatch "href:\s*['\"`]/billing['\"`]") {
  $clientPattern = "\{\s*href:\s*['\"`]/email['\"`],\s*label:\s*['\"`]Channels['\"`]\s*\},"
  if ($client -match $clientPattern) {
    $client = [regex]::Replace(
      $client,
      $clientPattern,
      "{ href: '/email', label: 'Channels' },`r`n  { href: '/billing', label: 'Billing' },",
      1
    )
    $clientChanged = $true
  } else {
    throw "Could not find client Channels navigation line. No files changed."
  }
} else {
  Write-Host "[SKIP] Client Billing link already exists."
}

# Client mobile nav array currently has icons. Add Billing there too so mobile nav remains consistent.
if ($client -notmatch "href:\s*['\"`]/billing['\"`],\s*label:\s*['\"`]Billing['\"`],\s*icon") {
  $clientMobilePattern = "\{\s*href:\s*['\"`]/email['\"`],\s*label:\s*['\"`]Channels['\"`],\s*icon:\s*['\"`][^'\"`]*['\"`]\s*\},"
  if ($client -match $clientMobilePattern) {
    $matched = [regex]::Match($client, $clientMobilePattern).Value
    $client = [regex]::Replace(
      $client,
      $clientMobilePattern,
      "$matched`r`n  { href: '/billing', label: 'Billing', icon: '💳' },",
      1
    )
    $clientChanged = $true
  } else {
    Write-Host "[WARN] Could not find mobile Channels navigation line. Desktop Billing may still be added."
  }
}

# Admin nav may use label first or href first. Add after Clients only if missing.
if ($admin -notmatch "href:\s*['\"`]/admin/billing['\"`]") {
  $patterns = @(
    "\{\s*label:\s*['\"`]Clients['\"`],\s*href:\s*['\"`]/admin/launch/clients['\"`]\s*\},",
    "\{\s*href:\s*['\"`]/admin/launch/clients['\"`],\s*label:\s*['\"`]Clients['\"`]\s*\},",
    "\{\s*label:\s*['\"`]Clients['\"`],\s*href:\s*['\"`]/admin/clients['\"`]\s*\},",
    "\{\s*href:\s*['\"`]/admin/clients['\"`],\s*label:\s*['\"`]Clients['\"`]\s*\},"
  )
  foreach ($pattern in $patterns) {
    if ($admin -match $pattern) {
      $matched = [regex]::Match($admin, $pattern).Value
      $admin = [regex]::Replace($admin, $pattern, "$matched`r`n  { label: 'Billing', href: '/admin/billing' },", 1)
      $adminChanged = $true
      break
    }
  }
  if (-not $adminChanged) { throw "Could not find admin Clients navigation line. No files changed." }
} else {
  Write-Host "[SKIP] Admin Billing link already exists."
}

if ($clientChanged) {
  Set-Content -LiteralPath $clientFile -Value $client -NoNewline
  Write-Host "[OK] Updated client navigation only."
}
if ($adminChanged) {
  Set-Content -LiteralPath $adminFile -Value $admin -NoNewline
  Write-Host "[OK] Updated admin navigation only."
}

Write-Host "Done. Now run: findstr /S /N /I \"Billing /billing admin/billing\" components\*.tsx app\admin\launch\*.tsx"
