/**
 * Test script để kiểm tra transcript của video YouTube
 * Video ID: J6OnBDmErUg
 */

import {
    getTranscript,
    getTranscriptText,
    listTranscripts
} from './dist/index.mjs';

const VIDEO_ID = 'J6OnBDmErUg';

async function testTranscript() {
    try {
        console.log('='.repeat(60));
        console.log(`Testing video: ${VIDEO_ID}`);
        console.log('='.repeat(60));
        console.log('');

        // Bước 1: Liệt kê các transcript có sẵn
        console.log('📋 Fetching available transcripts...');
        const tracks = await listTranscripts(VIDEO_ID);

        console.log(`\n✅ Found ${tracks.length} transcript(s):\n`);
        tracks.forEach((track, index) => {
            console.log(`${index + 1}. Language: ${track.language} (${track.languageCode})`);
            console.log(`   - Generated: ${track.isGenerated ? 'Yes ✨' : 'No 📝'}`);
            console.log(`   - Translatable: ${track.isTranslatable ? 'Yes' : 'No'}`);
            console.log('');
        });

        // Bước 2: Lấy transcript mặc định (English)
        console.log('-'.repeat(60));
        console.log('📝 Fetching English transcript...');
        const segments = await getTranscript(VIDEO_ID, {
            languages: ['en']
        });

        console.log(`\n✅ Got ${segments.length} segments\n`);
        console.log('First 5 segments:');
        segments.slice(0, 5).forEach((seg, i) => {
            console.log(`\n${i + 1}. [${seg.start.toFixed(2)}s] (${seg.duration.toFixed(2)}s)`);
            console.log(`   "${seg.text}"`);
        });

        // Bước 3: Lấy full text
        console.log('\n' + '-'.repeat(60));
        console.log('📄 Full transcript text (first 500 chars):\n');
        const fullText = await getTranscriptText(VIDEO_ID);
        console.log(fullText.substring(0, 500) + '...');

        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log(`\nTotal transcript length: ${fullText.length} characters`);
        console.log(`Total segments: ${segments.length}`);

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ ERROR:');
        console.error('='.repeat(60));
        console.error(`Code: ${error.code || 'UNKNOWN'}`);
        console.error(`Message: ${error.message}`);
        if (error.statusCode) {
            console.error(`Status Code: ${error.statusCode}`);
        }
        console.error('\nStack:', error.stack);
        process.exit(1);
    }
}

testTranscript();
