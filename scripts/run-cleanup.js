import { runFullCleanup } from '../utils/databaseCleanup';

// First run in dry-run mode to preview changes
console.log('Running cleanup preview...');
runFullCleanup(true)
  .then((previewResults) => {
    // Ask for confirmation before real cleanup
    console.log('\nWould you like to proceed with the actual cleanup? (y/n)');
    process.stdin.once('data', async (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y') {
        console.log('\nStarting actual cleanup...');
        try {
          const results = await runFullCleanup(false);
          console.log('Cleanup completed successfully!');
          process.exit(0);
        } catch (error) {
          console.error('Cleanup failed:', error);
          process.exit(1);
        }
      } else {
        console.log('Cleanup cancelled.');
        process.exit(0);
      }
    });
  })
  .catch((error) => {
    console.error('Preview failed:', error);
    process.exit(1);
  });