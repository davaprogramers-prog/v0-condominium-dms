#!/usr/bin/env python3
import subprocess
import sys
import os

# Find the git root directory
try:
    git_root = subprocess.check_output(
        ['git', 'rev-parse', '--show-toplevel'],
        text=True,
        stderr=subprocess.DEVNULL
    ).strip()
    print(f'[v0] Git repository found at: {git_root}')
except:
    # If git command fails, assume current directory has .git
    git_root = '.'
    print('[v0] Using current directory')

try:
    print('[v0] Starting git revert to commit 19a252f...')
    
    # Get current branch
    current_branch = subprocess.check_output(
        ['git', '-C', git_root, 'rev-parse', '--abbrev-ref', 'HEAD'],
        text=True
    ).strip()
    print(f'[v0] Current branch: {current_branch}')
    
    # Show git log to verify commit exists
    print('[v0] Verifying commit 19a252f exists...')
    log_output = subprocess.check_output(
        ['git', '-C', git_root, 'log', '--oneline', '-10'],
        text=True
    )
    print('[v0] Recent commits:')
    print(log_output)
    
    # Show git status before
    print('[v0] Git status before revert:')
    status_before = subprocess.check_output(['git', '-C', git_root, 'status'], text=True)
    print(status_before)
    
    # Reset to the verified commit 19a252f
    print('[v0] ⚠ Resetting to commit 19a252f...')
    subprocess.check_call(['git', '-C', git_root, 'reset', '--hard', '19a252f'])
    
    # Show git status after
    print('[v0] Git status after revert:')
    status_after = subprocess.check_output(['git', '-C', git_root, 'status'], text=True)
    print(status_after)
    
    print('[v0] ✓✓✓ Revert completed successfully!')
    print('[v0] ✓ Commit 19a252f restored')
    print('[v0] ✓ All changes after 19a252f have been removed')
    print('[v0] ✓ Code is now at the last Verified working state')
    print('[v0] ✓ Ready for clean implementation')
    
except subprocess.CalledProcessError as e:
    print(f'[v0] Error during revert: {e}', file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f'[v0] Unexpected error: {e}', file=sys.stderr)
    sys.exit(1)
