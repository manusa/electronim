%global srcname electronim
%global pkg_name electronim
%global _optpkgdir /opt/%{pkg_name}
%global debug_package %{nil}

Name: electronim
Version: 0.0.0
Release: 0%{?dist}
Summary: Combine chat services in one window
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
# gyp requires distutils provided now by python3-setuptools https://fedoraproject.org/wiki/Changes/Python3.12#The_Python_standard_library_distutils_module_will_be_removed
BuildRequires: python3-setuptools
BuildRequires: gcc-c++
BuildRequires: git-core
BuildRequires: make
BuildRequires: libglvnd-devel
BuildRequires: libxcrypt-compat
ExclusiveArch: x86_64 aarch64

# electron-builder only suffixes the unpacked directory for non-x64 architectures
%ifarch aarch64
%global unpacked_dir dist/linux-arm64-unpacked
%else
%global unpacked_dir dist/linux-unpacked
%endif

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
# Only the unpacked application is packaged. Copr also builds older tags with this spec, and
# the --dir flag works whatever the argument order of their build:linux script.
npm run build:linux -- --dir
# electron-builder ignores --dir when build:linux lists its own targets, fail instead of
# silently building (and racing) packages this RPM doesn't use
unexpected=$(find dist -mindepth 1 -maxdepth 1 ! -path '%{unpacked_dir}' ! -name builder-effective-config.yaml ! -name builder-debug.yml)
if [ -n "$unexpected" ] || [ ! -d %{unpacked_dir} ]; then
  echo "error: expected dist to contain only %{unpacked_dir}, build:linux must not list targets" >&2
  ls -1 dist >&2
  exit 1
fi

# Remove bin files that might collision with local system binaries
rm -f %{unpacked_dir}/resources/app.asar.unpacked/node_modules/nodehun/build/node_gyp_bins/python3

%install
# install everything to /opt/%%{pkg_name}
install -dp %{buildroot}%{_optpkgdir}
cp -Rp %{unpacked_dir}/* %{buildroot}%{_optpkgdir}
install -d %{buildroot}%{_optpkgdir}/assets
cp -Rp src/assets/* %{buildroot}%{_optpkgdir}/assets
install -m0755 -d %{buildroot}%{_bindir}
ln -sf %{_optpkgdir}/electronim %{buildroot}%{_bindir}/electronim

# install desktop file
install -dp %{buildroot}%{_datadir}/applications
install -Dp -m0755 build-config/electronim.desktop %{buildroot}%{_datadir}/applications

# install AppStream metainfo, so that software centers list the application. The build:linux script
# also copies it (and a desktop file of its own) into the unpacked application, where nothing reads
# them. Older tags have neither, hence the guard.
if [ -f build-config/com.marcnuri.electronim.appdata.xml ]; then
  install -Dp -m0644 build-config/com.marcnuri.electronim.appdata.xml \
    %{buildroot}%{_metainfodir}/com.marcnuri.electronim.appdata.xml
fi
rm -rf %{buildroot}%{_optpkgdir}/usr


#-- FILES ---------------------------------------------------------------------#
%files
%license LICENSE
%doc CONTRIBUTING.md README.md
%{_optpkgdir}/*
%dir %{_datadir}/applications
%{_datadir}/applications/%{name}.desktop
%{_metainfodir}/com.marcnuri.electronim.appdata.xml
%{_bindir}/electronim


