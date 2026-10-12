const axios = require('axios');

/**
 * Service adapter for LeetCode public profile and statistics.
 * Uses public GraphQL API with fallback to public stats API mirrors.
 */
class LeetCodeService {
  constructor() {
    this.graphqlUrl = 'https://leetcode.com/graphql';
    this.headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
    };
  }

  async checkAvailability() {
    const startedAt = Date.now();
    try {
      await axios.post(
        this.graphqlUrl,
        { query: 'query HealthCheck { __typename }' },
        { headers: this.headers, timeout: 5000 }
      );
      return { status: 'Operational', latencyMs: Date.now() - startedAt };
    } catch {
      return { status: 'Unreachable', latencyMs: Date.now() - startedAt };
    }
  }

  /**
   * Fetches public stats and recent AC submissions for a given username.
   * @param {string} username
   * @returns {Promise<{
   *   success: boolean,
   *   username: string,
   *   totalSolved: number,
   *   easySolved: number,
   *   mediumSolved: number,
   *   hardSolved: number,
   *   ranking: number,
   *   acceptanceRate: number,
   *   submissionCalendar: Object,
   *   recentSubmissions: Array,
   *   error?: string
   * }>}
   */
  async fetchUserProfile(username) {
    if (!username || typeof username !== 'string') {
      return { success: false, error: 'Username is required' };
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9_-]{1,39}$/.test(cleanUsername)) {
      return { success: false, username: cleanUsername, error: 'LeetCode username contains invalid characters' };
    }

    // Strategy 1: Official Public GraphQL
    try {
      const graphQLData = await this._fetchGraphQL(cleanUsername);
      if (graphQLData && graphQLData.matchedUser) {
        return this._formatGraphQLResponse(cleanUsername, graphQLData);
      }
    } catch (err) {
      console.warn(`[LeetCodeService] GraphQL query failed for ${cleanUsername}: ${err.message}. Trying fallback API...`);
    }

    // Strategy 2: Fallback to public open stats mirror
    try {
      const mirrorData = await this._fetchStatsMirror(cleanUsername);
      if (mirrorData && mirrorData.status === 'success') {
        return this._formatMirrorResponse(cleanUsername, mirrorData);
      }
    } catch (err) {
      console.warn(`[LeetCodeService] Stats mirror failed for ${cleanUsername}: ${err.message}`);
    }

    return {
      success: false,
      username: cleanUsername,
      error: 'User not found or LeetCode profile is private/inaccessible',
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      ranking: 0,
      acceptanceRate: 0,
      submissionCalendar: {},
      recentSubmissions: [],
    };
  }

  /**
   * Internal GraphQL query
   */
  async _fetchGraphQL(username) {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            userAvatar
          }
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          submissionCalendar
        }
        recentAcSubmissionList(username: $username, limit: 15) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `;

    const response = await axios.post(
      this.graphqlUrl,
      {
        query,
        variables: { username },
      },
      {
        headers: this.headers,
        timeout: 8000,
      }
    );

    return response.data?.data;
  }

  /**
   * Internal Mirror API query
   */
  async _fetchStatsMirror(username) {
    const response = await axios.get(`https://leetcode-stats-api.herokuapp.com/${username}`, {
      timeout: 8000,
      headers: {
        'User-Agent': 'DsArena-CollegePlatform/1.0',
      },
    });
    return response.data;
  }

  _formatGraphQLResponse(username, data) {
    const user = data.matchedUser;
    const acSubmissions = user.submitStats?.acSubmissionNum || [];

    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    acSubmissions.forEach((item) => {
      const diff = (item.difficulty || '').toLowerCase();
      if (diff === 'all') totalSolved = item.count;
      else if (diff === 'easy') easySolved = item.count;
      else if (diff === 'medium') mediumSolved = item.count;
      else if (diff === 'hard') hardSolved = item.count;
    });

    let calendar = {};
    try {
      if (user.submissionCalendar) {
        calendar = JSON.parse(user.submissionCalendar);
      }
    } catch {
      calendar = {};
    }

    const recentSubmissions = (data.recentAcSubmissionList || []).map((sub) => ({
      platform: 'LeetCode',
      problemName: sub.title,
      problemSlug: sub.titleSlug,
      problemUrl: `https://leetcode.com/problems/${sub.titleSlug}/`,
      solvedAt: new Date(Number(sub.timestamp) * 1000),
      difficulty: 'Unknown',
    }));

    return {
      success: true,
      username,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      ranking: user.profile?.ranking || 0,
      acceptanceRate: 0,
      submissionCalendar: calendar,
      recentSubmissions,
      lastSynced: new Date(),
    };
  }

  _formatMirrorResponse(username, data) {
    return {
      success: true,
      username,
      totalSolved: data.totalSolved || 0,
      easySolved: data.easySolved || 0,
      mediumSolved: data.mediumSolved || 0,
      hardSolved: data.hardSolved || 0,
      ranking: data.ranking || 0,
      acceptanceRate: data.acceptanceRate || 0,
      submissionCalendar: data.submissionCalendar || {},
      recentSubmissions: [],
      lastSynced: new Date(),
    };
  }
}

module.exports = new LeetCodeService();
