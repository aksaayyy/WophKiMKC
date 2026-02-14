require('dotenv').config();
const YouTubeUploader = require('../src/services/uploader');

async function setup() {
  console.log('\n--- YouTube OAuth Setup ---\n');
  console.log('1. Go to https://console.cloud.google.com/apis/credentials');
  console.log('2. Create or select an OAuth 2.0 Client ID');
  console.log('3. Add this redirect URI: http://localhost:3001/api/oauth/callback\n');

  const uploader = new YouTubeUploader();
  const authUrl = uploader.getAuthUrl();

  console.log('4. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n5. Authorize the app and copy the redirect URL\n');

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.question('Paste the redirect URL: ', async (redirectUrl) => {
    try {
      const code = new URL(redirectUrl).searchParams.get('code');
      if (!code) {
        console.error('\nNo authorization code found in URL');
        rl.close();
        return;
      }

      const tokens = await uploader.getTokensFromCode(code);
      console.log('\nSuccess! Add this to your .env file:\n');
      console.log(`YOUTUBE_REFRESH_TOKENS=${tokens.refresh_token}\n`);
      rl.close();
    } catch (error) {
      console.error('\nError:', error.message);
      rl.close();
    }
  });
}

setup();
