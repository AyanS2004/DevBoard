const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const Pomodoro = require('../models/Pomodoro');
const Journal = require('../models/Journal');
const auth = require('../middleware/auth');
const natural = require('natural');
const moment = require('moment');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductivityMetrics:
 *       type: object
 *       properties:
 *         totalTasks:
 *           type: number
 *         completedTasks:
 *           type: number
 *         completionRate:
 *           type: number
 *         averageTaskTime:
 *           type: number
 *         productivityScore:
 *           type: number
 *         streakDays:
 *           type: number
 *         focusTimeHours:
 *           type: number
 *         peakProductivityHour:
 *           type: number
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductivityMetrics'
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = moment().subtract(30, 'days').toDate();
    const endDate = new Date();

    // Get all user data
    const [tasks, projects, pomodoros, journals] = await Promise.all([
      Task.find({ userId, createdAt: { $gte: startDate, $lte: endDate } }),
      Project.find({ userId, createdAt: { $gte: startDate, $lte: endDate } }),
      Pomodoro.find({ userId, createdAt: { $gte: startDate, $lte: endDate } }),
      Journal.find({ userId, createdAt: { $gte: startDate, $lte: endDate } })
    ]);

    // Calculate basic metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate average task completion time
    const completedTasksWithTime = tasks.filter(task => task.completed && task.completedAt);
    const averageTaskTime = completedTasksWithTime.length > 0 
      ? completedTasksWithTime.reduce((sum, task) => {
          return sum + (task.completedAt - task.createdAt);
        }, 0) / completedTasksWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Calculate productivity score (0-100)
    const productivityScore = Math.min(100, Math.round(
      (completionRate * 0.4) + 
      (Math.min(100, totalTasks * 2) * 0.3) + 
      (Math.min(100, pomodoros.length * 5) * 0.2) + 
      (Math.min(100, journals.length * 10) * 0.1)
    ));

    // Calculate streak days
    const streakDays = calculateStreakDays(tasks);

    // Calculate focus time
    const focusTimeHours = pomodoros.reduce((sum, p) => sum + (p.duration || 25), 0) / 60;

    // Find peak productivity hour
    const peakProductivityHour = findPeakProductivityHour(tasks);

    // Weekly productivity trend
    const weeklyTrend = calculateWeeklyTrend(tasks);

    // Task category distribution
    const categoryDistribution = calculateCategoryDistribution(tasks);

    // Time of day analysis
    const timeAnalysis = calculateTimeOfDayAnalysis(tasks, pomodoros);

    // Project progress
    const projectProgress = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project._id.toString());
      return {
        name: project.name,
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter(t => t.completed).length,
        progress: projectTasks.length > 0 ? (projectTasks.filter(t => t.completed).length / projectTasks.length) * 100 : 0
      };
    });

    // AI-powered insights
    const insights = await generateAIInsights(tasks, pomodoros, journals);

    res.json({
      overview: {
        totalTasks,
        completedTasks,
        completionRate: Math.round(completionRate),
        averageTaskTime: Math.round(averageTaskTime * 100) / 100,
        productivityScore,
        streakDays,
        focusTimeHours: Math.round(focusTimeHours * 100) / 100,
        peakProductivityHour
      },
      trends: {
        weekly: weeklyTrend,
        categoryDistribution,
        timeAnalysis,
        projectProgress
      },
      insights,
      metadata: {
        dateRange: { start: startDate, end: endDate },
        dataPoints: totalTasks + pomodoros.length + journals.length,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

/**
 * @swagger
 * /api/analytics/heatmap:
 *   get:
 *     summary: Get productivity heatmap data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Heatmap data for productivity visualization
 */
router.get('/heatmap', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = moment().subtract(365, 'days').toDate();
    
    const tasks = await Task.find({ 
      userId, 
      completed: true,
      completedAt: { $gte: startDate } 
    });

    const heatmapData = {};
    
    tasks.forEach(task => {
      const date = moment(task.completedAt).format('YYYY-MM-DD');
      heatmapData[date] = (heatmapData[date] || 0) + 1;
    });

    // Convert to array format for frontend
    const heatmapArray = Object.entries(heatmapData).map(([date, count]) => ({
      date,
      count,
      level: Math.min(4, Math.floor(count / 2)) // 0-4 intensity levels
    }));

    res.json({
      heatmap: heatmapArray,
      totalDays: Object.keys(heatmapData).length,
      maxTasksPerDay: Math.max(...Object.values(heatmapData)),
      averageTasksPerDay: Math.round(Object.values(heatmapData).reduce((a, b) => a + b, 0) / Object.keys(heatmapData).length * 100) / 100
    });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: 'Failed to generate heatmap data' });
  }
});

