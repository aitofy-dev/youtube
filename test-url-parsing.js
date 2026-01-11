/**
 * Test URL Parsing - Comprehensive Test
 * Video ID: J6OnBDmErUg
 */

import {
    getTranscript,
    getTranscriptText,
    listTranscripts,
    getVideoInfo,
    getBasicVideoInfo
} from './dist/index.mjs';

const VIDEO_ID = 'J6OnBDmErUg';

// All URL formats to test
const TEST_CASES = [
    // Video ID only
    { input: 'J6OnBDmErUg', description: 'Video ID only' },

    // Short URL
    { input: 'https://youtu.be/J6OnBDmErUg', description: 'Short URL (youtu.be)' },
    { input: 'https://youtu.be/J6OnBDmErUg?si=hmHnyBJiljallWoz', description: 'Short URL with query params' },

    // Standard URL
    { input: 'https://www.youtube.com/watch?v=J6OnBDmErUg', description: 'Standard watch URL' },
    { input: 'https://www.youtube.com/watch?v=J6OnBDmErUg&t=120s', description: 'Watch URL with timestamp' },
    { input: 'https://youtube.com/watch?v=J6OnBDmErUg', description: 'Watch URL (no www)' },

    // Embed URL
    { input: 'https://www.youtube.com/embed/J6OnBDmErUg', description: 'Embed URL' },

    // Shorts URL
    { input: 'https://www.youtube.com/shorts/J6OnBDmErUg', description: 'Shorts URL' },

    // /v/ format
    { input: 'https://www.youtube.com/v/J6OnBDmErUg', description: '/v/ URL format' },

    // Live format
    { input: 'https://www.youtube.com/live/J6OnBDmErUg', description: 'Live URL format' },
];

async function testURLParsing() {
    console.log('='.repeat(70));
    console.log('🧪 URL PARSING TEST - Comprehensive');
    console.log('='.repeat(70));
    console.log('');

    let passed = 0;
    let failed = 0;

    for (const testCase of TEST_CASES) {
        process.stdout.write(`Testing: ${testCase.description.padEnd(35)} ... `);

        try {
            // Test with listTranscripts (fastest)
            const tracks = await listTranscripts(testCase.input);

            if (tracks && tracks.length > 0) {
                console.log(`✅ PASS (${tracks.length} tracks)`);
                passed++;
            } else {
                console.log('❌ FAIL (no tracks)');
                failed++;
            }
        } catch (error) {
            console.log(`❌ FAIL (${error.message})`);
            failed++;
        }
    }

    console.log('');
    console.log('='.repeat(70));
    console.log(`Results: ${passed}/${TEST_CASES.length} passed, ${failed} failed`);
    console.log('='.repeat(70));

    if (failed > 0) {
        console.error('\n❌ Some tests failed!');
        process.exit(1);
    }

    // Run detailed test with one URL
    console.log('\n🔍 Detailed test with standard URL...\n');
    const testUrl = 'https://www.youtube.com/watch?v=J6OnBDmErUg';

    console.log(`1️⃣  listTranscripts()`);
    const tracks = await listTranscripts(testUrl);
    console.log(`   ✅ Found ${tracks.length} tracks`);

    console.log(`\n2️⃣  getTranscript()`);
    const segments = await getTranscript(testUrl);
    console.log(`   ✅ Got ${segments.length} segments`);

    console.log(`\n3️⃣  getTranscriptText()`);
    const text = await getTranscriptText(testUrl);
    console.log(`   ✅ Got ${text.length} characters`);

    console.log(`\n4️⃣  getBasicVideoInfo()`);
    const basicInfo = await getBasicVideoInfo(testUrl);
    console.log(`   ✅ Title: "${basicInfo.title}"`);
    console.log(`   ✅ Channel: "${basicInfo.channelTitle}"`);

    console.log(`\n5️⃣  getVideoInfo()`);
    const videoInfo = await getVideoInfo(testUrl);
    console.log(`   ✅ Duration: ${videoInfo.duration}`);
    console.log(`   ✅ Views: ${videoInfo.viewCount?.toLocaleString()}`);
    console.log(`   ✅ Description: ${videoInfo.description?.substring(0, 100)}...`);

    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(70));
}

testURLParsing().catch((err) => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
});
