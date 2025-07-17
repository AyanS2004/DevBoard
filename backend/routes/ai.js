const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const aiService = require('../services/aiService');

// Get AI insights for user's productivity
router.get('/insights', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    const insights = aiService.generateInsights(tasks, 30); // Last 30 days
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('AI Insights Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate insights' 
    });
  }
});

// Get task recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    const recommendations = aiService.generateTaskRecommendations(tasks);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate recommendations' 
    });
  }
});

// Analyze task and provide suggestions
router.post('/analyze-task', auth, async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Task title is required' 
      });
    }

    // Get current workload
    const currentTasks = await Task.countDocuments({ 
      user: req.user.id, 
      status: { $in: ['todo', 'inProgress'] } 
    });

    // Generate AI suggestions
    const categorization = aiService.categorizeTask(title, description);
    const prioritySuggestion = aiService.suggestPriority(title, description, dueDate);
    const timeEstimate = aiService.estimateTaskTime(title, description, categorization.category);
    const dueDateSuggestion = aiService.suggestDueDate(timeEstimate.complexity, currentTasks);

    res.json({
      success: true,
      data: {
        categorization,
        prioritySuggestion,
        timeEstimate,
        dueDateSuggestion,
        currentWorkload: currentTasks
      }
    });
  } catch (error) {
    console.error('AI Task Analysis Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to analyze task' 
    });
  }
});

// Get productivity patterns
router.get('/patterns', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    const insights = aiService.generateInsights(tasks, 30);
    
    // Extract patterns
    const patterns = {
      peakProductivityHour: insights.peakProductivityHour,
      mostProductiveCategory: insights.mostProductiveCategory,
      categoryDistribution: insights.categoryStats,
      hourlyDistribution: insights.hourlyStats,
      completionRate: insights.completionRate,
      averageTasksPerDay: insights.totalTasks / 30
    };

    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('AI Patterns Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to analyze patterns' 
    });
  }
});

// Smart task suggestions based on user history
router.get('/suggestions', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    const insights = aiService.generateInsights(tasks, 30);
    
    // Generate smart suggestions
    const suggestions = [];
    
    // Suggest optimal work times
    if (insights.peakProductivityHour) {
      suggestions.push({
        type: 'timing',
        title: 'Optimal Work Time',
        message: `Schedule important tasks around ${insights.peakProductivityHour}:00 for maximum productivity.`,
        priority: 'medium'
      });
    }

    // Suggest category focus
    if (insights.mostProductiveCategory) {
      suggestions.push({
        type: 'category',
        title: 'Focus Area',
        message: `You excel at ${insights.mostProductiveCategory} tasks. Consider prioritizing these for better outcomes.`,
        priority: 'medium'
      });
    }

    // Suggest workload management
    if (insights.completionRate < 60) {
      suggestions.push({
        type: 'workload',
        title: 'Workload Management',
        message: 'Consider reducing your task load or breaking down larger tasks to improve completion rates.',
        priority: 'high'
      });
    }

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('AI Suggestions Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate suggestions' 
    });
  }
});

module.exports = router; 