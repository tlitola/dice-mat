#!/bin/sh

set -e

echo "Replacing config from environment..."
sed -E -i "s/!!!NEXT_PUBLIC_SUPABASE_URL!!!/$NEXT_PUBLIC_SUPABASE_URL/g" .next/static/**/*.js
sed -E -i "s/!!!NEXT_PUBLIC_SUPABASE_ANON_KEY!!!/$NEXT_PUBLIC_SUPABASE_ANON_KEY/g" .next/static/**/*.js

echo "Executing command..."
exec "$@"