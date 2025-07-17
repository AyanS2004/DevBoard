const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

class AIService {
  constructor() {
    this.categoryKeywords = {
      'Development': ['code', 'program', 'develop', 'bug', 'fix', 'feature', 'api', 'database', 'frontend', 'backend', 'testing', 'deploy', 'function', 'class', 'method', 'script', 'algorithm', 'optimize', 'refactor', 'implement', 'build', 'compile', 'debug', 'version', 'git', 'commit', 'merge', 'pull', 'push', 'repository', 'framework', 'library', 'package', 'module', 'component', 'service', 'controller', 'model', 'view', 'template', 'stylesheet', 'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'express', 'mongodb', 'sql', 'html', 'css'],
      'Design': ['design', 'ui', 'ux', 'mockup', 'wireframe', 'prototype', 'visual', 'layout', 'style', 'branding', 'graphic', 'logo', 'icon', 'illustration', 'color', 'typography', 'font', 'image', 'photo', 'picture', 'drawing', 'sketch', 'figma', 'adobe', 'photoshop', 'illustrator', 'invision', 'sketch', 'interface', 'user experience', 'user interface', 'responsive', 'mobile', 'desktop', 'web', 'app', 'dashboard', 'landing', 'page'],
      'Planning': ['plan', 'strategy', 'roadmap', 'research', 'analysis', 'meeting', 'discuss', 'review', 'brainstorm', 'outline', 'schedule', 'timeline', 'milestone', 'goal', 'objective', 'target', 'deadline', 'estimate', 'budget', 'scope', 'requirement', 'specification', 'architecture', 'system', 'process', 'workflow', 'methodology', 'agile', 'scrum', 'kanban', 'sprint', 'backlog', 'epic', 'story', 'task'],
      'Documentation': ['document', 'write', 'draft', 'content', 'blog', 'article', 'manual', 'guide', 'tutorial', 'readme', 'wiki', 'help', 'support', 'faq', 'knowledge', 'base', 'documentation', 'spec', 'specification', 'api doc', 'swagger', 'postman', 'comment', 'note', 'memo', 'report', 'summary', 'description', 'explanation', 'instruction', 'procedure', 'step', 'how to', 'user guide', 'technical', 'writing'],
      'Testing': ['test', 'qa', 'quality', 'bug', 'issue', 'debug', 'validate', 'verify', 'check', 'unit test', 'integration test', 'e2e', 'end to end', 'automated', 'manual', 'regression', 'performance', 'load', 'stress', 'security', 'penetration', 'vulnerability', 'coverage', 'assertion', 'expectation', 'scenario', 'case', 'suite', 'runner', 'jest', 'mocha', 'cypress', 'selenium', 'junit', 'pytest', 'assert', 'expect', 'should', 'spec'],
      'Meetings': ['meeting', 'call', 'discussion', 'presentation', 'demo', 'sync', 'standup', 'review', 'conference', 'workshop', 'training', 'onboarding', 'kickoff', 'retrospective', 'planning', 'grooming', 'estimation', 'sprint', 'daily', 'weekly', 'monthly', 'quarterly', 'annual', 'team', 'client', 'stakeholder', 'interview', 'consultation', 'brainstorming', 'collaboration', 'coordination', 'alignment', 'agenda', 'minutes', 'action item'],
      'Administrative': ['email', 'reply', 'organize', 'schedule', 'coordinate', 'follow-up', 'update', 'report', 'admin', 'administrative', 'paperwork', 'form', 'application', 'approval', 'request', 'permission', 'access', 'account', 'profile', 'settings', 'configuration', 'setup', 'installation', 'maintenance', 'backup', 'restore', 'migration', 'deployment', 'release', 'version', 'update', 'upgrade', 'patch', 'hotfix', 'monitoring', 'logging', 'alert', 'notification', 'support', 'ticket', 'issue', 'incident', 'maintenance', 'cleanup', 'archive', 'delete', 'remove', 'export', 'import', 'data', 'backup', 'restore']
    };

    this.priorityIndicators = {
      'high': ['urgent', 'critical', 'asap', 'emergency', 'deadline', 'important', 'priority'],
      'medium': ['normal', 'standard', 'regular', 'ongoing'],
      'low': ['optional', 'nice-to-have', 'future', 'backlog', 'someday']
    };

    this.timeEstimates = {
      'Development': { min: 30, max: 240, avg: 90 },
      'Design': { min: 15, max: 180, avg: 60 },
      'Planning': { min: 20, max: 120, avg: 45 },
      'Documentation': { min: 15, max: 90, avg: 30 },
      'Testing': { min: 10, max: 60, avg: 20 },
      'Meetings': { min: 15, max: 120, avg: 30 },
      'Administrative': { min: 5, max: 30, avg: 10 }
    };
  }

  // Smart task categorization based on title and description
  categorizeTask(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();
    const tokens = tokenizer.tokenize(text);
    
    const scores = {};
    
    // Calculate category scores based on keyword matches
    Object.keys(this.categoryKeywords).forEach(category => {
      scores[category] = 0;
      this.categoryKeywords[category].forEach(keyword => {
        if (text.includes(keyword)) {
          scores[category] += 1;
        }
      });
    });

    // Find the category with highest score
    const maxScore = Math.max(...Object.values(scores));
    
    // Debug logging
    console.log('AI Categorization Debug:', {
      title,
      description,
      text,
      scores,
      maxScore
    });
    
    // If no keywords match, use a more intelligent fallback
    if (maxScore === 0) {
      // Try to categorize based on common patterns
      if (text.includes('meeting') || text.includes('call') || text.includes('discussion')) {
        console.log('Categorized as Meetings (fallback)');
        return {
          category: 'Meetings',
          confidence: 0.6,
          scores: scores
        };
      } else if (text.includes('email') || text.includes('reply') || text.includes('message')) {
        console.log('Categorized as Administrative (fallback)');
        return {
          category: 'Administrative',
          confidence: 0.5,
          scores: scores
        };
      } else if (text.includes('plan') || text.includes('strategy') || text.includes('research')) {
        console.log('Categorized as Planning (fallback)');
        return {
          category: 'Planning',
          confidence: 0.5,
          scores: scores
        };
      } else if (text.includes('write') || text.includes('document') || text.includes('content')) {
        console.log('Categorized as Documentation (fallback)');
        return {
          category: 'Documentation',
          confidence: 0.5,
          scores: scores
        };
      } else if (text.includes('test') || text.includes('check') || text.includes('verify')) {
        console.log('Categorized as Testing (fallback)');
        return {
          category: 'Testing',
          confidence: 0.5,
          scores: scores
        };
      } else if (text.includes('design') || text.includes('ui') || text.includes('layout')) {
        console.log('Categorized as Design (fallback)');
        return {
          category: 'Design',
          confidence: 0.5,
          scores: scores
        };
      }
    }
    
    const bestCategory = Object.keys(scores).find(cat => scores[cat] === maxScore);
    
    console.log('Final categorization:', bestCategory || 'Development');
    
    return {
      category: bestCategory || 'Development',
      confidence: maxScore / Math.max(1, tokens.length),
      scores: scores
    };
  }

  // Suggest priority based on content and patterns
  suggestPriority(title, description = '', dueDate = null) {
    const text = `${title} ${description}`.toLowerCase();
    let score = 0;

    // Check for priority indicators
    Object.keys(this.priorityIndicators).forEach(priority => {
      this.priorityIndicators[priority].forEach(indicator => {
        if (text.includes(indicator)) {
          score += priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
        }
      });
    });

    // Check due date urgency
    if (dueDate) {
      const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 1) score += 3;
      else if (daysUntilDue <= 3) score += 2;
      else if (daysUntilDue <= 7) score += 1;
    }

    // Determine priority based on score
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  // Estimate task duration based on category and complexity
  estimateTaskTime(title, description = '', category = null) {
    const text = `${title} ${description}`.toLowerCase();
    const wordCount = tokenizer.tokenize(text).length;
    
    // Determine complexity based on text length and keywords
    let complexity = 'medium';
    if (wordCount > 50 || text.includes('complex') || text.includes('difficult')) {
      complexity = 'high';
    } else if (wordCount < 10 || text.includes('simple') || text.includes('quick')) {
      complexity = 'low';
    }

    // Get base time for category
    const categoryTime = category && this.timeEstimates[category] 
      ? this.timeEstimates[category] 
      : this.timeEstimates['Development'];

    // Adjust based on complexity
    let estimatedMinutes = categoryTime.avg;
    if (complexity === 'high') estimatedMinutes *= 1.5;
    if (complexity === 'low') estimatedMinutes *= 0.7;

    return {
      minutes: Math.round(estimatedMinutes),
      complexity: complexity,
      confidence: 0.8
    };
  }

  // Generate productivity insights based on task history
  generateInsights(tasks, timeRange = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - (timeRange * 24 * 60 * 60 * 1000));
    
    const recentTasks = tasks.filter(task => 
      new Date(task.createdAt) >= startDate
    );

    const completedTasks = recentTasks.filter(task => task.status === 'done');
    const totalTasks = recentTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Analyze productivity patterns
    const categoryStats = {};
    const hourlyStats = {};
    
    completedTasks.forEach(task => {
      // Category analysis
      const category = task.category || 'Development';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
      
      // Hourly analysis
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
      }
    });

