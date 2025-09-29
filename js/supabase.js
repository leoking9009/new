// Supabase 클라이언트 설정
const SUPABASE_URL = 'https://bzyzkeejctyskxwfswek.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eXprZWVqY3R5c2t4d2Zzd2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODAyMDEsImV4cCI6MjA3NDY1NjIwMX0.LUgPrpQq1u1-1QTRqEth_6l3OkaGpytYHC5p5VNSxHs';

// Supabase 클라이언트 생성
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 인증 관련 유틸리티 함수
class AuthService {
    static async signUp(email, password, name) {
        try {
            // 1. Supabase Auth로 사용자 등록
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (error) throw error;

            // 2. users 테이블에 추가 정보 저장
            if (data.user) {
                const { error: insertError } = await supabaseClient
                    .from('users')
                    .insert([
                        {
                            id: data.user.id,
                            email: email,
                            name: name,
                            approval_status: 'pending'
                        }
                    ]);

                if (insertError) throw insertError;
            }

            return { success: true, user: data.user };
        } catch (error) {
            console.error('회원가입 오류:', error);
            return { success: false, message: error.message };
        }
    }

    static async signIn(email, password) {
        try {
            // 1. Supabase Auth로 로그인
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // 2. users 테이블에서 승인 상태 확인
            const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (userError) throw userError;

            // 3. 승인 상태 확인
            if (userData.approval_status !== 'approved') {
                await supabaseClient.auth.signOut();
                return {
                    success: false,
                    message: userData.approval_status === 'pending'
                        ? '아직 관리자 승인이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.'
                        : '계정이 승인되지 않았습니다. 관리자에게 문의해주세요.'
                };
            }

            return {
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    name: userData.name,
                    status: userData.approval_status
                }
            };
        } catch (error) {
            console.error('로그인 오류:', error);
            return { success: false, message: error.message };
        }
    }

    static async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('로그아웃 오류:', error);
            return { success: false, message: error.message };
        }
    }

    static async getCurrentUser() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return null;

            const { data: userData, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            return {
                id: user.id,
                email: user.email,
                name: userData.name,
                status: userData.approval_status
            };
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