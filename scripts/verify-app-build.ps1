$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$appRoot = Join-Path $repoRoot "app"
$verifyOutDir = Join-Path $env:TEMP "qme-vite-build-verify"

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CommandArgs
  )

  & $Command @CommandArgs
  if ($LASTEXITCODE -ne 0) {
    throw "$Command failed with exit code $LASTEXITCODE"
  }
}

Push-Location $appRoot
try {
  Invoke-Checked "npx" "tsc" "-b"
  Invoke-Checked "npx" "vite" "build" "--outDir" $verifyOutDir "--emptyOutDir" "true"
}
finally {
  Pop-Location
}
