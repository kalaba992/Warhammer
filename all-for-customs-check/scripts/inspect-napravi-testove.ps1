param(
  [Parameter(Mandatory = $true)]
  [string]$Path
)

if (-not (Test-Path -LiteralPath $Path)) {
  Write-Error "Missing file: $Path"
  exit 1
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
  $wb = $excel.Workbooks.Open($Path)
  $ws = $wb.Worksheets.Item(1)
  $used = $ws.UsedRange

  $cols = $used.Columns.Count
  $rows = $used.Rows.Count

  $headers = for ($c = 1; $c -le $cols; $c++) {
    [string]$used.Cells.Item(1, $c).Text
  }

  $row2 = for ($c = 1; $c -le $cols; $c++) {
    [string]$used.Cells.Item(2, $c).Text
  }

  [pscustomobject]@{
    sheet = $ws.Name
    rows = $rows
    cols = $cols
    headers = $headers
    sampleRow2 = $row2
  } | ConvertTo-Json -Depth 5
}
finally {
  if ($wb) { $wb.Close($false) | Out-Null }
  $excel.Quit() | Out-Null

  foreach ($obj in @($used, $ws, $wb, $excel)) {
    if ($null -ne $obj) {
      [System.Runtime.InteropServices.Marshal]::ReleaseComObject($obj) | Out-Null
    }
  }

  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
