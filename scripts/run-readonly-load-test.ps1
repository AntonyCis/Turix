param(
  [string]$Config = '.\scripts\artillery-load-test.yml'
)

# npx descarga Artillery temporalmente si aun no esta instalado.
npx --yes artillery run $Config
