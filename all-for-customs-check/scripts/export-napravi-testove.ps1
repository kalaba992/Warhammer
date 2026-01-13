Param(
  [Parameter(Mandatory = $true)]
  [string]$InputXlsx,

  [Parameter(Mandatory = $true)]
  [string]$OutputJson
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $InputXlsx)) {
  throw "Input file not found: $InputXlsx"
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$wb = $excel.Workbooks.Open($InputXlsx, $null, $true)
try {
  $ws = $wb.Worksheets.Item('Testovi')

  $used = $ws.UsedRange
  $rows = $used.Rows.Count

  $out = New-Object System.Collections.Generic.List[object]

  for ($r = 2; $r -le $rows; $r++) {
    $nazivDe = [string]$ws.Cells.Item($r, 1).Text
    $prevodBs = [string]$ws.Cells.Item($r, 2).Text
    $tarifni = [string]$ws.Cells.Item($r, 3).Text
    $postotak = [string]$ws.Cells.Item($r, 4).Text

    if ((-not $nazivDe) -and (-not $prevodBs) -and (-not $tarifni) -and (-not $postotak)) {
      continue
    }

    $out.Add([pscustomobject]@{
      row = $r
      naziv_na_njemackom = ($(if ($null -eq $nazivDe) { '' } else { $nazivDe })).Trim()
      prevod_na_bosanski = ($(if ($null -eq $prevodBs) { '' } else { $prevodBs })).Trim()
      tarifni_broj = ($(if ($null -eq $tarifni) { '' } else { $tarifni })).Trim()
      postotak_carine = ($(if ($null -eq $postotak) { '' } else { $postotak })).Trim()
    }) | Out-Null
  }

  $payload = [pscustomobject]@{
    source = (Resolve-Path $InputXlsx).Path
    sheet = 'Testovi'
    exported_at = (Get-Date).ToString('o')
    row_count = $out.Count
    rows = $out
  }

  $outDir = Split-Path -Parent $OutputJson
  if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
  }

  $payload | ConvertTo-Json -Depth 6 | Set-Content -Path $OutputJson -Encoding UTF8
} finally {
  $wb.Close($false) | Out-Null
  $excel.Quit() | Out-Null

  if ($ws) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($ws) }
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb)
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
