$packageName = 'electronim'
$file = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)\electronim-win-x64.zip"
$hash = 1337
$unzipLocation = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)\electronim"


Install-ChocolateyZipPackage  `
    -PackageName $packageName `
    -File $file `
    -UnzipLocation $unzipLocation `
    -Checksum $hash `
    -ChecksumType 'SHA256' `

Install-BinFile -Name $packageName -Path 'electronim.exe'
