#!/bin/sh
# yarn migration:run
NODE_EXTRA_CA_CERTS=./ca.crt npx drizzle-kit migrate
NODE_EXTRA_CA_CERTS=./ca.crt npm run dev