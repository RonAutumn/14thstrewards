const { setupRewardsCollections } = require('../lib/db/schema/rewards')

async function main() {
  try {
    console.log('Starting rewards setup and cleanup...')
    await setupRewardsCollections()
    console.log('Rewards setup and cleanup completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Failed to setup rewards:', error)
    process.exit(1)
  }
}

main() 