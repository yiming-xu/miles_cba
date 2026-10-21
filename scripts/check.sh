#!/bin/sh
# Run from any directory. No installs or network changes.
set -eu
cd "$(dirname "$0")/.."
python3 -m unittest discover -s tests
NODE=${MILES_NODE:-/home/hermes/.hermes/cache/scratch/miles-deploy/node-v20.19.2-linux-x64/bin/node}
"$NODE" --check app.js
"$NODE" --check calculator-layout.js
"$NODE" tests/runtime.cjs
