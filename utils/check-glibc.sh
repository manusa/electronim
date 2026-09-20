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

# Fails when a native binary in the given directory needs a newer glibc or libstdc++ than the oldest
# supported Ubuntu LTS provides. Native modules (nodehun) are compiled on the build machine and link
# against its glibc and libstdc++, so a build on a newer system produces an AppImage that can't load
# them there.
#
# Usage: ./utils/check-glibc.sh squashfs-root
set -euo pipefail

# Ubuntu 22.04
MAX_GLIBC=2.35
MAX_GLIBCXX=3.4.30

directory="${1:?Usage: $0 <directory>}"

if ! command -v readelf >/dev/null; then
  echo "readelf is needed to read the symbol versions of the native binaries, install binutils" >&2
  exit 1
fi

# Whether version $1 is newer than version $2
newer_than() {
  [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -n 1)" = "$1" ]
}

# Newest version of the $1 symbol version prefix (GLIBC or GLIBCXX) in the readelf output $2
newest_version() {
  { grep -o "${1}_[0-9][0-9.]*" <<<"$2" || true; } | cut -d _ -f 2 | sort -uV | tail -n 1
}

binaries=0
failures=0
while IFS= read -r -d '' file; do
  [ "$(head -c 4 "$file" | od -An -c | tr -d ' ')" = '177ELF' ] || continue
  binaries=$((binaries + 1))
  # A binary whose versions can't be read is a failure, the check is worthless if it can't go red
  if ! symbols=$(readelf --version-info --wide "$file"); then
    echo "${file#"$directory"/} symbol versions could not be read" >&2
    failures=$((failures + 1))
    continue
  fi
  glibc=$(newest_version GLIBC "$symbols")
  glibcxx=$(newest_version GLIBCXX "$symbols")
  if newer_than "${glibc:-0}" "$MAX_GLIBC" || newer_than "${glibcxx:-0}" "$MAX_GLIBCXX"; then
    echo "${file#"$directory"/} requires GLIBC_${glibc:-none} and GLIBCXX_${glibcxx:-none}" >&2
    failures=$((failures + 1))
  fi
done < <(find "$directory" -type f -print0)

if [ "$binaries" -eq 0 ]; then
  echo "No native binaries found in $directory" >&2
  exit 1
fi
if [ "$failures" -gt 0 ]; then
  echo "$failures of $binaries native binaries need more than GLIBC_$MAX_GLIBC or GLIBCXX_$MAX_GLIBCXX (Ubuntu 22.04)" >&2
  exit 1
fi
echo "All $binaries native binaries load with GLIBC_$MAX_GLIBC and GLIBCXX_$MAX_GLIBCXX (Ubuntu 22.04)"
