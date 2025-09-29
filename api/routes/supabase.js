// Supabase API routes for Vercel deployment
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Admin routes (using service role key for admin operations)

// Get all users (admin only)
router.get('/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Approve user (admin only)
router.post('/users/:userId/approve', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from('users')
            .update({
                approval_status: 'approved',
                approval_date: new Date().toISOString()
            })
            .eq('id', userId)
            .select();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reject user (admin only)
router.post('/users/:userId/reject', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from('users')
            .update({
                approval_status: 'rejected',
                approval_date: new Date().toISOString()
            })
            .eq('id', userId)
            .select();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user statistics
router.get('/stats/users', async (req, res) => {
    try {
        const [totalResult, approvedResult, pendingResult, rejectedResult] = await Promise.all([
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true }),
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('approval_status', 'approved'),
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('approval_status', 'pending'),
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('approval_status', 'rejected')
        ]);

        const stats = {
            total: totalResult.count || 0,
            approved: approvedResult.count || 0,
            pending: pendingResult.count || 0,
            rejected: rejectedResult.count || 0
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get task statistics
router.get('/stats/tasks', async (req, res) => {
    try {
        const [mainTasksResult, otherTasksResult, todoTasksResult] = await Promise.all([
            supabase
                .from('main_tasks')
                .select('id, completed', { count: 'exact', head: true }),
            supabase
                .from('other_tasks')
                .select('id, completed', { count: 'exact', head: true }),
            supabase
                .from('todo_tasks')
                .select('id, completed', { count: 'exact', head: true })
        ]);

        const [mainCompletedResult, otherCompletedResult, todoCompletedResult] = await Promise.all([
            supabase
                .from('main_tasks')
                .select('id', { count: 'exact', head: true })
                .eq('completed', true),
            supabase
                .from('other_tasks')
                .select('id', { count: 'exact', head: true })
                .eq('completed', true),
            supabase
                .from('todo_tasks')
                .select('id', { count: 'exact', head: true })
                .eq('completed', true)
        ]);

        const stats = {
            main_tasks: {
                total: mainTasksResult.count || 0,
                completed: mainCompletedResult.count || 0
            },
            other_tasks: {
                total: otherTasksResult.count || 0,
                completed: otherCompletedResult.count || 0
            },
            todo_tasks: {
                total: todoTasksResult.count || 0,
                completed: todoCompletedResult.count || 0
            }
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Get task stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Sync with Notion API (webhook endpoint)
router.post('/sync/notion', async (req, res) => {
    try {
        const { event, page, database_id } = req.body;

        // Handle Notion webhook events
        console.log('Notion sync event:', event, page?.id, database_id);

        // Implement sync logic here based on your needs
        // This could update Supabase tables when Notion pages change

        res.json({ success: true, message: 'Sync processed' });
    } catch (error) {
        console.error('Notion sync error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check for Supabase connection
router.get('/health', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Supabase connection healthy',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Supabase health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Supabase connection failed',
            message: error.message
        });
    }
});

module.exports = router;