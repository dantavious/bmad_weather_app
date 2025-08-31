#!/bin/bash

# Generate placeholder PWA icons with proper BMad branding colors
# Material Design 3 primary color: #6750A4

ICONS_DIR="src/assets/icons"
cd frontend

# Create base SVG icon
cat > base-icon.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#6750A4" rx="102"/>
  <text x="256" y="300" font-family="Roboto, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white">BW</text>
</svg>
EOF

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Installing..."
    sudo apt-get update && sudo apt-get install -y imagemagick
fi

# Generate different icon sizes
sizes=(72 96 128 144 152 192 384 512)
for size in "${sizes[@]}"; do
    convert -background none -resize ${size}x${size} base-icon.svg $ICONS_DIR/icon-${size}x${size}.png
    echo "Generated icon-${size}x${size}.png"
done

# Clean up
rm base-icon.svg

echo "All PWA icons generated successfully!"