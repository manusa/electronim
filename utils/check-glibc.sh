#!/usr/bin/env bash
#   Copyright 2026 Marc Nuri San Felix
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

# Fails when a native binary in the given paths needs a symbol version that the oldest supported
# Ubuntu LTS doesn't provide. Native modules (nodehun) are compiled on the build machine and link
# against its glibc and libstdc++, so a build on a newer system produces packages whose spell
# checker can't load on older distributions.
#
# Usage: ./utils/check-glibc.sh squashfs-root [path...]
set -euo pipefail

# Newest versions Ubuntu 22.04 provides (libc6 2.35, libstdc++6 and libgcc-s1 from GCC 12)
MAX_GLIBC=2.35
MAX_GLIBCXX=3.4.30
MAX_CXXABI=1.3.13
MAX_GCC=12.0.0

if [ $# -eq 0 ]; then
  echo "Usage: $0 <path>..." >&2
  exit 1
fi

if ! command -v readelf >/dev/null; then
  echo "readelf is needed to read the symbol versions of the native binaries, install binutils" >&2
  exit 1
fi

# Whether version $1 is newer than version $2
newer_than() {
  [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -n 1)" = "$1" ]
}

# The versions of the $1 prefix that the readelf output $2 says the binary needs. Only the version
# needs section counts: the versions a library defines are what it offers to others, and bundling a
# library that defines newer versions is a fix for this problem rather than a symptom of it.
needed_versions() {
  { sed -n '/Version needs section/,$p' <<<"$2" | grep -o "${1}_[0-9][0-9.]*" || true; } |
    cut -d _ -f 2 | sort -uV
}

# find fails for a path it cannot list, and a check that silently skips binaries is worthless, so
# pipe it (pipefail turns its failure into the failure of this script) instead of reading from a
# process substitution, whose exit status nothing reports
find "$@" -type f -print0 | {
binaries=0
failures=0
while IFS= read -r -d '' file; do
  if ! magic=$(head -c 4 "$file" | od -An -c | tr -d ' '); then
    echo "$file could not be read" >&2
    failures=$((failures + 1))
    continue
  fi
  [ "$magic" = '177ELF' ] || continue
  binaries=$((binaries + 1))
  if ! symbols=$(readelf --version-info --wide "$file"); then
    echo "$file symbol versions could not be read" >&2
    failures=$((failures + 1))
    continue
  fi
  needs=""
  for limit in "GLIBC:$MAX_GLIBC" "GLIBCXX:$MAX_GLIBCXX" "CXXABI:$MAX_CXXABI" "GCC:$MAX_GCC"; do
    prefix="${limit%%:*}"
    max="${limit##*:}"
    for version in $(needed_versions "$prefix" "$symbols"); do
      if newer_than "$version" "$max"; then
        needs="$needs ${prefix}_${version}"
      fi
    done
  done
  # Ubuntu 22.04 has no GLIBC_ABI_* version at all. Ubuntu 24.04 links with -z pack-relative-relocs
  # by default, which adds a GLIBC_ABI_DT_RELR requirement that the older loader rejects outright.
  for version in $({ sed -n '/Version needs section/,$p' <<<"$symbols" |
      grep -o 'GLIBC_ABI_[A-Z_]*' || true; } | sort -u); do
    needs="$needs $version"
  done
  if [ -n "$needs" ]; then
    echo "$file needs${needs}" >&2
    failures=$((failures + 1))
  fi
done

if [ "$binaries" -eq 0 ]; then
  echo "No native binaries found in $*" >&2
  exit 1
fi
if [ "$failures" -gt 0 ]; then
  echo "$failures of $binaries native binaries need more than Ubuntu 22.04 provides" >&2
  exit 1
fi
echo "All $binaries native binaries load with GLIBC_$MAX_GLIBC, GLIBCXX_$MAX_GLIBCXX," \
  "CXXABI_$MAX_CXXABI and GCC_$MAX_GCC (Ubuntu 22.04)"
}
