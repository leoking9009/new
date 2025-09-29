// Supabase 클라이언트 설정
const SUPABASE_URL = 'https://bzyzkeejctyskxwfswek.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eXprZWVqY3R5c2t4d2Zzd2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODAyMDEsImV4cCI6MjA3NDY1NjIwMX0.LUgPrpQq1u1-1QTRqEth_6l3OkaGpytYHC5p5VNSxHs';

// Supabase 클라이언트 생성
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 인증 관련 유틸리티 함수
class AuthService {
    static async signUp(email, name) {
        try {
            // Notion 서버로 회원가입 요청
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'register',
                    email: email,
                    name: name
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('회원가입 오류:', error);
            return { success: false, message: error.message };
        }
    }

    static async signIn(email) {
        try {
            // Notion 서버로 로그인 요청
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('로그인 오류:', error);
            return { success: false, message: error.message };
        }
    }

    static async signOut() {
        try {
            // 로컬 스토리지에서 사용자 정보 제거
            localStorage.removeItem('user');
            return { success: true };
        } catch (error) {
            console.error('로그아웃 오류:', error);
            return { success: false, message: error.message };
        }
    }

    static async getCurrentUser() {
        try {
            // 로컬 스토리지에서 사용자 정보 가져오기
            const userStr = localStorage.getItem('user');
            console.log('🔍 LocalStorage user data:', userStr);

            if (!userStr) {
                console.log('❌ No user data in localStorage');
                return null;
            }

            const user = JSON.parse(userStr);
            console.log('✅ Parsed user data:', user);
            return user;
        } catch (error) {
            console.error('사용자 정보 가져오기 오류:', error);
            return null;
        }
    }
}

// Tasks 관련 서비스
class TaskService {
    static async getTasks(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, tasks: data };
        } catch (error) {
            console.error('태스크 조회 오류:', error);
            return { success: false, message: error.message };
        }
    }

    static async createTask(userId, taskData) {
        try {
            const { data, error } = await supabaseClient
                .from('tasks')
                .insert([
                    {
                        user_id: userId,
                        title: taskData.title,
                        content: taskData.content || '',
                        status: taskData.status || 'pending',
                        priority: taskData.priority || 'medium',
                        due_date: taskData.due_date || null
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return { success: true, task: data };
        } catch (error) {
            console.error('태스크 생성 오류:', error);
            return { success: false, message: error.message };
        }
    }

    static async updateTask(taskId, updates) {
        try {
            const { data, error } = await supabaseClient
                .from('tasks')
                .update(updates)
                .eq('id', taskId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, task: data };
        } catch (error) {
            console.error('태스크 업데이트 오류:', error);
            return { success: false, message: error.message };
        }
    }

    static async deleteTask(taskId) {
        try {
            const { error } = await supabaseClient
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('태스크 삭제 오류:', error);
            return { success: false, message: error.message };
        }
    }
}