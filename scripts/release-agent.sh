#!/bin/bash

# Release Agent Script
# Syncs main into current branch, runs checks, and prepares for PR merge

# Don't use set -e globally as we need to handle errors in retry logic
# Instead, we'll check exit codes explicitly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_ITERATIONS=5  # Maximum attempts to fix issues
TIMEOUT_SECONDS=300  # 5 minutes timeout per check

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶${NC} $1"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    return 0
}

# Check if there are uncommitted changes
check_clean_working_tree() {
    if ! git diff-index --quiet HEAD --; then
        log_warning "You have uncommitted changes"
        read -p "Do you want to stash them? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git stash push -m "Stashed by release-agent before sync"
            log_success "Changes stashed"
        else
            log_error "Please commit or stash your changes first"
            exit 1
        fi
    fi
}

# Get current branch name
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

# Fetch latest main
fetch_main() {
    log_step "Fetching latest main branch"
    git fetch origin main:main || git fetch origin main
    log_success "Fetched latest main"
}

# Merge main into current branch
merge_main() {
    local current_branch=$(get_current_branch)
    log_step "Merging main into $current_branch"
    
    if git merge main --no-edit; then
        log_success "Successfully merged main into $current_branch"
        return 0
    else
        log_warning "Merge conflicts detected"
        echo ""
        echo "Conflicted files:"
        git diff --name-only --diff-filter=U
        echo ""
        log_warning "Please resolve conflicts manually, then:"
        echo "  1. Review and fix conflicted files"
        echo "  2. Stage resolved files: git add <files>"
        echo "  3. Complete merge: git commit"
        echo ""
        read -p "Press Enter after you've resolved conflicts and completed the merge..."
        
        # Check if merge is complete
        if git diff --name-only --diff-filter=U | grep -q .; then
            log_error "Conflicts still exist. Please resolve them and run this script again."
            exit 1
        fi
        
        log_success "Merge conflicts resolved"
        return 0
    fi
}

# Check if timeout command is available
has_timeout() {
    command -v timeout >/dev/null 2>&1 || command -v gtimeout >/dev/null 2>&1
}

# Get timeout command (timeout on Linux, gtimeout on macOS if installed)
get_timeout_cmd() {
    if command -v timeout >/dev/null 2>&1; then
        echo "timeout"
    elif command -v gtimeout >/dev/null 2>&1; then
        echo "gtimeout"
    else
        echo ""
    fi
}

# Run command with timeout if available
run_with_timeout() {
    local cmd="$1"
    local timeout_cmd=$(get_timeout_cmd)
    
    if [ -n "$timeout_cmd" ]; then
        $timeout_cmd $TIMEOUT_SECONDS $cmd
    else
        # No timeout available, just run the command
        log_warning "timeout command not available, running without timeout"
        $cmd
    fi
}

# Run type check with timeout
run_type_check() {
    log_step "Running TypeScript type check"
    
    if run_with_timeout "npm run type-check" 2>&1; then
        log_success "Type check passed"
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            log_error "Type check timed out after ${TIMEOUT_SECONDS}s"
        else
            log_error "Type check failed"
        fi
        return 1
    fi
}

# Run tests with timeout (matching CI behavior exactly)
run_tests() {
    log_step "Running tests (matching CI: npm run test -- --run)"
    
    # Kill any hanging test processes first
    pkill -f "vitest|vite" 2>/dev/null || true
    sleep 2
    
    # Run tests the same way CI does to catch CI-specific issues
    # CI uses: npm run test -- --run
    # Capture output to check for failures
    local test_output
    local test_exit_code=0
    
    if [ -n "$(get_timeout_cmd)" ]; then
        test_output=$(timeout $TIMEOUT_SECONDS npm run test -- --run 2>&1) || test_exit_code=$?
    else
        test_output=$(npm run test -- --run 2>&1) || test_exit_code=$?
    fi
    
    echo "$test_output"
    
    # Check for test failures in output (more reliable than exit code)
    if echo "$test_output" | grep -q "FAIL\|Failed Tests"; then
        log_error "Tests failed (found FAIL in output)"
        return 1
    fi
    
    if [ $test_exit_code -eq 124 ]; then
        log_error "Tests timed out after ${TIMEOUT_SECONDS}s"
        return 1
    elif [ $test_exit_code -ne 0 ]; then
        log_error "Tests failed with exit code $test_exit_code"
        return 1
    fi
    
    log_success "Tests passed"
    return 0
}

