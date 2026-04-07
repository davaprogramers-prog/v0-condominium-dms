#!/usr/bin/env python3
import subprocess
import os
import sys

project_dir = '/vercel/share/v0-project'

try:
    print('[v0] Starting git revert to commit 19a252f...')
    
    # Change to project directory
    os.chdir(project_dir)
    print(f'[v0] Working directory: {os.getcwd()}')
    
    # Get current branch
    current_branch = subprocess.check_output(
        ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
        text=True
    ).strip()
    print(f'[v0] Current branch: {current_branch}')
    
    # Show git status before
    print('[v0] Git status before revert:')
    status_before = subprocess.check_output(['git', 'status'], text=True)
    print(status_before)
    
    # Reset to the verified commit 19a252f
    print('[v0] Resetting to commit 19a252f...')
    subprocess.check_call(['git', 'reset', '--hard', '19a252f'])
    
    # Show git status after
    print('[v0] Git status after revert:')
    status_after = subprocess.check_output(['git', 'status'], text=True)
    print(status_after)
    
    print('[v0] ✓ Revert completed successfully!')
    print('[v0] ✓ Commit 19a252f restored')
    print('[v0] ✓ All changes after 19a252f have been removed')
    print('[v0] ✓ Code is now at the last Verified working state')
    
except subprocess.CalledProcessError as e:
    print(f'[v0] Error during revert: {e}', file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f'[v0] Unexpected error: {e}', file=sys.stderr)
    sys.exit(1)
