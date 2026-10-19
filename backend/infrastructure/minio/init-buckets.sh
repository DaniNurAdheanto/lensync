#!/bin/sh
set -e

echo "Connecting to MinIO S3 service..."
/usr/bin/mc alias set localminio http://minio:9000 ${S3_ACCESS_KEY:-minioadmin} ${S3_SECRET_KEY:-minioadmin123}

BUCKET_NAME="${S3_BUCKET_NAME:-c2c-photos}"

echo "Creating bucket: ${BUCKET_NAME}"
/usr/bin/mc mb localminio/${BUCKET_NAME} --ignore-existing

echo "Setting public read policy for preview & thumbnail paths..."
/usr/bin/mc anonymous set download localminio/${BUCKET_NAME}

echo "MinIO Bucket Initialized Successfully!"
