#!/bin/bash

# Blue Blazer Rebranding Script
# Updates all CHHS DECA references to Blue Blazer

echo "Starting Blue Blazer rebranding..."

# Update client files
find /home/ubuntu/chhs-deca/client -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) -exec sed -i \
  -e 's/CHHS DECA/Blue Blazer/g' \
  -e 's/CHHS DECA Chapter/Blue Blazer Chapter/g' \
  -e 's/CHHS DECA community/Blue Blazer community/g' \
  -e 's/CHHS DECA events/Blue Blazer events/g' \
  -e 's/CHHS DECA Awards/Blue Blazer Awards/g' \
  -e 's/© 2025–2026 CHHS DECA/© 2025–2026 Blue Blazer/g' \
  -e 's/© 2025 CHHS DECA/© 2025 Blue Blazer/g' \
  {} \;

# Update server files
find /home/ubuntu/chhs-deca/server -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e 's/CHHS DECA/Blue Blazer/g' \
  {} \;

# Update config files
sed -i 's/CHHS DECA/Blue Blazer/g' /home/ubuntu/chhs-deca/package.json 2>/dev/null || true

echo "Rebranding complete!"
