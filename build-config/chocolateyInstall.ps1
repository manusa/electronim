$packageName = 'electronim'
$file = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)\electronim-win-x64.zip"
$unzipLocation = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)\electronim"


Install-ChocolateyZipPackage  `
    -PackageName $packageName `
    -File $file `
    -UnzipLocation $unzipLocation `

Install-BinFile -Name $packageName -Path 'electronim.exe'
