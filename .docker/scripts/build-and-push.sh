#!/bin/bash
set -e

# Docker Hub Build and Push Script for Resolvera
# Author: Resolvera Team
# Description: Builds and pushes Docker images to Docker Hub with proper versioning

# Configuration
DOCKER_USERNAME="icyicefsdev"
IMAGE_NAME="resolvera"
DOCKERFILE_PATH=".docker/Dockerfile"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running from project root
if [ ! -f "package.json" ] || [ ! -d ".docker" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
if [ -z "$VERSION" ]; then
    print_error "Could not read version from package.json"
    exit 1
fi

# Parse command line arguments
BUILD_ONLY=false
PUSH_ONLY=false
NO_CACHE=false
PLATFORM="linux/amd64"

while [[ $# -gt 0 ]]; do
    case $1 in
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --push-only)
            PUSH_ONLY=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --multiarch)
            PLATFORM="linux/amd64,linux/arm64"
            shift
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --build-only    Only build the image, don't push"
            echo "  --push-only     Only push existing image, don't build"
            echo "  --no-cache      Build without using cache"
            echo "  --multiarch     Build for multiple architectures (amd64, arm64)"
            echo "  --version VER   Override version from package.json"
            echo "  --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                          # Build and push with auto version"
            echo "  $0 --build-only             # Only build locally"
            echo "  $0 --version 1.2.0          # Build and push with specific version"
            echo "  $0 --multiarch              # Build for multiple architectures"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Generate tags
FULL_IMAGE="${DOCKER_USERNAME}/${IMAGE_NAME}"
TAGS=(
    "${FULL_IMAGE}:latest"
    "${FULL_IMAGE}:${VERSION}"
    "${FULL_IMAGE}:v${VERSION}"
)

# Display build information
print_header "Docker Build Configuration"
echo "  Docker Hub User: ${DOCKER_USERNAME}"
echo "  Image Name:      ${IMAGE_NAME}"
echo "  Version:         ${VERSION}"
echo "  Platform:        ${PLATFORM}"
echo "  Build Only:      ${BUILD_ONLY}"
echo "  Push Only:       ${PUSH_ONLY}"
echo "  No Cache:        ${NO_CACHE}"
echo ""
echo "  Tags to create:"
for tag in "${TAGS[@]}"; do
    echo "    - ${tag}"
done
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi
print_success "Docker is installed"

# Check if logged into Docker Hub (skip for build-only)
if [ "$BUILD_ONLY" = false ]; then
    if ! docker info | grep -q "Username: ${DOCKER_USERNAME}"; then
        print_warning "Not logged into Docker Hub as ${DOCKER_USERNAME}"
        print_info "Attempting to login..."
        if ! docker login; then
            print_error "Docker login failed"
            exit 1
        fi
        print_success "Logged into Docker Hub"
    else
        print_success "Already logged into Docker Hub as ${DOCKER_USERNAME}"
    fi
fi

# Build the image
if [ "$PUSH_ONLY" = false ]; then
    print_header "Building Docker Image"

    # Construct build command
    BUILD_CMD="docker build -f ${DOCKERFILE_PATH}"

    # Add tags
    for tag in "${TAGS[@]}"; do
        BUILD_CMD="${BUILD_CMD} -t ${tag}"
    done

    # Add platform
    BUILD_CMD="${BUILD_CMD} --platform ${PLATFORM}"

    # Add no-cache flag if specified
    if [ "$NO_CACHE" = true ]; then
        BUILD_CMD="${BUILD_CMD} --no-cache"
        print_info "Building without cache..."
    fi

    # Add context
    BUILD_CMD="${BUILD_CMD} ."

    print_info "Executing: ${BUILD_CMD}"
    echo ""

    if eval ${BUILD_CMD}; then
        print_success "Image built successfully"
    else
        print_error "Image build failed"
        exit 1
    fi

    echo ""
    print_header "Build Complete"
    docker images | grep "${IMAGE_NAME}" | head -n 5
    echo ""
fi

# Push the image
if [ "$BUILD_ONLY" = false ]; then
    print_header "Pushing to Docker Hub"

    for tag in "${TAGS[@]}"; do
        print_info "Pushing ${tag}..."
        if docker push "${tag}"; then
            print_success "Pushed ${tag}"
        else
            print_error "Failed to push ${tag}"
            exit 1
        fi
    done

    echo ""
    print_header "Push Complete"
    print_success "All images pushed successfully!"
    echo ""
    print_info "Your image is now available at:"
    for tag in "${TAGS[@]}"; do
        echo "  docker pull ${tag}"
    done
    echo ""
    print_info "View on Docker Hub:"
    echo "  https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"
fi

# Summary
echo ""
print_header "Summary"
if [ "$BUILD_ONLY" = true ]; then
    print_success "Build completed successfully (not pushed)"
    echo ""
    echo "To push manually, run:"
    for tag in "${TAGS[@]}"; do
        echo "  docker push ${tag}"
    done
elif [ "$PUSH_ONLY" = true ]; then
    print_success "Push completed successfully"
else
    print_success "Build and push completed successfully!"
    echo ""
    print_info "To use this image in docker-compose.yml:"
    echo "  services:"
    echo "    app:"
    echo "      image: ${FULL_IMAGE}:latest"
    echo "      # Remove the 'build' section"
fi
echo ""
