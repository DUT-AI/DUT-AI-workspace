import { AppRegistryItem } from '@/types/sso';

/**
 * Ecosystem App Registry for DUT-AI Workspace
 * Configures items rendered inside the 9-dots Waffle App Launcher.
 */
export const WORKSPACE_APPS: AppRegistryItem[] = [
  {
    id: 'manage',
    title: 'Hệ thống Quản lý',
    description: 'Bảng điều khiển quản trị trung tâm, người dùng và hệ thống',
    icon: 'LayoutDashboard',
    path: '/manage/dashboard',
    accentColor: 'bg-blue-600',
  },
  {
    id: 'lms',
    title: 'Học tập & Trắc nghiệm',
    description: 'Ngân hàng đề thi, bài tập và khảo sát học thuật LMS',
    icon: 'GraduationCap',
    path: '/lms/dashboard',
    accentColor: 'bg-emerald-600',
  },
  {
    id: 'meetly',
    title: 'Công việc & Lịch trình',
    description: 'Bảng việc Kanban, ghi chú cuộc họp và quản lý đầu việc',
    icon: 'CheckSquare',
    path: '/meetly/tasks',
    accentColor: 'bg-violet-600',
  },
];
