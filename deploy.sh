#!/bin/bash
npm run bundle
scp -r index.html dist cocault@ssh-cocault.alwaysdata.net:/home/cocault/mastermind
