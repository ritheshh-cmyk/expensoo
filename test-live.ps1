$pass = 0
$fail = 0

function Show-Result($name, $ok) {
    if ($ok) {
        Write-Host "OK  $name" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "FAIL  $name" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host "`n=== LIVE SERVER TESTS ===" -ForegroundColor Cyan

# 1 – Dev server
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:5173/' -TimeoutSec 5 -UseBasicParsing
    Show-Result "Dev server responds 200" ($r.StatusCode -eq 200)
    Show-Result "HTML has root div" ($r.Content -match 'id="root"')
    Show-Result "HTML references main JS bundle" ($r.Content -match '\.js')
} catch {
    Show-Result "Dev server responds 200" $false
    Show-Result "HTML has root div" $false
    Show-Result "HTML references main JS bundle" $false
}

# 2 – API proxy
try {
    $api = Invoke-WebRequest -Uri 'http://localhost:5173/api/health' -TimeoutSec 8 -UseBasicParsing
    Show-Result "API proxy /api/health ($($api.StatusCode))" ($api.StatusCode -lt 500)
    Show-Result "API returns JSON body" ($api.Content -match '\{')
} catch {
    Show-Result "API proxy /api/health reachable" $false
    Show-Result "API returns JSON body" $false
}

# 3 – Static asset sanity
try {
    $sw = Invoke-WebRequest -Uri 'http://localhost:5173/@vite/client' -TimeoutSec 5 -UseBasicParsing
    Show-Result "Vite HMR client served" ($sw.StatusCode -eq 200)
} catch {
    Show-Result "Vite HMR client served" $false
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "LIVE RESULT: $pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host "========================================`n" -ForegroundColor Cyan
