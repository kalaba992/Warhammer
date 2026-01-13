Param(
  [Parameter(Mandatory = $true)]
  [string]$InputXlsx,

  [Parameter(Mandatory = $false)]
  [string]$OutputXlsx,

  [Parameter(Mandatory = $false)]
  [string]$SummaryJson,

  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $InputXlsx)) {
  throw "Input file not found: $InputXlsx"
}

if (-not $OutputXlsx -or $OutputXlsx.Trim().Length -eq 0) {
  $dir = Split-Path -Parent $InputXlsx
  $base = [IO.Path]::GetFileNameWithoutExtension($InputXlsx)
  $OutputXlsx = Join-Path $dir ($base + '.autofilled.xlsx')
}

if (-not $SummaryJson -or $SummaryJson.Trim().Length -eq 0) {
  $SummaryJson = Join-Path (Split-Path -Parent $OutputXlsx) ([IO.Path]::GetFileNameWithoutExtension($OutputXlsx) + '.summary.json')
}

# Current app demo HS database (src/lib/hsCodeDatabase.ts)
# Note: this is intentionally small; autofill will only work for products matching these categories.
$candidates = @(
  [pscustomobject]@{ code='1101.00.10'; duty='10%'; keywords=@('mehl','weizen','mengkorn','roggen','brasno','brašno','razi','raži','flour') },
  [pscustomobject]@{ code='1701.99.10'; duty='50 EUR/100kg'; keywords=@('zucker','rübenzucker','rohrzucker','saccharose','saharoza','secer','šećer','sugar') },
  [pscustomobject]@{ code='8471.30.00'; duty='0%'; keywords=@('computer','pc','laptop','datenverarbeitung','data processing','računar','racunar','računari','maschine') },
  [pscustomobject]@{ code='2203.00.10'; duty='0 EUR/hl'; keywords=@('bier','pivo','beer','malz','slad','malt') },
  [pscustomobject]@{ code='6203.42.11'; duty='12%'; keywords=@('hosen','hose','trousers','pantalone','hlače','hlace','šorcevi','sorcevi','bermude','baumwolle','cotton','pamuk') },
  [pscustomobject]@{ code='0901.21.00'; duty='7.5%'; keywords=@('kaffee','kafa','coffee','geröstet','gerostet','kofein','caffeine') }
)

function Get-BestMatch {
  Param(
    [string]$text
  )

  $t = ($text | ForEach-Object { $_ })
  if ($null -eq $t) { $t = '' }
  $t = $t.ToLowerInvariant()

  $best = $null
  $bestScore = 0
  $bestHits = @()

  foreach ($c in $candidates) {
    $score = 0
    $hits = New-Object System.Collections.Generic.List[string]

    foreach ($kw in $c.keywords) {
      if (-not $kw) { continue }
      $k = $kw.ToLowerInvariant()
      if ($t.Contains($k)) {
        $score++
        if ($hits.Count -lt 12) { $hits.Add($kw) | Out-Null }
      }
    }

    # small boost if the exact HS code appears in text
    if ($t.Contains(($c.code -replace '\.', ''))) { $score += 2 }
    if ($t.Contains($c.code.ToLowerInvariant())) { $score += 2 }

    if ($score -gt $bestScore) {
      $bestScore = $score
      $best = $c
      $bestHits = $hits
    }
  }

  return [pscustomobject]@{
    best = $best
    score = $bestScore
    hits = $bestHits
  }
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$wb = $excel.Workbooks.Open($InputXlsx, $null, $false)
try {
  $ws = $wb.Worksheets.Item('Testovi')
  $rows = $ws.UsedRange.Rows.Count

  $filled = 0
  $skippedExisting = 0
  $unmatched = 0

  $examples = New-Object System.Collections.Generic.List[object]

  for ($r = 2; $r -le $rows; $r++) {
    $nazivDe = [string]$ws.Cells.Item($r, 1).Text
    $prevodBs = [string]$ws.Cells.Item($r, 2).Text
    $tarifni = [string]$ws.Cells.Item($r, 3).Text
    $postotak = [string]$ws.Cells.Item($r, 4).Text

    $tarifniTrim = ($(if ($null -eq $tarifni) { '' } else { $tarifni })).Trim()
    $postotakTrim = ($(if ($null -eq $postotak) { '' } else { $postotak })).Trim()

    if (-not $Force -and $tarifniTrim.Length -gt 0) {
      $skippedExisting++
      continue
    }

    $inputText = (($(if ($null -eq $nazivDe) { '' } else { $nazivDe })).Trim() + ' ' + ($(if ($null -eq $prevodBs) { '' } else { $prevodBs })).Trim()).Trim()
    if ($inputText.Length -eq 0) {
      continue
    }

    $match = Get-BestMatch -text $inputText

    # Require at least 2 keyword hits to fill; otherwise leave blank.
    if ($null -eq $match.best -or $match.score -lt 2) {
      $unmatched++
      continue
    }

    $ws.Cells.Item($r, 3).Value2 = $match.best.code
    if ($Force -or $postotakTrim.Length -eq 0) {
      $ws.Cells.Item($r, 4).Value2 = $match.best.duty
    }

    $filled++

    if ($examples.Count -lt 20) {
      $examples.Add([pscustomobject]@{
        row = $r
        input = $inputText
        filled_tarifni_broj = $match.best.code
        filled_postotak_carine = $match.best.duty
        score = $match.score
        hits = $match.hits
      }) | Out-Null
    }
  }

  $wb.SaveAs($OutputXlsx) | Out-Null

  $reportPayload = [pscustomobject]@{
    input = (Resolve-Path $InputXlsx).Path
    output = (Resolve-Path (Split-Path -Parent $OutputXlsx)).Path + '\\' + (Split-Path -Leaf $OutputXlsx)
    sheet = 'Testovi'
    total_rows = $rows
    filled_rows = $filled
    skipped_existing = $skippedExisting
    unmatched_rows = $unmatched
    note = 'Autofill uses a small demo HS database from the app; unmatched rows are expected.'
    examples = $examples
  }

  $reportPayload | ConvertTo-Json -Depth 6 | Set-Content -Path $SummaryJson -Encoding UTF8

  Write-Output ($reportPayload | ConvertTo-Json -Depth 3)
} finally {
  $wb.Close($false) | Out-Null
  $excel.Quit() | Out-Null

  if ($ws) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($ws) }
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb)
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
