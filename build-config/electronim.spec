%global srcname electronim
%global pkg_name electronim
%global _optpkgdir /opt/%{pkg_name}
%global debug_package %{nil}

Name: electronim
Version: 0.0.0
Release: 0%{?dist}
Summary: Electron based multi IM (Instant Messaging) client
License: Apache-2.0
Url: https://github.com/manusa/electronim
# Tag sources
Source0: %{url}/archive/refs/tags/v%{version}.zip

%if 0%{?fedora} >= 37
BuildRequires: nodejs-npm
%else
BuildRequires: npm
%endif

BuildRequires: python3-devel
BuildRequires: gcc-c++
BuildRequires: git-core
BuildRequires: make
BuildRequires: libglvnd-devel
BuildRequires: libxcrypt-compat
ExclusiveArch: x86_64

%description
Electron based multi IM (Instant Messaging) client - Improve your productivity by combining all your instant messaging
applications (or whatever you want) into a single browser (Electron) window.

#-- PREP, BUILD & INSTALL -----------------------------------------------------#
%prep
%autosetup

%build
npm install
#TODO automate or remove GITHUB_REF workaround
GITHUB_REF=refs/tags/v%{version} node ./utils/version-from-tag.js
node ./utils/prepare-electron-builder.js
npm run build:linux

# Remove bin files that might collision with local system binaries
rm -f dist/linux-unpacked/resources/app.asar.unpacked/node_modules/nodehun/build/node_gyp_bins/python3

%install
# install everything to /opt/%%{pkg_name}
install -dp %{buildroot}%{_optpkgdir}
cp -Rp dist/linux-unpacked/* %{buildroot}%{_optpkgdir}
install -d %{buildroot}%{_optpkgdir}/assets
cp -Rp src/assets/* %{buildroot}%{_optpkgdir}/assets
install -m0755 -d %{buildroot}%{_bindir}
ln -sf %{_optpkgdir}/electronim %{buildroot}%{_bindir}/electronim

# install desktop file
install -dp %{buildroot}%{_datadir}/applications
install -Dp -m0755 build-config/electronim.desktop %{buildroot}%{_datadir}/applications


#-- FILES ---------------------------------------------------------------------#
%files
%license LICENSE
%doc CONTRIBUTING.md README.md
%{_optpkgdir}/*
%dir %{_datadir}/applications
%{_datadir}/applications/%{name}.desktop
%{_bindir}/electronim


