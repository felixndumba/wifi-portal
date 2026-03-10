Remove-Item -Path "c:/Users/USER/desktop/wifi-portal/prisma" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "c:/Users/USER/desktop/wifi-portal/prisma.config.ts" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "c:/Users/USER/desktop/wifi-portal/cleanup.js" -Force -ErrorAction SilentlyContinue
Write-Output "Deleted prisma files"
