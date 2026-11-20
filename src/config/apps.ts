import { AppRegistryItem } from '@/types/sso';

/**
 * Ecosystem App Registry for DUT-AI Workspace
 * Configures all sub-apps in the ecosystem (subdomains, titles, descriptions, icons).
 */
export const WORKSPACE_APPS: AppRegistryItem[] = [
  {
    id: 'manage',
    title: 'DUT-AI Management',
    shortName: 'Quản trị (Manage)',
    description: 'Bảng điều khiển quản trị trung tâm, tài khoản và phân quyền',
    icon: 'LayoutDashboard',
    url: 'https://manage.dutai.io.vn',
    path: 'https://manage.dutai.io.vn',
    badge: 'Quản trị',
    tags: ['Tài khoản', 'Phân quyền', 'Thống kê'],
    accentColor: 'bg-blue-600',
    order: 1,
    isActive: true,
  },
  {
    id: 'lms',
    title: 'DUT-AI LMS',
    shortName: 'LMS Học tập & Khảo sát',
    description: 'Nền tảng thi trắc nghiệm thông minh, làm bài tập về nhà và khảo sát',
    icon: 'GraduationCap',
    url: 'https://lms.dutai.io.vn',
    path: 'https://lms.dutai.io.vn',
    badge: 'Đào tạo & Khảo sát',
    tags: ['Thi trắc nghiệm', 'Bài tập', 'Khảo sát'],
    accentColor: 'bg-emerald-600',
    order: 2,
    isActive: true,
  },
  {
    id: 'meetly',
    title: 'Meetly Tasks',
    shortName: 'Meetly Công việc',
    description: 'Quản lý công việc trực quan với bảng Kanban, biên bản cuộc họp và tiến độ',
    icon: 'CheckSquare',
    url: 'https://meetly.dutai.io.vn',
    path: 'https://meetly.dutai.io.vn',
    badge: 'Công việc & Lịch trình',
    tags: ['Bảng Kanban', 'Cuộc họp', 'Dự án'],
    accentColor: 'bg-violet-600',
    order: 3,
    isActive: true,
  },
  {
    id: 'data',
    title: 'DUT-AI Data Platform',
    shortName: 'Data Platform',
    description: 'Quản lý dataset, ontology và gán nhãn dữ liệu AI phục vụ huấn luyện mô hình',
    icon: 'Database',
    url: 'https://dataplatform.dutai.io.vn',
    path: 'https://dataplatform.dutai.io.vn',
    badge: 'Dữ liệu & Gán nhãn',
    tags: ['Dataset', 'Ontology', 'Gán nhãn AI'],
    accentColor: 'bg-amber-600',
    order: 4,
    isActive: true,
  },
];