    // Find peak productivity hour
    const peakHour = Object.keys(hourlyStats).reduce((a, b) => 
      hourlyStats[a] > hourlyStats[b] ? a : b, 0
    );

    // Find most productive category
    const mostProductiveCategory = Object.keys(categoryStats).reduce((a, b) => 
      categoryStats[a] > categoryStats[b] ? a : b, 'Development'
    );

    // Generate insights
    const insights = [];

    if (completionRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Completion Rate',
        message: `Your task completion rate is ${completionRate.toFixed(1)}%. Consider breaking down larger tasks or adjusting priorities.`,
        priority: 'high'
      });
    } else if (completionRate > 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Productivity',
        message: `Great job! You're completing ${completionRate.toFixed(1)}% of your tasks. Keep up the momentum!`,
        priority: 'low'
      });
    }

    if (peakHour) {
      insights.push({
        type: 'info',
        title: 'Peak Productivity Time',
        message: `You're most productive around ${peakHour}:00. Try to schedule important tasks during this time.`,
        priority: 'medium'
      });
    }

    if (mostProductiveCategory) {
      insights.push({
        type: 'info',
        title: 'Most Productive Category',
        message: `You complete the most tasks in ${mostProductiveCategory}. Consider focusing on this area for maximum impact.`,
        priority: 'medium'
      });
    }

    return {
      completionRate,
      totalTasks,
      completedTasks: completedTasks.length,
      peakProductivityHour: parseInt(peakHour),
      mostProductiveCategory,
      insights,
      categoryStats,
      hourlyStats
    };
  }

  // Suggest optimal due dates based on workload and patterns
  suggestDueDate(taskComplexity = 'medium', currentWorkload = 0) {
    const baseDays = {
      'low': 1,
      'medium': 3,
      'high': 7
    };

    // Adjust based on current workload
    const workloadMultiplier = 1 + (currentWorkload * 0.2);
    const suggestedDays = Math.ceil(baseDays[taskComplexity] * workloadMultiplier);
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + suggestedDays);
    
    return {
      dueDate: dueDate.toISOString(),
      confidence: 0.7,
      reasoning: `Based on ${taskComplexity} complexity and current workload`
    };
  }

  // Smart task recommendations based on user patterns
  generateTaskRecommendations(tasks, userPreferences = {}) {
    const recommendations = [];
    
    // Analyze task patterns
    const categoryCounts = {};
    const priorityCounts = {};
    
    tasks.forEach(task => {
      categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    });

    // Recommend task diversification
    const categories = Object.keys(categoryCounts);
    if (categories.length < 3) {
      recommendations.push({
        type: 'diversification',
        title: 'Diversify Your Tasks',
        message: 'Consider adding tasks from different categories to maintain a balanced workflow.',
        priority: 'medium'
      });
    }

    // Recommend priority balance
    const highPriorityCount = priorityCounts['high'] || 0;
    const totalTasks = tasks.length;
    
    if (highPriorityCount > totalTasks * 0.5) {
      recommendations.push({
        type: 'priority',
        title: 'Too Many High Priority Tasks',
        message: 'Having too many high-priority tasks can reduce overall productivity. Consider re-prioritizing some tasks.',
        priority: 'high'
      });
    }

    return recommendations;
  }
}

module.exports = new AIService(); 