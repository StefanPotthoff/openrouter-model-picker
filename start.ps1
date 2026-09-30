# startet das Backend in einem neuen Fenster und danach den Frontend-Dev-Server
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process -FilePath 'dotnet' -ArgumentList 'run', '--project', "$root\backend\OpenRouterModelPicker.Api" -WorkingDirectory $root

Push-Location "$root\frontend"
if (-not (Test-Path 'node_modules')) {
    npm install
}
npm run dev
Pop-Location