# Run build with timeout
run_build() {
    log_step "Running build"
    
    if run_with_timeout "npm run build" 2>&1; then
        log_success "Build succeeded"
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            log_error "Build timed out after ${TIMEOUT_SECONDS}s"
        else
            log_error "Build failed"
        fi
        return 1
    fi
}

# Try to fix common issues
try_fix_issues() {
    log_step "Attempting to fix common issues"
    
    # Install dependencies if node_modules is missing or package-lock changed
    # This ensures we're in the same state as CI (which runs npm ci)
    if [ ! -d "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
        log_info "Installing/updating dependencies (npm ci - matching CI)"
        npm ci
        log_success "Dependencies installed"
    fi
    
    # Kill any hanging processes that might interfere
    pkill -f "vitest|vite" 2>/dev/null || true
    sleep 2
    
    # Fix linting/formatting if possible
    if command -v npm &> /dev/null; then
        # Try to auto-fix with ESLint if available
        if npm run lint:fix 2>/dev/null; then
            log_success "Ran lint:fix"
        fi
        
        # Try to format code if available
        if npm run format 2>/dev/null; then
            log_success "Ran format"
        fi
    fi
}

# Main workflow
main() {
    log_info "Release Agent - Preparing branch for PR merge"
    echo ""
    
    # Pre-flight checks
    check_git_repo
    check_clean_working_tree
    
    local current_branch=$(get_current_branch)
    log_info "Current branch: $current_branch"
    
    if [ "$current_branch" = "main" ]; then
        log_error "You're on main branch. Please switch to a feature branch first."
        exit 1
    fi
    
    # Step 1: Fetch and merge main
    fetch_main
    merge_main
    
    # Step 2: Ensure clean state (like CI)
    log_step "Preparing clean test environment (matching CI)"
    # Kill any hanging processes
    pkill -f "vitest|vite" 2>/dev/null || true
    sleep 1
    
    # Ensure dependencies are installed (CI runs npm ci)
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies (npm ci - matching CI)"
        npm ci
    fi
    
    # Step 3: Run checks with retry logic
    local iteration=0
    local type_check_passed=false
    local tests_passed=false
    local build_passed=false
    
    while [ $iteration -lt $MAX_ITERATIONS ]; do
        iteration=$((iteration + 1))
        log_info "Iteration $iteration of $MAX_ITERATIONS"
        
        # Type check
        if ! $type_check_passed; then
            if run_type_check; then
                type_check_passed=true
            else
                try_fix_issues
                if [ $iteration -lt $MAX_ITERATIONS ]; then
                    log_warning "Type check failed. Attempting fixes..."
                    continue
                else
                    log_error "Type check failed after $MAX_ITERATIONS attempts"
                    exit 1
                fi
            fi
        fi
        
        # Tests (run same way as CI)
        if ! $tests_passed; then
            if run_tests; then
                tests_passed=true
            else
                try_fix_issues
                if [ $iteration -lt $MAX_ITERATIONS ]; then
                    log_warning "Tests failed. Attempting fixes..."
                    continue
                else
                    log_error "Tests failed after $MAX_ITERATIONS attempts"
                    log_error "This matches CI behavior - tests must pass before merging"
                    exit 1
                fi
            fi
        fi
        
        # Build
        if ! $build_passed; then
            if run_build; then
                build_passed=true
            else
                try_fix_issues
                if [ $iteration -lt $MAX_ITERATIONS ]; then
                    log_warning "Build failed. Attempting fixes..."
                    continue
                else
                    log_error "Build failed after $MAX_ITERATIONS attempts"
                    exit 1
                fi
            fi
        fi
        
        # All checks passed
        break
    done
    
    # Final verification
    log_step "Final verification"
    if $type_check_passed && $tests_passed && $build_passed; then
        log_success "All checks passed!"
    else
        log_error "Some checks failed. Please fix issues manually."
        exit 1
    fi
    
    # Push branch
    log_step "Pushing branch to remote"
    echo ""
    log_info "Ready to push $current_branch to origin"
    read -p "Do you want to push now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if git push origin "$current_branch" --set-upstream 2>&1; then
            log_success "Branch pushed successfully!"
            echo ""
            log_info "Next steps:"
            echo "  1. Create a Pull Request on GitHub"
            echo "  2. Review the changes"
            echo "  3. Merge into main when approved"
        else
            log_error "Failed to push branch"
            exit 1
        fi
    else
        log_info "Skipping push. You can push manually with:"
        echo "  git push origin $current_branch"
    fi
    
    log_success "Release agent completed successfully!"
}

# Run main function
main "$@"
