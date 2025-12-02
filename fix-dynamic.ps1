# Script per aggiungere 'export const dynamic = force-dynamic' ai file necessari

# API Routes (aggiunge dopo gli import)
$apiRoutes = @(
    "src/app/api/pagamenti/route.ts",
    "src/app/api/pagamenti/prestazioni/route.ts",
    "src/app/api/report/trend/route.ts",
    "src/app/api/report/kpi/route.ts",
    "src/app/api/fatturazione/da-fatturare/route.ts",
    "src/app/api/fatturazione/statistiche/route.ts",
    "src/app/api/auth/miei-permessi/route.ts",
    "src/app/api/auth/verifica-invito/route.ts",
    "src/app/api/auth/profilo/route.ts",
    "src/app/api/permessi/route.ts",
    "src/app/api/impostazioni/email/route.ts",
    "src/app/api/impostazioni/azienda/route.ts",
    "src/app/api/dashboard/route.ts",
    "src/app/api/export/artisti/route.ts",
    "src/app/api/export/locali/route.ts"
)

# Pagine client con useSearchParams
$clientPages = @(
    "src/app/(auth)/registrazione/page.tsx",
    "src/app/(auth)/registrazione/artista/page.tsx",
    "src/app/(auth)/registrazione/locale/page.tsx",
    "src/app/(auth)/registrazione/completa/page.tsx",
    "src/app/(auth)/reset-password/conferma/page.tsx",
    "src/app/(dashboard)/fatture/nuova/page.tsx",
    "src/app/(dashboard)/fatturazione/agibilita/page.tsx",
    "src/app/(dashboard)/page.tsx"
)

$dynamicExport = "export const dynamic = 'force-dynamic'"

Write-Host "=== Aggiungendo dynamic export alle API routes ===" -ForegroundColor Cyan

foreach ($file in $apiRoutes) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Verifica se già presente
        if ($content -match "export const dynamic") {
            Write-Host "  [SKIP] $file - già presente" -ForegroundColor Yellow
            continue
        }
        
        # Trova la fine degli import (ultima riga che inizia con 'import')
        $lines = $content -split "`n"
        $lastImportIndex = -1
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^import ") {
                $lastImportIndex = $i
            }
        }
        
        if ($lastImportIndex -ge 0) {
            # Inserisce dopo l'ultimo import
            $newLines = @()
            for ($i = 0; $i -lt $lines.Count; $i++) {
                $newLines += $lines[$i]
                if ($i -eq $lastImportIndex) {
                    $newLines += ""
                    $newLines += $dynamicExport
                }
            }
            $newContent = $newLines -join "`n"
            Set-Content -Path $file -Value $newContent -Encoding UTF8 -NoNewline
            Write-Host "  [OK] $file" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] $file - nessun import trovato" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [MISS] $file - file non trovato" -ForegroundColor Red
    }
}

Write-Host "`n=== Aggiungendo dynamic export alle pagine client ===" -ForegroundColor Cyan

foreach ($file in $clientPages) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Verifica se già presente
        if ($content -match "export const dynamic") {
            Write-Host "  [SKIP] $file - già presente" -ForegroundColor Yellow
            continue
        }
        
        # Per pagine client, inserisce dopo 'use client'
        if ($content -match "^'use client'") {
            $newContent = $content -replace "^'use client'", "'use client'`n`n$dynamicExport"
            Set-Content -Path $file -Value $newContent -Encoding UTF8 -NoNewline
            Write-Host "  [OK] $file" -ForegroundColor Green
        } elseif ($content -match '^"use client"') {
            $newContent = $content -replace '^"use client"', "`"use client`"`n`n$dynamicExport"
            Set-Content -Path $file -Value $newContent -Encoding UTF8 -NoNewline
            Write-Host "  [OK] $file" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] $file - 'use client' non trovato" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [MISS] $file - file non trovato" -ForegroundColor Red
    }
}

Write-Host "`n=== Completato ===" -ForegroundColor Cyan
Write-Host "Ora esegui: npm run build" -ForegroundColor White