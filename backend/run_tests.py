#!/usr/bin/env python3
"""
Test runner script for the RAG backend
Provides convenient commands to run different types of tests
"""
import argparse
import subprocess
import sys
from pathlib import Path

def run_command(cmd, description):
    """Run a command and return the result."""
    print(f"\n🔍 {description}")
    print(f"📝 Command: {' '.join(cmd)}")
    print("-" * 50)

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=Path(__file__).parent)
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr, file=sys.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running command: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description="RAG Backend Test Runner")
    parser.add_argument(
        "test_type",
        choices=["unit", "integration", "all", "crawler", "pdf", "embedding", "qdrant", "api", "coverage", "performance"],
        help="Type of tests to run"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output"
    )
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Stop on first failure"
    )
    parser.add_argument(
        "--no-cov",
        action="store_true",
        help="Skip coverage reporting"
    )

    args = parser.parse_args()

    # Base pytest command
    cmd = [sys.executable, "-m", "pytest"]

    if args.verbose:
        cmd.append("--verbose")
    else:
        cmd.append("-q")

    if args.fail_fast:
        cmd.append("--tb=short")
        cmd.append("--exitfirst")

    # Add coverage unless disabled
    if not args.no_cov:
        cmd.extend([
            "--cov=app",
            "--cov-report=term-missing",
            "--cov-report=html:htmlcov"
        ])

    # Test type specific configurations
    if args.test_type == "unit":
        cmd.extend([
            "-m", "unit",
            "--maxfail=5"
        ])
        description = "Running unit tests"

    elif args.test_type == "integration":
        cmd.extend([
            "-m", "integration",
            "--durations=10"
        ])
        description = "Running integration tests"

    elif args.test_type == "crawler":
        cmd.extend([
            "-m", "crawler",
            "--tb=short"
        ])
        description = "Running crawler tests"

    elif args.test_type == "pdf":
        cmd.extend([
            "-m", "pdf",
            "--tb=short"
        ])
        description = "Running PDF processor tests"

    elif args.test_type == "embedding":
        cmd.extend([
            "-m", "embedding",
            "--tb=short"
        ])
        description = "Running embedding service tests"

    elif args.test_type == "qdrant":
        cmd.extend([
            "-m", "qdrant",
            "--tb=short"
        ])
        description = "Running QDrant service tests"

    elif args.test_type == "api":
        cmd.extend([
            "-m", "api",
            "--tb=short"
        ])
        description = "Running API tests"

    elif args.test_type == "performance":
        cmd.extend([
            "-m", "slow",
            "--durations=0",
            "--tb=line"
        ])
        description = "Running performance tests"

    elif args.test_type == "coverage":
        cmd.extend([
            "--cov=app",
            "--cov-report=html",
            "--cov-report=term-missing:skip-covered",
            "--cov-fail-under=80"
        ])
        description = "Running full test suite with coverage"

    elif args.test_type == "all":
        cmd.extend([
            "--durations=10",
            "--strict-markers"
        ])
        description = "Running all tests"

    success = run_command(cmd, description)

    if success:
        print("\n✅ All tests passed!")
        if not args.no_cov and args.test_type in ["all", "coverage"]:
            print("📊 Coverage report generated in htmlcov/index.html")
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    print("🧪 RAG Backend Test Runner")
    print("=" * 40)
    main()
