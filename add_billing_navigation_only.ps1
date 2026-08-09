$ErrorActionPreference = "Stop"

$clientFile = "components\ClientPortalFrame.tsx"
$adminFile = "app\admin\launch\AdminPortalShell.tsx"

if (!(Test-Path $clientFile)) { throw "Missing file: $clientFile" }
if (!(Test-Path $adminFile)) { throw "Missing file: $adminFile" }

$client = Get-Content -Raw -LiteralPath $clientFile
$admin = Get-Content -Raw -LiteralPath $adminFile

$clientOriginal = $client
$adminOriginal = $admin

# CLIENT NAVIGATION: add Billing between Channels and Settings, without changing any existing labels/order.
if ($client -notmatch "href:\s*['\"`]/billing['\"`]") {
  $client = $client -replace "(\{\s*label:\s*['\"`]Channels['\"`],\s*href:\s*['\"`]/email['\"`]\s*\},\s*)", "`$1`r`n  { label: 'Billing', href: '/billing' },"
}

# ADMIN NAVIGATION: add Billing after Clients, without changing other labels/order.
if ($admin -notmatch "href:\s*['\"`]/admin/billing['\"`]") {
  $admin = $admin -replace "(\{\s*label:\s*['\"`]Clients['\"`],\s*href:\s*['\"`]/admin/launch/clients['\"`]\s*\},\s*)", "`$1`r`n  { label: 'Billing', href: '/admin/billing' },"
  $admin = $admin -replace "(\{\s*label:\s*['\"`]Clients['\"`],\s*href:\s*['\"`]/admin/clients['\"`]\s*\},\s*)", "`$1`r`n  { label: 'Billing', href: '/admin/billing' },"
}

if ($client -eq $clientOriginal -and $client -notmatch "href:\s*['\"`]/billing['\"`]") {
  throw "Could not add Billing to client navigation. Existing file pattern not recognized. No files were changed."
}

if ($admin -eq $adminOriginal -and $admin -notmatch "href:\s*['\"`]/admin/billing['\"`]") {
  throw "Could not add Billing to admin navigation. Existing file pattern not recognized. No files were changed."
}

Set-Content -LiteralPath $clientFile -Value $client -NoNewline
Set-Content -LiteralPath $adminFile -Value $admin -NoNewline

Write-Host "OK: Billing link added to client/admin navigation only."
Write-Host "Changed files:"
Write-Host " - $clientFile"
Write-Host " - $adminFile"
