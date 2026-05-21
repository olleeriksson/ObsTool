# Creates a dated release marker on the default branch, merges it to release, and pushes both branches after confirmation.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [string]$FailureMessage
    )

    $output = & git @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ([string]::IsNullOrWhiteSpace($FailureMessage)) {
            $FailureMessage = "Git command failed: git $($Arguments -join ' ')"
        }

        Stop-Release $FailureMessage
    }

    $output | ForEach-Object { Write-Host $_ }
}

function Get-GitOutput {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    $output = & git @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        Stop-Release "Git command failed: git $($Arguments -join ' ')"
    }

    return $output
}

function Confirm-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Prompt
    )

    $answer = Read-Host "$Prompt [y/N]"
    return $answer -match '^(?i:y|yes)$'
}

function Stop-Release {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host "Release aborted: $Message"
    exit 1
}

function Get-DefaultBranch {
    $mainExists = $false
    $masterExists = $false

    & git show-ref --verify --quiet refs/heads/main
    if ($LASTEXITCODE -eq 0) {
        $mainExists = $true
    }

    & git show-ref --verify --quiet refs/heads/master
    if ($LASTEXITCODE -eq 0) {
        $masterExists = $true
    }

    if ($mainExists) {
        return 'main'
    }

    if ($masterExists) {
        return 'master'
    }

    Stop-Release 'No local main or master branch was found.'
}

function Assert-CleanWorkingTree {
    $status = @(Get-GitOutput @('status', '--porcelain'))
    if ($status.Count -gt 0) {
        Stop-Release 'The git working tree is not clean. Commit, stash, or discard staged, unstaged, and untracked files before releasing.'
    }
}

function Assert-OnBranch {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Branch
    )

    $currentBranch = (Get-GitOutput @('branch', '--show-current') | Select-Object -First 1)
    if ([string]::IsNullOrWhiteSpace($currentBranch)) {
        Stop-Release "The repository is in detached HEAD state. Check out '$Branch' before releasing."
    }

    if ($currentBranch -ne $Branch) {
        Stop-Release "You are on '$currentBranch'. Check out '$Branch' before releasing."
    }
}

function Add-ReleaseLine {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ReleaseFile
    )

    $today = Get-Date -Format 'yyyy-MM-dd'

    if (-not (Test-Path -LiteralPath $ReleaseFile)) {
        New-Item -ItemType File -Path $ReleaseFile | Out-Null
    }

    $existingLines = @(Get-Content -LiteralPath $ReleaseFile -ErrorAction SilentlyContinue)
    $escapedToday = [regex]::Escape($today)
    $todaysReleaseCount = @($existingLines | Where-Object { $_ -match "^$escapedToday(?:-\d{2})?\s+-\s*" }).Count

    if ($todaysReleaseCount -eq 0) {
        $releaseName = $today
    }
    else {
        $releaseName = '{0}-{1:D2}' -f $today, ($todaysReleaseCount + 1)
    }

    Add-Content -LiteralPath $ReleaseFile -Value ('{0,-13} - ' -f $releaseName)
}

try {
    $repoRoot = (Get-GitOutput @('rev-parse', '--show-toplevel') | Select-Object -First 1)
    Set-Location -LiteralPath $repoRoot

    $defaultBranch = Get-DefaultBranch
    Assert-OnBranch $defaultBranch
    Assert-CleanWorkingTree

    $releaseFile = Join-Path $repoRoot 'RELEASES.txt'
    Add-ReleaseLine $releaseFile

    Write-Host ''
    Write-Host 'Last 8 lines of RELEASES.txt:'
    Get-Content -LiteralPath $releaseFile -Tail 8 | ForEach-Object { Write-Host $_ }
    Write-Host ''

    if (-not (Confirm-Step 'Commit this RELEASES.txt change?')) {
        Stop-Release 'Canceled before commit.'
    }

    Invoke-Git @('add', '--', 'RELEASES.txt') 'Could not stage RELEASES.txt.'
    Invoke-Git @('commit', '-m', 'Add release marker') 'Could not commit RELEASES.txt.'

    Assert-OnBranch $defaultBranch
    Invoke-Git @('push', 'origin', $defaultBranch) "Could not push '$defaultBranch' to origin."

    Invoke-Git @('checkout', 'release') "Could not check out the 'release' branch."
    Invoke-Git @('merge', $defaultBranch) "Could not merge '$defaultBranch' into 'release'."

    if (-not (Confirm-Step "Push 'release' to origin?")) {
        Stop-Release "Canceled before pushing 'release'."
    }

    Invoke-Git @('push', 'origin', 'release') "Could not push 'release' to origin."

    Write-Host "Release completed successfully. '$defaultBranch' has been merged into 'release' and pushed."
}
catch {
    Write-Host "Release aborted: $($_.Exception.Message)"
    exit 1
}
