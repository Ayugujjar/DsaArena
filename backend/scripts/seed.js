const mongoose = require("mongoose");
require("dotenv").config();

const Batch = require("../models/Batch");
const Admin = require("../models/Admin");
const User = require("../models/User");
const DailyProgress = require("../models/DailyProgress");
const ProblemActivity = require("../models/ProblemActivity");
const Notification = require("../models/Notification");
const BootstrapState = require("../models/BootstrapState");
const { getPastDates, formatDate } = require("../utils/dateUtils");

const seedDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dsa_tracker";
    const databaseHost = new URL(mongoUri).hostname;
    const isLocalDatabase = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(
      databaseHost,
    );

    if (
      process.env.NODE_ENV !== "development" ||
      process.env.ALLOW_DESTRUCTIVE_DEV_DB !== "true" ||
      !isLocalDatabase
    ) {
      throw new Error(
        "Development seed refused. Set NODE_ENV=development and ALLOW_DESTRUCTIVE_DEV_DB=true, and use a local MongoDB URI.",
      );
    }

    await mongoose.connect(mongoUri);
    console.log("[Seed] Connected to local development MongoDB");

    // Clear existing data
    await Promise.all([
      Batch.deleteMany({}),
      Admin.deleteMany({}),
      User.deleteMany({}),
      DailyProgress.deleteMany({}),
      ProblemActivity.deleteMany({}),
      Notification.deleteMany({}),
      BootstrapState.deleteMany({}),
    ]);
    console.log("[Seed] Cleared existing database collections");

    // 1. Seed Batches
    const batchesData = [
      {
        name: "Alpha",
        description: "First-year foundational DSA & algorithms batch",
        isActive: true,
      },
      {
        name: "Beta",
        description: "Intermediate problem solving and data structures batch",
        isActive: true,
      },
      {
        name: "Gamma",
        description:
          "Advanced competitive coding and technical interview prep batch",
        isActive: true,
      },
    ];
    const createdBatches = await Batch.insertMany(batchesData);
    console.log(
      `[Seed] Created ${createdBatches.length} batches: Alpha, Beta, Gamma`,
    );

    // 2. Seed Admins
    const superAdmin = await Admin.create({
      name: "Dr. Rajesh Khanna",
      email: "admin@dsa.com",
      password: "Admin@123456",
      role: "Super Admin",
      permissions: [
        "manage_admins",
        "view_students",
        "view_reports",
        "manage_batches",
        "delete_records",
      ],
    });

    const cseAdmin = await Admin.create({
      name: "Prof. Vikram Sharma",
      email: "admin.cse@dsa.com",
      password: "Admin@123456",
      role: "Admin",
      permissions: ["view_students", "view_reports", "manage_batches"],
      createdBy: superAdmin._id,
    });

    const moderator = await Admin.create({
      name: "TA Neha Verma",
      email: "moderator@dsa.com",
      password: "Admin@123456",
      role: "Moderator",
      permissions: ["view_students", "view_reports"],
      createdBy: superAdmin._id,
    });
    console.log(
      "[Seed] Created Super Admin (admin@dsa.com), Admin, and Moderator",
    );

    // 3. Seed Students
    const sampleStudents = [
      {
        name: "Ayush Gujjar",
        email: "ayush@gmail.com",
        password: "Password@123",
        batch: "Gamma",
        branch: "CSE",
        college: "National Institute of Tech",
        leetcodeUsername: "ayush123",
        gfgUsername: "ayush123",
        leetcodeConnected: true,
        gfgConnected: true,
        leetcodeStats: {
          totalSolved: 280,
          easySolved: 140,
          mediumSolved: 110,
          hardSolved: 30,
          ranking: 45200,
          acceptanceRate: 64.5,
          lastSynced: new Date(),
        },
        gfgStats: {
          totalSolved: 120,
          schoolSolved: 10,
          basicSolved: 20,
          easySolved: 40,
          mediumSolved: 35,
          hardSolved: 15,
          codingScore: 560,
          institutionRank: 14,
          lastSynced: new Date(),
        },
        totalSolved: 400,
        dailySolved: 8,
        weeklySolved: 33,
        monthlySolved: 92,
        easySolved: 210,
        mediumSolved: 145,
        hardSolved: 45,
        currentStreak: 12,
        longestStreak: 28,
        lastActive: new Date(),
      },
      {
        name: "Rahul Verma",
        email: "rahul@gmail.com",
        password: "Password@123",
        batch: "Alpha",
        branch: "IT",
        college: "Delhi Technological University",
        leetcodeUsername: "rahul_v",
        gfgUsername: "rahul_codes",
        leetcodeConnected: true,
        gfgConnected: true,
        leetcodeStats: {
          totalSolved: 320,
          easySolved: 160,
          mediumSolved: 130,
          hardSolved: 30,
          ranking: 31200,
          acceptanceRate: 68.2,
          lastSynced: new Date(),
        },
        gfgStats: {
          totalSolved: 150,
          schoolSolved: 15,
          basicSolved: 25,
          easySolved: 50,
          mediumSolved: 45,
          hardSolved: 15,
          codingScore: 680,
          institutionRank: 8,
          lastSynced: new Date(),
        },
        totalSolved: 470,
        dailySolved: 6,
        weeklySolved: 23,
        monthlySolved: 104,
        easySolved: 250,
        mediumSolved: 175,
        hardSolved: 45,
        currentStreak: 15,
        longestStreak: 35,
        lastActive: new Date(),
      },
      {
        name: "Aman Sharma",
        email: "aman@gmail.com",
        password: "Password@123",
        batch: "Beta",
        branch: "CSE",
        college: "BITS Pilani",
        leetcodeUsername: "amancodes",
        gfgUsername: "amansharma",
        leetcodeConnected: true,
        gfgConnected: true,
        leetcodeStats: {
          totalSolved: 250,
          easySolved: 120,
          mediumSolved: 100,
          hardSolved: 30,
          ranking: 52000,
          acceptanceRate: 59.8,
          lastSynced: new Date(),
        },
        gfgStats: {
          totalSolved: 100,
          schoolSolved: 10,
          basicSolved: 20,
          easySolved: 30,
          mediumSolved: 30,
          hardSolved: 10,
          codingScore: 420,
          institutionRank: 22,
          lastSynced: new Date(),
        },
        totalSolved: 350,
        dailySolved: 7,
        weeklySolved: 38,
        monthlySolved: 85,
        easySolved: 180,
        mediumSolved: 130,
        hardSolved: 40,
        currentStreak: 8,
        longestStreak: 20,
        lastActive: new Date(),
      },
      {
        name: "Priya Patel",
        email: "priya@gmail.com",
        password: "Password@123",
        batch: "Gamma",
        branch: "ECE",
        college: "IIT Roorkee",
        leetcodeUsername: "priya_p",
        gfgUsername: "priya_geek",
        leetcodeConnected: true,
        gfgConnected: true,
        leetcodeStats: {
          totalSolved: 210,
          easySolved: 100,
          mediumSolved: 90,
          hardSolved: 20,
          ranking: 64000,
          acceptanceRate: 61.0,
          lastSynced: new Date(),
        },
        gfgStats: {
          totalSolved: 100,
          schoolSolved: 10,
          basicSolved: 20,
          easySolved: 35,
          mediumSolved: 25,
          hardSolved: 10,
          codingScore: 430,
          institutionRank: 21,
          lastSynced: new Date(),
        },
        totalSolved: 310,
        dailySolved: 5,
        weeklySolved: 29,
        monthlySolved: 78,
        easySolved: 165,
        mediumSolved: 115,
        hardSolved: 30,
        currentStreak: 19,
        longestStreak: 25,
        lastActive: new Date(),
      },
      {
        name: "Sneha Roy",
        email: "sneha@gmail.com",
        password: "Password@123",
        batch: "Beta",
        branch: "IT",
        college: "Jadavpur University",
        leetcodeUsername: "sneharoy",
        gfgUsername: "sneha_r",
        leetcodeConnected: true,
        gfgConnected: true,
        leetcodeStats: {
          totalSolved: 185,
          easySolved: 95,
          mediumSolved: 75,
          hardSolved: 15,
          ranking: 78000,
          acceptanceRate: 58.5,
          lastSynced: new Date(),
        },
        gfgStats: {
          totalSolved: 90,
          schoolSolved: 10,
          basicSolved: 20,
          easySolved: 30,
          mediumSolved: 20,
          hardSolved: 10,
          codingScore: 390,
          institutionRank: 30,
          lastSynced: new Date(),
        },
        totalSolved: 275,
        dailySolved: 4,
        weeklySolved: 22,
        monthlySolved: 64,
        easySolved: 155,
        mediumSolved: 95,
        hardSolved: 25,
        currentStreak: 9,
        longestStreak: 22,
        lastActive: new Date(),
      },
      {
        name: "Rohan Gupta",
        email: "rohan@gmail.com",
        password: "Password@123",
        batch: "Alpha",
        branch: "CSE",
        college: "Vellore Institute of Tech",
        leetcodeUsername: "rohan_g",
        gfgUsername: "rohangfg",
        leetcodeConnected: true,
        gfgConnected: true,
        leetcodeStats: {
          totalSolved: 120,
          easySolved: 70,
          mediumSolved: 45,
          hardSolved: 5,
          ranking: 112000,
          acceptanceRate: 52.0,
          lastSynced: new Date(),
        },
        gfgStats: {
          totalSolved: 70,
          schoolSolved: 10,
          basicSolved: 20,
          easySolved: 25,
          mediumSolved: 12,
          hardSolved: 3,
          codingScore: 290,
          institutionRank: 55,
          lastSynced: new Date(),
        },
        totalSolved: 190,
        dailySolved: 3,
        weeklySolved: 16,
        monthlySolved: 48,
        easySolved: 125,
        mediumSolved: 57,
        hardSolved: 8,
        currentStreak: 4,
        longestStreak: 14,
        lastActive: new Date(),
      },
      {
        name: "Kunal Yadav",
        email: "kunal@gmail.com",
        password: "Password@123",
        batch: "Gamma",
        branch: "CSE",
        college: "National Institute of Tech",
        leetcodeUsername: "kunaly",
        gfgUsername: "",
        leetcodeConnected: true,
        gfgConnected: false,
        leetcodeStats: {
          totalSolved: 80,
          easySolved: 50,
          mediumSolved: 28,
          hardSolved: 2,
          ranking: 180000,
          acceptanceRate: 48.0,
          lastSynced: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        gfgStats: { totalSolved: 0 },
        totalSolved: 80,
        dailySolved: 0,
        weeklySolved: 0,
        monthlySolved: 12,
        easySolved: 50,
        mediumSolved: 28,
        hardSolved: 2,
        currentStreak: 0,
        longestStreak: 5,
        lastActive: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Inactive 10 days
      },
      {
        name: "Ananya Sen",
        email: "ananya@gmail.com",
        password: "Password@123",
        batch: "Alpha",
        branch: "IT",
        college: "Delhi Technological University",
        leetcodeUsername: "ananyas",
        gfgUsername: "ananya_gfg",
        leetcodeConnected: true,
        gfgConnected: true,
        leetcodeStats: {
          totalSolved: 60,
          easySolved: 40,
          mediumSolved: 20,
          hardSolved: 0,
          ranking: 230000,
          acceptanceRate: 45.0,
          lastSynced: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        gfgStats: {
          totalSolved: 35,
          schoolSolved: 10,
          basicSolved: 15,
          easySolved: 10,
          mediumSolved: 0,
          hardSolved: 0,
          codingScore: 110,
          institutionRank: 120,
          lastSynced: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        totalSolved: 95,
        dailySolved: 0,
        weeklySolved: 0,
        monthlySolved: 5,
        easySolved: 75,
        mediumSolved: 20,
        hardSolved: 0,
        currentStreak: 0,
        longestStreak: 6,
        lastActive: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Inactive 15 days
      },
    ];

    const past30 = getPastDates(30);

    const problemPool = [
      { name: "Two Sum", platform: "LeetCode", diff: "Easy", slug: "two-sum" },
      {
        name: "Add Two Numbers",
        platform: "LeetCode",
        diff: "Medium",
        slug: "add-two-numbers",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        platform: "LeetCode",
        diff: "Medium",
        slug: "longest-substring-without-repeating-characters",
      },
      {
        name: "Median of Two Sorted Arrays",
        platform: "LeetCode",
        diff: "Hard",
        slug: "median-of-two-sorted-arrays",
      },
      {
        name: "Reverse Integer",
        platform: "LeetCode",
        diff: "Medium",
        slug: "reverse-integer",
      },
      {
        name: "Container With Most Water",
        platform: "LeetCode",
        diff: "Medium",
        slug: "container-with-most-water",
      },
      { name: "3Sum", platform: "LeetCode", diff: "Medium", slug: "3sum" },
      {
        name: "Valid Parentheses",
        platform: "LeetCode",
        diff: "Easy",
        slug: "valid-parentheses",
      },
      {
        name: "Merge Two Sorted Lists",
        platform: "LeetCode",
        diff: "Easy",
        slug: "merge-two-sorted-lists",
      },
      {
        name: "Trapping Rain Water",
        platform: "LeetCode",
        diff: "Hard",
        slug: "trapping-rain-water",
      },
      {
        name: "Subarray with Given Sum",
        platform: "GeeksforGeeks",
        diff: "Medium",
        slug: "subarray-with-given-sum",
      },
      {
        name: "Missing number in array",
        platform: "GeeksforGeeks",
        diff: "Easy",
        slug: "missing-number-in-array",
      },
      {
        name: "Kadane Algorithm",
        platform: "GeeksforGeeks",
        diff: "Medium",
        slug: "kadanes-algorithm",
      },
      {
        name: "Parenthesis Checker",
        platform: "GeeksforGeeks",
        diff: "Easy",
        slug: "parenthesis-checker",
      },
      {
        name: "Check for BST",
        platform: "GeeksforGeeks",
        diff: "Easy",
        slug: "check-for-bst",
      },
      {
        name: "Detect Loop in linked list",
        platform: "GeeksforGeeks",
        diff: "Medium",
        slug: "detect-loop-in-linked-list",
      },
      {
        name: "Edit Distance",
        platform: "LeetCode",
        diff: "Hard",
        slug: "edit-distance",
      },
      {
        name: "Word Break",
        platform: "LeetCode",
        diff: "Medium",
        slug: "word-break",
      },
      {
        name: "LRU Cache",
        platform: "LeetCode",
        diff: "Medium",
        slug: "lru-cache",
      },
      {
        name: "Binary Tree Maximum Path Sum",
        platform: "LeetCode",
        diff: "Hard",
        slug: "binary-tree-maximum-path-sum",
      },
    ];

    for (const studData of sampleStudents) {
      const user = await User.create(studData);

      // Generate 30 days of DailyProgress
      let runningCumulative = Math.max(0, user.totalSolved - 80);
      const isCurrentlyActive = (user.currentStreak || 0) > 0;

      for (let i = 0; i < past30.length; i++) {
        const dateStr = past30[i];
        let dailyCount = 0;

        if (isCurrentlyActive) {
          // If active in past 15 days
          if (i >= past30.length - 15) {
            dailyCount = Math.floor(Math.random() * 5) + 1;
          } else {
            dailyCount =
              Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0;
          }
        } else {
          // Inactive user
          if (i < 15) {
            dailyCount =
              Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 1 : 0;
          } else {
            dailyCount = 0;
          }
        }

        const lc = Math.round(dailyCount * 0.7);
        const gfg = dailyCount - lc;
        runningCumulative += dailyCount;

        await DailyProgress.create({
          userId: user._id,
          date: dateStr,
          leetcodeSolved: lc,
          gfgSolved: gfg,
          totalSolved: dailyCount,
          cumulativeTotal: runningCumulative,
          easySolved: Math.round(dailyCount * 0.5),
          mediumSolved: Math.round(dailyCount * 0.35),
          hardSolved: Math.round(dailyCount * 0.15),
        });
      }

      // Generate sample recent ProblemActivities
      const userProblems = problemPool.slice(0, 10);
      for (let pIdx = 0; pIdx < userProblems.length; pIdx++) {
        const p = userProblems[pIdx];
        const dateOffset = pIdx * 12; // hours
        await ProblemActivity.create({
          userId: user._id,
          platform: p.platform,
          problemName: p.name,
          problemSlug: p.slug,
          problemUrl:
            p.platform === "LeetCode"
              ? `https://leetcode.com/problems/${p.slug}/`
              : `https://www.geeksforgeeks.org/problems/${p.slug}/`,
          difficulty: p.diff,
          solvedAt: new Date(Date.now() - dateOffset * 60 * 60 * 1000),
        });
      }
    }
    console.log(
      `[Seed] Created ${sampleStudents.length} sample students with daily histories & activities`,
    );

    // 4. Seed Announcements
    await Notification.create([
      {
        recipientType: "all",
        title: "Welcome to the DSA Progress Tracking Platform!",
        message:
          "All students are requested to connect both their LeetCode and GeeksforGeeks handles in the Connect Platforms tab.",
        type: "announcement",
        senderName: "Dr. Rajesh Khanna",
      },
      {
        recipientType: "batch",
        batchName: "Gamma",
        title: "Gamma Batch Weekend Contest Announcement",
        message:
          "Reminder: Gamma batch bi-weekly mock contest will commence this Saturday at 6:00 PM. Focus topics: Dynamic Programming & Graphs.",
        type: "announcement",
        senderName: "Prof. Vikram Sharma",
      },
    ]);
    console.log("[Seed] Created default announcements");

    console.log("\n======================================================");
    console.log("  DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("------------------------------------------------------");
    console.log("   SUPER ADMIN LOGIN:");
    console.log("   Email:    admin@dsa.com");
    console.log("   Password: Admin@123456");
    console.log("   Role:     Super Admin");
    console.log("------------------------------------------------------");
    console.log("   STUDENT LOGIN:");
    console.log("   Email:    ayush@gmail.com (Batch: Gamma)");
    console.log("   Password: Password@123");
    console.log("   Email:    rahul@gmail.com (Batch: Alpha)");
    console.log("   Password: Password@123");
    console.log("======================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("[Seed] Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
