$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$javaHome = 'C:\Program Files\Microsoft\jdk-25.0.4.101-hotspot'
$mavenCmd = 'C:\tools\apache-maven-3.9.9\bin\mvn.cmd'
$backendPath = Join-Path $projectRoot 'backend'
$aiPath = Join-Path $projectRoot 'ai-service'
$frontendPath = Join-Path $projectRoot 'frontend'

$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$env:Path"

Write-Host 'Iniciando backend...'
Start-Process powershell -ArgumentList @('-NoExit', '-Command', "cd '$backendPath'; & '$mavenCmd' spring-boot:run")

Start-Sleep -Seconds 2
Write-Host 'Iniciando servicio IA...'
Start-Process powershell -ArgumentList @('-NoExit', '-Command', "cd '$projectRoot'; python -m uvicorn ai-service.app.main:app --host 0.0.0.0 --port 8000")

Start-Sleep -Seconds 2
Write-Host 'Iniciando frontend...'
Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', "cd '$frontendPath'; npm run dev -- --host 0.0.0.0 --port 5173")

Start-Sleep -Seconds 4
Write-Host 'Abriendo la app...'
Start-Process 'http://localhost:5173'

Write-Host 'Todo arrancado. Abre http://localhost:5173'
