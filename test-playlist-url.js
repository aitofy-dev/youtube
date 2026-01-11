/**
 * Quick test for URL with playlist parameter
 */

import { getTranscript, listTranscripts } from './dist/index.mjs';

const urlWithPlaylist = 'https://www.youtube.com/watch?v=J6OnBDmErUg&list=PLfvvvZ8VfsyR4jj3O3xNgimdWYcgYMXmS';

console.log('Testing URL with playlist parameter:');
console.log(urlWithPlaylist);
console.log('');

try {
    const tracks = await listTranscripts(urlWithPlaylist);
    console.log(`✅ SUCCESS! Found ${tracks.length} transcripts`);

    const segments = await getTranscript(urlWithPlaylist);
    console.log(`✅ Got ${segments.length} segments`);
    console.log(`\nFirst segment: "${segments[0].text}"`);
} catch (error) {
    console.error('❌ FAILED:', error.message);
    process.exit(1);
}