/**
 * @swagger
 * /api/analytics/export:
 *   get:
 *     summary: Export analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         description: Export format
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to include
 *     responses:
 *       200:
 *         description: Exported data
 */
router.get('/export', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const format = req.query.format || 'json';
    const startDate = moment().subtract(days, 'days').toDate();

    const [tasks, projects, pomodoros, journals] = await Promise.all([
      Task.find({ userId, createdAt: { $gte: startDate } }),
      Project.find({ userId, createdAt: { $gte: startDate } }),
      Pomodoro.find({ userId, createdAt: { $gte: startDate } }),
      Journal.find({ userId, createdAt: { $gte: startDate } })
    ]);

    const exportData = {
      exportDate: new Date(),
      dateRange: { start: startDate, end: new Date() },
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        totalProjects: projects.length,
        totalPomodoros: pomodoros.length,
        totalJournalEntries: journals.length
      },
      tasks: tasks.map(task => ({
        id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        completed: task.completed,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        projectId: task.projectId
      })),
      projects: projects.map(project => ({
        id: project._id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt
      })),
      pomodoros: pomodoros.map(pomodoro => ({
        id: pomodoro._id,
        duration: pomodoro.duration,
        createdAt: pomodoro.createdAt
      })),
      journals: journals.map(journal => ({
        id: journal._id,
        title: journal.title,
        content: journal.content,
        mood: journal.mood,
        createdAt: journal.createdAt
      }))
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="devboard-export-${moment().format('YYYY-MM-DD')}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="devboard-export-${moment().format('YYYY-MM-DD')}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Helper functions

function calculateStreakDays(tasks) {
  const completedTasksByDate = {};
  
  tasks.filter(task => task.completed && task.completedAt).forEach(task => {
    const date = moment(task.completedAt).format('YYYY-MM-DD');
    completedTasksByDate[date] = true;
  });

  const dates = Object.keys(completedTasksByDate).sort().reverse();
  let streak = 0;
  const today = moment().format('YYYY-MM-DD');
  
  for (let i = 0; i < dates.length; i++) {
    const currentDate = dates[i];
    const expectedDate = moment().subtract(i, 'days').format('YYYY-MM-DD');
    
    if (currentDate === expectedDate) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function findPeakProductivityHour(tasks) {
  const hourCounts = {};
  
  tasks.filter(task => task.completed && task.completedAt).forEach(task => {
    const hour = moment(task.completedAt).hour();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  let maxHour = 9; // Default to 9 AM
  let maxCount = 0;
  
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxHour = parseInt(hour);
    }
  });

  return maxHour;
}

function calculateWeeklyTrend(tasks) {
  const weeklyData = {};
  
  for (let i = 0; i < 7; i++) {
    const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
    weeklyData[date] = {
      date,
      completed: 0,
      created: 0
    };
  }

  tasks.forEach(task => {
    const createdDate = moment(task.createdAt).format('YYYY-MM-DD');
    if (weeklyData[createdDate]) {
      weeklyData[createdDate].created++;
    }
    
    if (task.completed && task.completedAt) {
      const completedDate = moment(task.completedAt).format('YYYY-MM-DD');
      if (weeklyData[completedDate]) {
        weeklyData[completedDate].completed++;
      }
    }
  });

  return Object.values(weeklyData).reverse();
}

function calculateCategoryDistribution(tasks) {
  const categories = {};
  
  tasks.forEach(task => {
    const category = task.category || 'Uncategorized';
    categories[category] = (categories[category] || 0) + 1;
  });

  return Object.entries(categories).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / tasks.length) * 100)
  }));
}

