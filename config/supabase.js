// Supabase configuration and client setup
// 브라우저 환경에서는 CDN을 통해 Supabase 클라이언트를 로드합니다
// HTML 파일에서 다음 스크립트를 포함해야 합니다:
// <script src="https://unpkg.com/@supabase/supabase-js@2"></script>

// 환경변수는 런타임에 설정되거나 HTML에서 직접 설정
const supabaseUrl = window.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Create Supabase client
const supabase = window.supabase?.createClient ?
  window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }) : null;

// Database table names
const TABLES = {
  USERS: 'users',
  MAIN_TASKS: 'main_tasks',
  OTHER_TASKS: 'other_tasks',
  TODO_TASKS: 'todo_tasks',
  JOURNAL_ENTRIES: 'journal_entries',
  RECORDS: 'records',
  EVENTS: 'events'
};

// Authentication helper functions
const auth = {
  // Sign up new user
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name || 'New User',
          ...userData
        }
      }
    });
    return { data, error };
  },

  // Sign in user
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helper functions
const database = {
  // Users
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(updates)
      .eq('id', userId)
      .select();
    return { data, error };
  },

  // Main Tasks
  async getMainTasks(userId, filters = {}) {
    let query = supabase
      .from(TABLES.MAIN_TASKS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }
    if (filters.urgent !== undefined) {
      query = query.eq('urgent', filters.urgent);
    }
    if (filters.due_date) {
      query = query.eq('due_date', filters.due_date);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async createMainTask(userId, taskData) {
    const { data, error } = await supabase
      .from(TABLES.MAIN_TASKS)
      .insert({
        user_id: userId,
        ...taskData
      })
      .select();
    return { data, error };
  },

  async updateMainTask(taskId, updates) {
    const { data, error } = await supabase
      .from(TABLES.MAIN_TASKS)
      .update(updates)
      .eq('id', taskId)
      .select();
    return { data, error };
  },

  async deleteMainTask(taskId) {
    const { data, error } = await supabase
      .from(TABLES.MAIN_TASKS)
      .delete()
      .eq('id', taskId);
    return { data, error };
  },

  // Other Tasks
  async getOtherTasks(userId, filters = {}) {
    let query = supabase
      .from(TABLES.OTHER_TASKS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }
    if (filters.urgent !== undefined) {
      query = query.eq('urgent', filters.urgent);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async createOtherTask(userId, taskData) {
    const { data, error } = await supabase
      .from(TABLES.OTHER_TASKS)
      .insert({
        user_id: userId,
        ...taskData
      })
      .select();
    return { data, error };
  },

  async updateOtherTask(taskId, updates) {
    const { data, error } = await supabase
      .from(TABLES.OTHER_TASKS)
      .update(updates)
      .eq('id', taskId)
      .select();
    return { data, error };
  },

  async deleteOtherTask(taskId) {
    const { data, error } = await supabase
      .from(TABLES.OTHER_TASKS)
      .delete()
      .eq('id', taskId);
    return { data, error };
  },

  // TODO Tasks
  async getTodoTasks(userId, filters = {}) {
    let query = supabase
      .from(TABLES.TODO_TASKS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async createTodoTask(userId, taskData) {
    const { data, error } = await supabase
      .from(TABLES.TODO_TASKS)
      .insert({
        user_id: userId,
        ...taskData
      })
      .select();
    return { data, error };
  },

  async updateTodoTask(taskId, updates) {
    const { data, error } = await supabase
      .from(TABLES.TODO_TASKS)
      .update(updates)
      .eq('id', taskId)
      .select();
    return { data, error };
  },

  async deleteTodoTask(taskId) {
    const { data, error } = await supabase
      .from(TABLES.TODO_TASKS)
      .delete()
      .eq('id', taskId);
    return { data, error };
  },

  // Journal Entries
  async getJournalEntries(userId, filters = {}) {
    let query = supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    if (filters.entry_date) {
      query = query.eq('entry_date', filters.entry_date);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async createJournalEntry(userId, entryData) {
    const { data, error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .insert({
        user_id: userId,
        ...entryData
      })
      .select();
    return { data, error };
  },

  async updateJournalEntry(entryId, updates) {
    const { data, error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .update(updates)
      .eq('id', entryId)
      .select();
    return { data, error };
  },

  async deleteJournalEntry(entryId) {
    const { data, error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .delete()
      .eq('id', entryId);
    return { data, error };
  },

  // Records
  async getRecords(userId, filters = {}) {
    let query = supabase
      .from(TABLES.RECORDS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async createRecord(userId, recordData) {
    const { data, error } = await supabase
      .from(TABLES.RECORDS)
      .insert({
        user_id: userId,
        ...recordData
      })
      .select();
    return { data, error };
  },

  async updateRecord(recordId, updates) {
    const { data, error } = await supabase
      .from(TABLES.RECORDS)
      .update(updates)
      .eq('id', recordId)
      .select();
    return { data, error };
  },

  async deleteRecord(recordId) {
    const { data, error } = await supabase
      .from(TABLES.RECORDS)
      .delete()
      .eq('id', recordId);
    return { data, error };
  },

  // Events
  async getEvents(userId, filters = {}) {
    let query = supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true });

    if (filters.event_date) {
      query = query.eq('event_date', filters.event_date);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async createEvent(userId, eventData) {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .insert({
        user_id: userId,
        ...eventData
      })
      .select();
    return { data, error };
  },

  async updateEvent(eventId, updates) {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .update(updates)
      .eq('id', eventId)
      .select();
    return { data, error };
  },

  async deleteEvent(eventId) {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .delete()
      .eq('id', eventId);
    return { data, error };
  },

  // Get all tasks for dashboard (excluding todo tasks)
  async getAllTasksForDashboard(userId) {
    const [mainTasksResult, otherTasksResult] = await Promise.all([
      this.getMainTasks(userId),
      this.getOtherTasks(userId)
    ]);

    if (mainTasksResult.error || otherTasksResult.error) {
      return {
        data: null,
        error: mainTasksResult.error || otherTasksResult.error
      };
    }

    const allTasks = [
      ...(mainTasksResult.data || []).map(task => ({ ...task, category: '주요' })),
      ...(otherTasksResult.data || []).map(task => ({ ...task, category: '기타' }))
    ];

    return { data: allTasks, error: null };
  }
};

// Real-time subscriptions
const realtime = {
  // Subscribe to task changes
  subscribeToTasks(userId, callback) {
    const channels = [
      supabase
        .channel('main_tasks_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLES.MAIN_TASKS,
            filter: `user_id=eq.${userId}`
          },
          callback
        ),
      supabase
        .channel('other_tasks_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLES.OTHER_TASKS,
            filter: `user_id=eq.${userId}`
          },
          callback
        ),
      supabase
        .channel('todo_tasks_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLES.TODO_TASKS,
            filter: `user_id=eq.${userId}`
          },
          callback
        )
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }
};

// 브라우저 환경을 위한 글로벌 exports
if (typeof window !== 'undefined') {
  window.SupabaseClient = {
    supabase,
    TABLES,
    auth,
    database,
    realtime
  };
}