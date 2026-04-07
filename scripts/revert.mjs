import { execSync } from 'child_process'
import path from 'path'

const projectDir = '/vercel/share/v0-project'

try {
  console.log('[v0] Starting git revert to commit 19a252f...')
  
  // Change to project directory
  process.chdir(projectDir)
  console.log('[v0] Working directory:', process.cwd())
  
  // Get current branch
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  console.log('[v0] Current branch:', currentBranch)
  
  // Show git status before
  console.log('[v0] Git status before revert:')
  console.log(execSync('git status').toString())
  
  // Reset to the verified commit 19a252f
  console.log('[v0] Resetting to commit 19a252f...')
  execSync('git reset --hard 19a252f')
  
  // Show git status after
  console.log('[v0] Git status after revert:')
  console.log(execSync('git status').toString())
  
  console.log('[v0] Revert completed successfully!')
  console.log('[v0] Commit 19a252f restored')
  console.log('[v0] All changes after 19a252f have been removed')
  
} catch (error) {
  console.error('[v0] Error during revert:', error.message)
  process.exit(1)
}
