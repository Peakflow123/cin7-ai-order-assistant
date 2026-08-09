$ErrorActionPreference = "Stop"

function Add-LineAfterMatch {
  param(
    [string]$Path,
    [string]$RequiredText1,
    [string]$RequiredText2,
    [string]$InsertLine,
    [string]$AlreadyExistsText
  )

  if (!(Test-Path $Path)) {
    throw "File not found: $Path"
  }

  $lines = Get-Content -LiteralPath $Path

  if (($lines -join "`n") -match [regex]::Escape($AlreadyExistsText)) {
    Write-Host "[SKIP] Already exists in $Path -> $AlreadyExistsText"
    return $false
  }

  $output = New-Object System.Collections.Generic.List[string]
  $inserted = $false

  foreach ($line in $lines) {
    $output.Add($line)
    if (-not $inserted -and $line.Contains($RequiredText1) -and $line.Contains($RequiredText2)) {
      $leading = ""
      if ($line -match "^(\s*)") { $leading = $matches[1] }
      $output.Add($leading + $InsertLine)
      $inserted = $true
    }
  }

  if (-not $inserted) {
    throw "Could not find line containing both '$RequiredText1' and '$RequiredText2' in $Path"
  }

  Set-Content -LiteralPath $Path -Value $output -Encoding UTF8
  Write-Host "[OK] Updated $Path"
  return $true
}

$clientFile = "components\ClientPortalFrame.tsx"
$adminFile = "app\admin\launch\AdminPortalShell.tsx"

# Client desktop navigation array: add Billing after Channels.
Add-LineAfterMatch `
  -Path $clientFile `
  -RequiredText1 "/email" `
  -RequiredText2 "Channels" `
  -InsertLine "{ href: '/billing', label: 'Billing' }," `
  -AlreadyExistsText "/billing"

# Client mobile navigation array: add Billing after Channels if the file has a separate icon navigation array.
# If /billing already exists from desktop insertion, this safely skips because Billing exists already.
# The client file currently uses the same file for both desktop and mobile arrays; this script avoids duplicate insertions.

# Admin navigation: add Billing after Clients.
Add-LineAfterMatch `
  -Path $adminFile `
  -RequiredText1 "Clients" `
  -RequiredText2 "/admin" `
  -InsertLine "{ label: 'Billing', href: '/admin/billing' }," `
  -AlreadyExistsText "/admin/billing"

Write-Host ""
Write-Host "Billing navigation patch completed."
Write-Host "Now verify with:"
Write-Host "findstr /N /I billing components\ClientPortalFrame.tsx"
Write-Host "findstr /N /I billing app\admin\launch\AdminPortalShell.tsx"
