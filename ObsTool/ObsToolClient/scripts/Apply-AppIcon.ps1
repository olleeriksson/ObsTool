param(
    [int] $VariantNumber = 0
)

$ErrorActionPreference = "Stop"

$clientRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$publicRoot = Join-Path $clientRoot "public"
$activeIconRoot = Join-Path $publicRoot "icons"
$variantRoot = Join-Path $activeIconRoot "variants"

function Write-IcoFromPngs {
    param(
        [Parameter(Mandatory = $true)]
        [string] $IcoPath,

        [Parameter(Mandatory = $true)]
        [array] $PngEntries
    )

    # Writes a multi-size ICO file from PNG payloads so browser favicon support stays broad.
    $stream = [System.IO.File]::Open($IcoPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
    try {
        $writer = [System.IO.BinaryWriter]::new($stream)
        try {
            $writer.Write([UInt16]0)
            $writer.Write([UInt16]1)
            $writer.Write([UInt16]$PngEntries.Count)

            $offset = 6 + (16 * $PngEntries.Count)
            $payloads = @()
            foreach ($entry in $PngEntries) {
                $bytes = [System.IO.File]::ReadAllBytes($entry.Path)
                $payloads += [pscustomobject]@{
                    Size = [int]$entry.Size
                    Bytes = $bytes
                    Offset = $offset
                }
                $offset += $bytes.Length
            }

            foreach ($payload in $payloads) {
                $sizeByte = if ($payload.Size -eq 256) { 0 } else { [byte]$payload.Size }
                $writer.Write([byte]$sizeByte)
                $writer.Write([byte]$sizeByte)
                $writer.Write([byte]0)
                $writer.Write([byte]0)
                $writer.Write([UInt16]1)
                $writer.Write([UInt16]32)
                $writer.Write([UInt32]$payload.Bytes.Length)
                $writer.Write([UInt32]$payload.Offset)
            }

            foreach ($payload in $payloads) {
                $writer.Write($payload.Bytes)
            }
        }
        finally {
            $writer.Dispose()
        }
    }
    finally {
        $stream.Dispose()
    }
}

function Get-SelectedIconVariant {
    # Lists every available variant folder and asks the user to choose one by number.
    $variants = @(Get-ChildItem -LiteralPath $variantRoot -Directory | Sort-Object Name)
    if ($variants.Count -eq 0) {
        throw "No icon variants found in $variantRoot"
    }

    Write-Host "Available ObsTool app icon variants:"
    for ($index = 0; $index -lt $variants.Count; $index++) {
        Write-Host ("  {0}. {1}" -f ($index + 1), $variants[$index].Name)
    }

    $rawChoice = if ($VariantNumber -gt 0) { $VariantNumber.ToString() } else { Read-Host "Select icon variant number" }
    $selectedNumber = 0
    if (-not [int]::TryParse($rawChoice, [ref]$selectedNumber)) {
        throw "Invalid selection '$rawChoice'. Type a number from 1 to $($variants.Count)."
    }

    if ($selectedNumber -lt 1 -or $selectedNumber -gt $variants.Count) {
        throw "Invalid selection '$selectedNumber'. Type a number from 1 to $($variants.Count)."
    }

    $selectedVariant = $variants[$selectedNumber - 1]
    return [pscustomobject]@{
        Name = $selectedVariant.Name
        Path = $selectedVariant.FullName
    }
}

function Copy-SelectedIconFiles {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject] $Variant
    )

    # Copies the selected PNG set into the active public paths used by index.html and manifest.json.
    foreach ($size in @(16, 32, 48, 64, 180, 192, 512)) {
        $source = Join-Path $Variant.Path "icon-$size.png"
        $target = Join-Path $activeIconRoot "icon-$size.png"
        if (-not (Test-Path -LiteralPath $source)) {
            throw "Selected icon variant '$($Variant.Name)' is missing $source"
        }

        Copy-Item -LiteralPath $source -Destination $target -Force
    }

    Copy-Item -LiteralPath (Join-Path $Variant.Path "icon-180.png") -Destination (Join-Path $publicRoot "apple-touch-icon.png") -Force
    Write-IcoFromPngs -IcoPath (Join-Path $publicRoot "favicon.ico") -PngEntries @(
        @{ Size = 16; Path = Join-Path $Variant.Path "icon-16.png" },
        @{ Size = 32; Path = Join-Path $Variant.Path "icon-32.png" },
        @{ Size = 48; Path = Join-Path $Variant.Path "icon-48.png" },
        @{ Size = 64; Path = Join-Path $Variant.Path "icon-64.png" }
    )
}

$selectedVariant = Get-SelectedIconVariant
Copy-SelectedIconFiles -Variant $selectedVariant
Write-Host "Applied ObsTool app icon variant: $($selectedVariant.Name)"
