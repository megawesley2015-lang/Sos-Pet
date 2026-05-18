# gp.ps1 — Git commit + push sem travar no HEAD.lock do FUSE
# Uso: .\scripts\gp.ps1 "mensagem do commit"
# Ou adicione ao seu perfil PowerShell como função global (veja abaixo)

param(
  [Parameter(Mandatory=$true)]
  [string]$Message,
  [string]$Branch = "main"
)

Set-Location "C:\Users\wesley\Documents\Claude\Projects\sos-pet"

# Remove lock files deixados pelo sandbox Linux (FUSE não consegue deletar)
Remove-Item .git\HEAD.lock        -Force -ErrorAction SilentlyContinue
Remove-Item .git\index.lock       -Force -ErrorAction SilentlyContinue
Remove-Item .git\COMMIT_EDITMSG.lock -Force -ErrorAction SilentlyContinue

git add -A
git commit -m $Message
git push origin $Branch
