async function main() {
  try {
    console.log('Starting rewards cleanup...')
    const response = await fetch('http://localhost:3000/api/rewards/cleanup', {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to cleanup rewards: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('Cleanup completed:', data)
    process.exit(0)
  } catch (error) {
    console.error('Failed to cleanup rewards:', error)
    process.exit(1)
  }
}

main() 