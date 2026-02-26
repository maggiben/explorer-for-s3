# Garage (S3-compatible) local setup

Single-node Garage in Docker for use with S3 Explorer.

## One-shot setup

From the **project root**, run:

```bash
./garage/setup.sh
```

The script will:

1. Create `garage/meta` and `garage/data` if missing
2. Start the Garage container (create it if it doesn’t exist, otherwise start the existing one)
3. Wait until Garage is ready
4. Assign the node to a zone (`dc1`) and capacity (`1G`), then apply the layout
5. Create bucket `s3-explorer` and API key `s3-explorer-key`, and allow the key on the bucket

At the end it prints the **Access Key** and **Secret** to use in S3 Explorer. Safe to run again (e.g. after a reboot); it will only start the container and re-run layout/bucket/key steps as needed.

Optional: custom bucket and key names:

```bash
./garage/setup.sh my-bucket my-key
```

Environment overrides:

- `GARAGE_CONTAINER` – container name (default: `garaged`)
- `GARAGE_IMAGE` – image (default: `dxflrs/garage:v2.2.0`)
- `GARAGE_ZONE` – zone name (default: `dc1`)
- `GARAGE_CAPACITY` – node capacity (default: `1G`)

Example:

```bash
GARAGE_ZONE=home GARAGE_CAPACITY=10G ./garage/setup.sh
```

## Manual container start (optional)

If you prefer to start the container yourself:

```bash
docker run -d --name garaged \
  -p 3900:3900 -p 3901:3901 -p 3902:3902 -p 3903:3903 \
  -v "$(pwd)/garage/garage.toml:/etc/garage.toml" \
  -v "$(pwd)/garage/meta:/var/lib/garage/meta" \
  -v "$(pwd)/garage/data:/var/lib/garage/data" \
  dxflrs/garage:v2.2.0
```

Then run `./garage/setup.sh` to configure layout and keys.

## Use in S3 Explorer

Add a connection:

- **Endpoint:** `http://localhost:3900`
- **Region:** `garage`
- **Access Key / Secret:** from the script output (or `garage key info s3-explorer-key` inside the container)

## Manual commands (inside container)

```bash
# Config path in container
docker exec garaged garage -c /etc/garage.toml status
docker exec garaged garage -c /etc/garage.toml layout show
docker exec garaged garage -c /etc/garage.toml bucket list
docker exec garaged garage -c /etc/garage.toml key list
```

## Config note

`garage.toml` uses `metadata_dir` and `data_dir` under `/var/lib/garage/` so that the Docker volume mounts persist data. If you had started the container with `/tmp` paths before, restart it after pulling the updated config so the daemon uses the correct dirs.