function calculateTimeOfDayAnalysis(tasks, pomodoros) {
  const hourlyData = {};
  
  // Initialize hours
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { hour: i, tasks: 0, pomodoros: 0, productivity: 0 };
  }

  // Count tasks by hour
  tasks.filter(task => task.completed && task.completedAt).forEach(task => {
    const hour = moment(task.completedAt).hour();
    hourlyData[hour].tasks++;
  });

  // Count pomodoros by hour
  pomodoros.forEach(pomodoro => {
    const hour = moment(pomodoro.createdAt).hour();
    hourlyData[hour].pomodoros++;
  });

  // Calculate productivity score for each hour
  Object.values(hourlyData).forEach(data => {
    data.productivity = data.tasks * 2 + data.pomodoros;
  });

  return Object.values(hourlyData);
}

async function generateAIInsights(tasks, pomodoros, journals) {
  const insights = [];

  // Analyze task completion patterns
  const completionRate = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;
  
  if (completionRate > 80) {
    insights.push({
      type: 'positive',
      title: 'Excellent Task Completion',
      description: `You're completing ${Math.round(completionRate)}% of your tasks. Keep up the great work!`,
      icon: '🎯',
      priority: 'high'
    });
  } else if (completionRate < 50) {
    insights.push({
      type: 'improvement',
      title: 'Task Completion Opportunity',
      description: `Your completion rate is ${Math.round(completionRate)}%. Consider breaking down larger tasks into smaller, manageable chunks.`,
      icon: '📈',
      priority: 'high'
    });
  }

  // Analyze pomodoro usage
  const avgPomodorosPerDay = pomodoros.length / 7;
  if (avgPomodorosPerDay < 2) {
    insights.push({
      type: 'suggestion',
      title: 'Boost Focus with Pomodoros',
      description: 'Try using more pomodoro sessions to improve focus and productivity. Aim for 4-6 sessions per day.',
      icon: '🍅',
      priority: 'medium'
    });
  }

  // Analyze journal sentiment (basic keyword analysis)
  if (journals.length > 0) {
    const positiveKeywords = ['good', 'great', 'excellent', 'happy', 'productive', 'accomplished'];
    const negativeKeywords = ['bad', 'difficult', 'stressed', 'overwhelmed', 'frustrated'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    journals.forEach(journal => {
      const content = journal.content.toLowerCase();
      positiveKeywords.forEach(keyword => {
        if (content.includes(keyword)) positiveCount++;
      });
      negativeKeywords.forEach(keyword => {
        if (content.includes(keyword)) negativeCount++;
      });
    });

    if (positiveCount > negativeCount) {
      insights.push({
        type: 'positive',
        title: 'Positive Mindset',
        description: 'Your journal entries show a positive outlook. This mindset contributes to your productivity!',
        icon: '😊',
        priority: 'low'
      });
    }
  }

  return insights;
}

function convertToCSV(data) {
  const csvRows = [];
  
  // Add headers
  csvRows.push('Type,Title,Description,Status,Created,Completed,Priority,Duration,Mood');
  
  // Add tasks
  data.tasks.forEach(task => {
    csvRows.push([
      'Task',
      task.title,
      task.description,
      task.completed ? 'Completed' : 'Pending',
      task.createdAt,
      task.completedAt || '',
      task.priority,
      '',
      ''
    ].join(','));
  });
  
  // Add pomodoros
  data.pomodoros.forEach(pomodoro => {
    csvRows.push([
      'Pomodoro',
      'Focus Session',
      '',
      'Completed',
      pomodoro.createdAt,
      '',
      '',
      pomodoro.duration,
      ''
    ].join(','));
  });
  
  // Add journals
  data.journals.forEach(journal => {
    csvRows.push([
      'Journal',
      journal.title,
      journal.content.replace(/,/g, ';'),
      'Completed',
      journal.createdAt,
      '',
      '',
      '',
      journal.mood
    ].join(','));
  });
  
  return csvRows.join('\n');
}

module.exports = router; 