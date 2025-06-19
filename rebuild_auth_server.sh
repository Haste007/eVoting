#!/bin/bash

# filepath: /home/umair/uniWork/FYP/rebuild_auth_server.sh

# Define variables
CONTAINER_NAME="auth-server"
IMAGE_NAME="authentication-server"
DOCKERFILE_PATH="/home/umair/uniWork/FYP/authentication/Dockerfile"
APP_PATH="/home/umair/uniWork/FYP/authentication"

# Step 1: Stop and remove the existing container
echo "Stopping the authentication server container..."
docker stop $CONTAINER_NAME 2>/dev/null || echo "Container not running."
docker rm $CONTAINER_NAME 2>/dev/null || echo "Container not found."

# Step 2: Rebuild the Docker image using cache
echo "Rebuilding the Docker image..."
docker build -t $IMAGE_NAME -f $DOCKERFILE_PATH $APP_PATH || {
    echo "Failed to build the Docker image!"
    exit 1
}

# Step 3: Start the container
echo "Starting the authentication server container..."
docker run -d -p 8000:8000 --name $CONTAINER_NAME $IMAGE_NAME || {
    echo "Failed to start the container!"
    exit 1
}

echo "Authentication server successfully rebuilt and restarted."