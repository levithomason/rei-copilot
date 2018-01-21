#!/usr/bin/env bash

mv build rei-copilot
now deploy rei-copilot --public
now alias
now scale rei-copilot.now.sh 1
now remove --yes --safe rei-copilot
mv rei-copilot build
