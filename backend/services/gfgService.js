const axios = require('axios');

/**
 * Service adapter for GeeksforGeeks public profile and statistics.
 * Supports public API mirrors and direct profile metadata parsing.
 */
class GFGService {
  constructor() {
    this.profileUrl = 'https://authapi.geeksforgeeks.org/api-get/user-profile-info/';
    this.submissionsUrl = 'https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/';
    this.headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://www.geeksforgeeks.org',
      Referer: 'https://www.geeksforgeeks.org/',
    };
  }

  async checkAvailability() {
    const startedAt = Date.now();
    try {
      await axios.get('https://www.geeksforgeeks.org/', {
        headers: this.headers,
        timeout: 5000,
      });
      return { status: 'Operational', latencyMs: Date.now() - startedAt };
    } catch {
      return { status: 'Unreachable', latencyMs: Date.now() - startedAt };
    }
  }

  /**
   * Fetches public GFG stats for given username.
   * @param {string} username
   * @returns {Promise<{
   *   success: boolean,
   *   username: string,
   *   totalSolved: number,
   *   schoolSolved: number,
   *   basicSolved: number,
   *   easySolved: number,
   *   mediumSolved: number,
   *   hardSolved: number,
   *   codingScore: number,
   *   institutionRank: number,
   *   recentSubmissions: Array,
   *   error?: string
   * }>}
   */
  async fetchUserProfile(username) {
    if (!username || typeof username !== 'string') {
      return { success: false, error: 'Username is required' };
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(cleanUsername)) {
      return { success: false, username: cleanUsername, error: 'GeeksforGeeks username contains invalid characters' };
    }

    // Strategy 1: GeeksforGeeks public profile and solved-problems APIs
    try {
      const officialData = await this._fetchFromOfficialApi(cleanUsername);
      if (officialData) {
        return officialData;
      }
    } catch (err) {
      console.warn(`[GFGService] Official API fetch failed for ${cleanUsername}: ${err.message}`);
    }

    // Strategy 2: Legacy public stats mirror
    try {
      const mirrorData = await this._fetchFromMirror(cleanUsername);
      const mirrorTotal =
        mirrorData?.totalProblemsSolved ??
        mirrorData?.raw?.totalProblemsSolved ??
        mirrorData?.info?.totalProblemsSolved;
      if (mirrorData && mirrorTotal !== undefined && Number.isFinite(Number(mirrorTotal))) {
        return this._formatMirrorResponse(cleanUsername, mirrorData);
      }
    } catch (err) {
      console.warn(`[GFGService] Legacy stats mirror failed for ${cleanUsername}: ${err.message}`);
    }

    // Strategy 3: Direct public profile page HTML parse
    try {
      const htmlData = await this._fetchFromProfileHtml(cleanUsername);
      if (htmlData && htmlData.totalSolved >= 0) {
        return htmlData;
      }
    } catch (err) {
      console.warn(`[GFGService] Profile page fetch failed for ${cleanUsername}: ${err.message}`);
    }

    return {
      success: false,
      username: cleanUsername,
      error: 'User not found or GFG profile is private/inaccessible',
      totalSolved: 0,
      schoolSolved: 0,
      basicSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      codingScore: 0,
      institutionRank: 0,
      recentSubmissions: [],
    };
  }

  async _fetchFromOfficialApi(username) {
    const profileResponse = await axios.get(this.profileUrl, {
      params: { handle: username, article_count: 'false', redirect: 'true' },
      timeout: 8000,
      headers: this.headers,
    });
    const profile = profileResponse.data?.data;
    if (
      profileResponse.data?.message !== 'data retrieved successfully' ||
      !profile ||
      !Number.isFinite(Number(profile.total_problems_solved))
    ) {
      return null;
    }

    let submissionData = null;
    try {
      const submissionsResponse = await axios.post(
        this.submissionsUrl,
        { handle: username, requestType: '', year: '', month: '' },
        { timeout: 8000, headers: this.headers }
      );
      if (submissionsResponse.data?.status === 'success' && submissionsResponse.data.result) {
        submissionData = submissionsResponse.data;
      } else {
        throw new Error('GeeksforGeeks returned no solved-problem data');
      }
    } catch (error) {
      console.warn(`[GFGService] Solved-problem history unavailable for ${username}: ${error.message}`);
    }

    const problemsByDifficulty = submissionData?.result || {};
    const countFor = (difficulty) => Object.keys(problemsByDifficulty[difficulty] || {}).length;
    const recentSubmissions = [];
    const difficultyNames = {
      school: 'School',
      basic: 'Basic',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    };

    Object.entries(problemsByDifficulty).forEach(([difficulty, problems]) => {
      const normalizedDifficulty = difficultyNames[difficulty.toLowerCase()] || 'Unknown';
      Object.values(problems || {}).forEach((problem) => {
        if (!problem?.pname || !problem?.slug || !problem?.user_subtime) return;

        const timestamp = problem.user_subtime.trim().replace(' ', 'T');
        const solvedAt = new Date(`${timestamp}Z`);
        if (Number.isNaN(solvedAt.getTime())) return;

        recentSubmissions.push({
          platform: 'GeeksforGeeks',
          problemName: problem.pname,
          problemSlug: problem.slug,
          problemUrl: `https://www.geeksforgeeks.org/problems/${problem.slug}/`,
          difficulty: normalizedDifficulty,
          solvedAt,
        });
      });
    });

    return {
      success: true,
      username,
      totalSolved: Number(profile.total_problems_solved),
      schoolSolved: countFor('School'),
      basicSolved: countFor('Basic'),
      easySolved: countFor('Easy'),
      mediumSolved: countFor('Medium'),
      hardSolved: countFor('Hard'),
      codingScore: Number(profile.score) || 0,
      institutionRank: Number(profile.institute_rank) || 0,
      recentSubmissions,
      lastSynced: new Date(),
    };
  }

  async _fetchFromMirror(username) {
    const res = await axios.get(`https://geeks-for-geeks-stats-api.vercel.app/api?raw=Y&userName=${username}`, {
      timeout: 8000,
      headers: {
        'User-Agent': 'DsArena-CollegePlatform/1.0',
      },
    });
    return res.data;
  }

  async _fetchFromProfileHtml(username) {
    const url = `https://www.geeksforgeeks.org/user/${username}/`;
    const res = await axios.get(url, {
      headers: this.headers,
      timeout: 8000,
    });

    const html = res.data;
    if (typeof html !== 'string') return null;

    // Check if 404 or profile not found
    if (html.includes('Page Not Found') || html.includes('User does not exist')) {
      return null;
    }

    // Attempt to extract problem counts and coding score via regex
    let totalSolved = 0;
    const totalMatch = html.match(/Problems\s*Solved[:\s]*<\/span>\s*<span[^>]*>(\d+)/i);
    if (totalMatch) {
      totalSolved = parseInt(totalMatch[1], 10);
    }

    let codingScore = 0;
    const scoreMatch = html.match(/Coding\s*Score[:\s]*<\/span>\s*<span[^>]*>(\d+)/i) ||
                        html.match(/Coding\s*Score.*?(\d+)/i);
    if (scoreMatch) {
      codingScore = parseInt(scoreMatch[1], 10);
    }

    let schoolSolved = 0;
    let basicSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    const schoolMatch = html.match(/SCHOOL\s*\((\d+)\)/i);
    if (schoolMatch) schoolSolved = parseInt(schoolMatch[1], 10);

    const basicMatch = html.match(/BASIC\s*\((\d+)\)/i);
    if (basicMatch) basicSolved = parseInt(basicMatch[1], 10);

    const easyMatch = html.match(/EASY\s*\((\d+)\)/i);
    if (easyMatch) easySolved = parseInt(easyMatch[1], 10);

    const mediumMatch = html.match(/MEDIUM\s*\((\d+)\)/i);
    if (mediumMatch) mediumSolved = parseInt(mediumMatch[1], 10);

    const hardMatch = html.match(/HARD\s*\((\d+)\)/i);
    if (hardMatch) hardSolved = parseInt(hardMatch[1], 10);

    if (totalSolved === 0 && (schoolSolved || basicSolved || easySolved || mediumSolved || hardSolved)) {
      totalSolved = schoolSolved + basicSolved + easySolved + mediumSolved + hardSolved;
    }

    if (!totalMatch && !scoreMatch && !schoolMatch && !basicMatch && !easyMatch && !mediumMatch && !hardMatch) {
      return null;
    }

    return {
      success: true,
      username,
      totalSolved,
      schoolSolved,
      basicSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      codingScore,
      institutionRank: 0,
      recentSubmissions: [],
      lastSynced: new Date(),
    };
  }

  _formatMirrorResponse(username, data) {
    const raw = data.raw || data.info || data;
    const rawTotal = data.totalProblemsSolved ?? raw.totalProblemsSolved ?? 0;
    const totalSolved = parseInt(rawTotal, 10);

    const schoolSolved = parseInt(raw.School || raw.school || 0, 10);
    const basicSolved = parseInt(raw.Basic || raw.basic || 0, 10);
    const easySolved = parseInt(raw.Easy || raw.easy || 0, 10);
    const mediumSolved = parseInt(raw.Medium || raw.medium || 0, 10);
    const hardSolved = parseInt(raw.Hard || raw.hard || 0, 10);
    const codingScore = parseInt(data.codingScore || raw.codingScore || 0, 10);
    const institutionRank = parseInt(data.institutionRank || raw.institutionRank || 0, 10);

    return {
      success: true,
      username,
      totalSolved: totalSolved || (schoolSolved + basicSolved + easySolved + mediumSolved + hardSolved),
      schoolSolved,
      basicSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      codingScore,
      institutionRank,
      recentSubmissions: [],
      lastSynced: new Date(),
    };
  }
}

module.exports = new GFGService();
