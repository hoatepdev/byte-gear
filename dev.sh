#!/bin/bash

# GearVN Development Script
# This script helps you run the client and server concurrently

case "$1" in
  "dev")
    echo "Starting development environment..."
    npm run dev
    ;;
  "build")
    echo "Building both client and server..."
    npm run build
    ;;
  "start")
    echo "Starting production environment..."
    npm run start
    ;;
  "install")
    echo "Installing all dependencies..."
    npm run install:all
    ;;
  "clean")
    echo "Cleaning all node_modules..."
    npm run clean
    ;;
  "lint")
    echo "Running linter on both projects..."
    npm run lint
    ;;
  *)
    echo "Usage: $0 {dev|build|start|install|clean|lint}"
    echo ""
    echo "Commands:"
    echo "  dev     - Start development environment (client + server)"
    echo "  build   - Build both client and server"
    echo "  start   - Start production environment"
    echo "  install - Install all dependencies"
    echo "  clean   - Remove all node_modules"
    echo "  lint    - Run linter on both projects"
    exit 1
    ;;
esac
