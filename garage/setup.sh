#!/usr/bin/env bash
# Start Garage in Docker (if needed), then configure layout, bucket, and API key.
# Run from project root (./garage/setup.sh) or from garage/ (./setup.sh).
# Usage: ./garage/setup.sh [bucket-name] [key-name]

set -e

GARAGE_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTAINER="${GARAGE_CONTAINER:-garaged}"
CONFIG="/etc/garage.toml"
IMAGE="${GARAGE_IMAGE:-dxflrs/garage:v2.2.0}"
ZONE="${GARAGE_ZONE:-dc1}"
CAPACITY="${GARAGE_CAPACITY:-1G}"
BUCKET="${1:-explorer-for-s3}"
KEY_NAME="${2:-explorer-for-s3-key}"

# Image is FROM scratch: only /garage exists, no shell or PATH
garage() {
  docker exec "$CONTAINER" /garage -c "$CONFIG" "$@"
}

echo "==> Ensuring meta and data dirs exist..."
mkdir -p "$GARAGE_DIR/meta" "$GARAGE_DIR/data"

echo "==> Starting Garage container..."
if ! docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Creating new container $CONTAINER..."
  docker run -d \
    --name "$CONTAINER" \
    -p 3900:3900 -p 3901:3901 -p 3902:3902 -p 3903:3903 \
    -v "$GARAGE_DIR/garage.toml:$CONFIG" \
    -v "$GARAGE_DIR/meta:/var/lib/garage/meta" \
    -v "$GARAGE_DIR/data:/var/lib/garage/data" \
    "$IMAGE"
elif ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Starting existing container $CONTAINER..."
  docker start "$CONTAINER"
else
  echo "Container $CONTAINER already running."
fi

# If the CLI can't read the node key (e.g. container was created with wrong mounts), recreate the container
if docker exec "$CONTAINER" /garage -c "$CONFIG" status 2>&1 | grep -q "Unable to read node key"; then
  echo "Metadata missing node key (container may have been created with different mounts). Recreating container..."
  docker rm -f "$CONTAINER" 2>/dev/null || true
  docker run -d \
    --name "$CONTAINER" \
    -p 3900:3900 -p 3901:3901 -p 3902:3902 -p 3903:3903 \
    -v "$GARAGE_DIR/garage.toml:$CONFIG" \
    -v "$GARAGE_DIR/meta:/var/lib/garage/meta" \
    -v "$GARAGE_DIR/data:/var/lib/garage/data" \
    "$IMAGE"
fi

echo "==> Waiting for Garage to be ready..."
for i in $(seq 1 30); do
  if docker exec "$CONTAINER" /garage -c "$CONFIG" status 2>&1 | grep -q "HEALTHY NODES"; then
    break
  fi
  [ "$i" -eq 30 ] && { echo "Garage did not become ready in time."; exit 1; }
  sleep 1
done

echo ""
echo "==> Garage status:"
STATUS_OUTPUT=$(garage status 2>&1) || true
echo "$STATUS_OUTPUT"

# Node row is the first line whose first field is a 16+ char hex id (log lines may appear before the table)
NODE_ID=$(echo "$STATUS_OUTPUT" | awk '/^[a-f0-9]{16}[[:space:]]/ { print $1; exit }')
if [ -z "$NODE_ID" ]; then
  echo ""
  echo "Could not read node ID. If the container was started with different volume mounts earlier,"
  echo "remove it and run this script again: docker rm -f $CONTAINER && $0 $*"
  exit 1
fi

echo ""
echo "==> Assigning layout (zone=$ZONE, capacity=$CAPACITY) for node $NODE_ID..."
garage layout assign -z "$ZONE" -c "$CAPACITY" "$NODE_ID"

echo ""
echo "==> Applying layout..."
garage layout apply --version 1

echo ""
echo "==> Creating bucket: $BUCKET"
garage bucket create "$BUCKET" 2>/dev/null || true

echo ""
echo "==> Creating API key: $KEY_NAME"
OUTPUT=$(garage key create "$KEY_NAME" 2>/dev/null) || true
if echo "$OUTPUT" | grep -q "Key ID"; then
  echo "$OUTPUT"
  KEY_ID=$(echo "$OUTPUT" | sed -n 's/Key ID: \(.*\)/\1/p')
  SECRET=$(echo "$OUTPUT" | sed -n 's/Secret key: \(.*\)/\1/p')
else
  echo "Key may already exist. Listing keys:"
  garage key list
  KEY_ID=$(garage key info "$KEY_NAME" 2>/dev/null | sed -n 's/Key ID: \(.*\)/\1/p')
  SECRET="(see 'garage key info $KEY_NAME' or create a new key)"
fi

echo ""
echo "==> Allowing key $KEY_NAME on bucket $BUCKET (read, write, owner)"
garage bucket allow --read --write --owner "$BUCKET" --key "$KEY_NAME"

echo ""
echo "==> Done. Summary:"
garage status
echo ""
garage bucket list
echo ""
echo "Use in S3 Explorer (or awscli):"
echo "  Endpoint:  http://localhost:3900"
echo "  Region:    garage"
echo "  Bucket:    $BUCKET"
echo "  Access:    $KEY_ID"
echo "  Secret:    $SECRET"
