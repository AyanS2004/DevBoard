const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const moment = require('moment');

// In-memory notification storage (in production, use Redis or Database)
const notifications = new Map();

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [task, pomodoro, journal, system, achievement]
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         read:
 *           type: boolean
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         actions:
 *           type: array
 *           items:
 *             type: object
 */

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unread === 'true';
    
    let userNotifications = notifications.get(userId) || [];
    
    if (unreadOnly) {
      userNotifications = userNotifications.filter(n => !n.read);
    }
    
    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Limit results
    const limitedNotifications = userNotifications.slice(0, limit);
    
    res.json({
      notifications: limitedNotifications,
      totalCount: userNotifications.length,
      unreadCount: userNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *               sendEmail:
 *                 type: boolean
 *               sendPush:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Notification sent successfully
 */
router.post('/send', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, title, message, priority = 'medium', sendEmail = false, sendPush = true, actions = [] } = req.body;
    
    const notification = {
      id: generateId(),
      userId,
      type,
      title,
      message,
      priority,
      read: false,
      createdAt: new Date().toISOString(),
      actions
    };
    
    // Store notification
    if (!notifications.has(userId)) {
      notifications.set(userId, []);
    }
    notifications.get(userId).push(notification);
    
    // Send real-time notification via WebSocket
    if (sendPush && req.app.get('io')) {
      req.app.get('io').to(`user-${userId}`).emit('notification', notification);
    }
    
    // Send email notification
    if (sendEmail && req.user.email) {
      await sendEmailNotification(req.user.email, title, message, type);
    }
    
    res.status(201).json({
      success: true,
      notification,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    const userNotifications = notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    notification.readAt = new Date().toISOString();
    
    // Send real-time update
    if (req.app.get('io')) {
      req.app.get('io').to(`user-${userId}`).emit('notification-read', { id: notificationId });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userNotifications = notifications.get(userId) || [];
    
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    userNotifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
      }
    });
    
    // Send real-time update
    if (req.app.get('io')) {
      req.app.get('io').to(`user-${userId}`).emit('notifications-read-all');
    }
    
    res.json({
      success: true,
      message: `${unreadCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    const userNotifications = notifications.get(userId) || [];
    const index = userNotifications.findIndex(n => n.id === notificationId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    userNotifications.splice(index, 1);
    
    // Send real-time update
    if (req.app.get('io')) {
      req.app.get('io').to(`user-${userId}`).emit('notification-deleted', { id: notificationId });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

/**
 * @swagger
 * /api/notifications/settings:
 *   get:
 *     summary: Get notification settings
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings
 */
router.get('/settings', auth, async (req, res) => {
  try {
    // In production, these would be stored in database
    const defaultSettings = {
      email: {
        enabled: true,
        taskReminders: true,
        pomodoroBreaks: true,
        dailySummary: true,
        weeklyReport: true
      },
      push: {
        enabled: true,
        taskDeadlines: true,
        pomodoroAlerts: true,
        achievements: true,
        mentions: true
      },
      schedule: {
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        workingDays: [1, 2, 3, 4, 5] // Monday to Friday
      }
    };
    
    res.json(defaultSettings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

/**
 * @swagger
 * /api/notifications/settings:
 *   put:
 *     summary: Update notification settings
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/settings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;
    
    // In production, save to database
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Notification settings updated',
      settings
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Smart notification functions
router.post('/smart/task-reminder', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId, taskTitle, dueDate } = req.body;
    
    const now = new Date();
    const due = new Date(dueDate);
    const timeDiff = due - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    let priority = 'medium';
    let message = `Don't forget about "${taskTitle}"`;
    
    if (hoursDiff < 1) {
      priority = 'urgent';
      message = `🚨 "${taskTitle}" is due in less than 1 hour!`;
    } else if (hoursDiff < 24) {
      priority = 'high';
      message = `⚠️ "${taskTitle}" is due tomorrow`;
    } else if (hoursDiff < 72) {
      priority = 'medium';
      message = `📅 "${taskTitle}" is due in ${Math.ceil(hoursDiff / 24)} days`;
    }
    
    const notification = {
      id: generateId(),
      userId,
      type: 'task',
      title: 'Task Reminder',
      message,
      priority,
      read: false,
      createdAt: new Date().toISOString(),
      actions: [
        {
          type: 'link',
          label: 'View Task',
          url: `/tasks/${taskId}`
        },
        {
          type: 'action',
          label: 'Mark Complete',
          action: 'complete-task',
          taskId
        }
      ]
    };
    
    // Store notification
    if (!notifications.has(userId)) {
      notifications.set(userId, []);
    }
    notifications.get(userId).push(notification);
    
    // Send real-time notification
    if (req.app.get('io')) {
      req.app.get('io').to(`user-${userId}`).emit('notification', notification);
    }
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Smart task reminder error:', error);
    res.status(500).json({ error: 'Failed to send task reminder' });
  }
});

router.post('/smart/achievement', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, title, description, icon = '🏆' } = req.body;
    
    const notification = {
      id: generateId(),
      userId,
      type: 'achievement',
      title: `${icon} Achievement Unlocked!`,
      message: `${title}: ${description}`,
      priority: 'high',
      read: false,
      createdAt: new Date().toISOString(),
      actions: [
        {
          type: 'share',
          label: 'Share Achievement',
          data: { type, title, description }
        }
      ]
    };
    
    // Store notification
    if (!notifications.has(userId)) {
      notifications.set(userId, []);
    }
    notifications.get(userId).push(notification);
    
    // Send real-time notification with celebration effect
    if (req.app.get('io')) {
      req.app.get('io').to(`user-${userId}`).emit('achievement', {
        notification,
        celebrate: true
      });
    }
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Achievement notification error:', error);
    res.status(500).json({ error: 'Failed to send achievement notification' });
  }
});

// Helper functions
async function sendEmailNotification(email, title, message, type) {
  try {
    const emailTemplate = getEmailTemplate(type, title, message);
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'DevBoard <noreply@devboard.com>',
      to: email,
      subject: title,
      html: emailTemplate
    });
    
    console.log(`Email notification sent to ${email}`);
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

function getEmailTemplate(type, title, message) {
  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2196F3; }
        .notification { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📊 DevBoard</div>
        </div>
        <div class="notification">
          <h2 style="margin-top: 0;">${title}</h2>
          <p>${message}</p>
        </div>
        <div class="footer">
          <p>You received this notification from DevBoard. <a href="#">Manage your notification preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return baseTemplate;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = router; 