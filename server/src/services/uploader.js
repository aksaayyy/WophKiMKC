const { google } = require('googleapis');
const fs = require('fs');
const logger = require('../utils/logger');
const config = require('../config');

class YouTubeUploader {
  constructor() {
    const refreshTokens = config.youtube.refreshTokens
      ? config.youtube.refreshTokens.split(',').map(t => t.trim()).filter(t => t)
      : [];

    this.accounts = refreshTokens.map((token, index) => ({
      id: index + 1,
      refreshToken: token,
      uploadCount: 0,
    }));

    this.currentAccountIndex = 0;

    this.oauth2Client = new google.auth.OAuth2(
      config.youtube.clientId,
      config.youtube.clientSecret,
      config.youtube.redirectUri
    );

    if (this.accounts.length > 0) {
      logger.info(`Initialized ${this.accounts.length} YouTube account(s) for upload rotation`);
    }
  }

  isConfigured() {
    return this.accounts.length > 0;
  }

  getNextAccount() {
    if (this.accounts.length === 0) {
      throw new Error('No YouTube accounts configured');
    }
    const account = this.accounts[this.currentAccountIndex];
    this.currentAccountIndex = (this.currentAccountIndex + 1) % this.accounts.length;
    logger.info(`Using YouTube account ${account.id} (${account.uploadCount} uploads so far)`);
    return account;
  }

  async uploadShort(videoPath, metadata, retriesLeft = null) {
    if (retriesLeft === null) {
      retriesLeft = this.accounts.length;
    }

    if (retriesLeft <= 0) {
      throw new Error('All YouTube accounts have failed or exceeded quota');
    }

    const account = this.getNextAccount();

    try {
      this.oauth2Client.setCredentials({ refresh_token: account.refreshToken });

      const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });

      logger.info(`Uploading to YouTube: ${metadata.title}`);

      const response = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: '22',
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
          },
        },
        media: {
          body: fs.createReadStream(videoPath),
        },
      });

      const videoId = response.data.id;
      account.uploadCount++;

      logger.info(`Upload successful! Video ID: ${videoId} (Account ${account.id})`);

      return {
        id: videoId,
        url: `https://youtube.com/shorts/${videoId}`,
        accountId: account.id,
      };
    } catch (error) {
      let errorMsg = error.message;
      if (error.response?.data?.error) {
        const details = error.response.data.error;
        errorMsg = typeof details === 'string' ? details : (details.message || JSON.stringify(details));
      }

      logger.error(`Upload failed on account ${account.id}: ${errorMsg}`);

      if (retriesLeft > 1) {
        logger.info(`Retrying with next account... (${retriesLeft - 1} attempts left)`);
        return this.uploadShort(videoPath, metadata, retriesLeft - 1);
      }

      throw new Error(errorMsg);
    }
  }

  generateMetadata(videoTitle, clipNumber, totalClips) {
    const title = totalClips > 1
      ? `${videoTitle} - Part ${clipNumber}/${totalClips}`
      : videoTitle;

    const truncatedTitle = title.length > 100 ? title.substring(0, 97) + '...' : title;

    return {
      title: truncatedTitle,
      description: `Clip ${clipNumber} of ${totalClips}\n\n#Shorts #Viral #Trending #YouTubeShorts`,
      tags: ['shorts', 'viral', 'trending', 'youtube shorts', 'short video'],
    };
  }

  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.upload'],
      prompt: 'consent',
    });
  }

  async getTokensFromCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  getStats() {
    return this.accounts.map(acc => ({
      accountId: acc.id,
      uploadCount: acc.uploadCount,
    }));
  }
}

module.exports = YouTubeUploader;
