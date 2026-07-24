import type { Certification } from '@/lib/types';

/**
 * 내장 자격증 프리셋 50종. examDate/recommendedTotalMinutes는 배포 시점 상수 —
 * 시험일 갱신은 매년 번들 업데이트로 처리한다.
 */
export const BUILTIN_CERTS: Certification[] = [
  // IT
  { id: 'cert_sqld', name: 'SQLD', category: 'IT', examDate: '2026-09-05', recommendedTotalMinutes: 6000, isBuiltIn: true, _v: 1 },
  { id: 'cert_sqlp', name: 'SQLP', category: 'IT', examDate: '2026-09-05', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },
  { id: 'cert_infoproc', name: '정보처리기사', category: 'IT', examDate: '2026-08-08', recommendedTotalMinutes: 12000, isBuiltIn: true, _v: 1 },
  { id: 'cert_infoprocsan', name: '정보처리산업기사', category: 'IT', examDate: '2026-08-08', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },
  { id: 'cert_adsp', name: 'ADsP', category: 'IT', examDate: '2026-09-12', recommendedTotalMinutes: 4500, isBuiltIn: true, _v: 1 },
  { id: 'cert_adp', name: 'ADP', category: 'IT', examDate: '2026-09-12', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },
  { id: 'cert_bigdata', name: '빅데이터분석기사', category: 'IT', examDate: '2026-10-10', recommendedTotalMinutes: 12000, isBuiltIn: true, _v: 1 },
  { id: 'cert_infosec', name: '정보보안기사', category: 'IT', examDate: '2026-09-19', recommendedTotalMinutes: 12000, isBuiltIn: true, _v: 1 },
  { id: 'cert_network1', name: '네트워크관리사 1급', category: 'IT', examDate: '2026-08-22', recommendedTotalMinutes: 6000, isBuiltIn: true, _v: 1 },
  { id: 'cert_linux1', name: '리눅스마스터 1급', category: 'IT', examDate: '2026-11-14', recommendedTotalMinutes: 6000, isBuiltIn: true, _v: 1 },
  { id: 'cert_itq', name: 'ITQ 한글', category: 'IT', examDate: '2026-08-15', recommendedTotalMinutes: 1800, isBuiltIn: true, _v: 1 },
  { id: 'cert_gtq1', name: 'GTQ 1급', category: 'IT', examDate: '2026-08-15', recommendedTotalMinutes: 1800, isBuiltIn: true, _v: 1 },

  // 어학
  { id: 'cert_toeic', name: 'TOEIC', category: '어학', examDate: '2026-08-16', recommendedTotalMinutes: 3000, isBuiltIn: true, _v: 1 },
  { id: 'cert_toeic_speaking', name: 'TOEIC Speaking', category: '어학', examDate: '2026-08-23', recommendedTotalMinutes: 1800, isBuiltIn: true, _v: 1 },
  { id: 'cert_opic', name: 'OPIc', category: '어학', examDate: '2026-08-30', recommendedTotalMinutes: 1800, isBuiltIn: true, _v: 1 },
  { id: 'cert_teps', name: 'TEPS', category: '어학', examDate: '2026-09-06', recommendedTotalMinutes: 3000, isBuiltIn: true, _v: 1 },
  { id: 'cert_ielts', name: 'IELTS', category: '어학', examDate: '2026-09-13', recommendedTotalMinutes: 6000, isBuiltIn: true, _v: 1 },
  { id: 'cert_toefl', name: 'TOEFL iBT', category: '어학', examDate: '2026-09-20', recommendedTotalMinutes: 6000, isBuiltIn: true, _v: 1 },
  { id: 'cert_jlpt_n1', name: 'JLPT N1', category: '어학', examDate: '2026-12-06', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },
  { id: 'cert_jlpt_n2', name: 'JLPT N2', category: '어학', examDate: '2026-12-06', recommendedTotalMinutes: 6000, isBuiltIn: true, _v: 1 },
  { id: 'cert_hsk5', name: 'HSK 5급', category: '어학', examDate: '2026-11-22', recommendedTotalMinutes: 6000, isBuiltIn: true, _v: 1 },
  { id: 'cert_hsk6', name: 'HSK 6급', category: '어학', examDate: '2026-11-22', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },

  // 역사
  { id: 'cert_history_adv', name: '한국사능력검정시험 심화', category: '역사', examDate: '2026-08-08', recommendedTotalMinutes: 3000, isBuiltIn: true, _v: 1 },
  { id: 'cert_history_basic', name: '한국사능력검정시험 기본', category: '역사', examDate: '2026-08-08', recommendedTotalMinutes: 1800, isBuiltIn: true, _v: 1 },
  { id: 'cert_hanja1', name: '한자능력검정시험 1급', category: '역사', examDate: '2026-11-08', recommendedTotalMinutes: 6000, isBuiltIn: true, _v: 1 },
  { id: 'cert_hanja2', name: '한자능력검정시험 2급', category: '역사', examDate: '2026-11-08', recommendedTotalMinutes: 3000, isBuiltIn: true, _v: 1 },

  // 부동산
  { id: 'cert_realestate_agent', name: '공인중개사', category: '부동산', examDate: '2026-10-31', recommendedTotalMinutes: 12000, isBuiltIn: true, _v: 1 },
  { id: 'cert_housing_mgr', name: '주택관리사보', category: '부동산', examDate: '2026-09-26', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },
  { id: 'cert_appraiser', name: '감정평가사', category: '부동산', examDate: '2026-08-01', recommendedTotalMinutes: 18000, isBuiltIn: true, _v: 1 },
  { id: 'cert_urban_plan', name: '도시계획기사', category: '부동산', examDate: '2026-08-08', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },
  { id: 'cert_realestate_am', name: '부동산자산관리사', category: '부동산', examDate: '2026-09-12', recommendedTotalMinutes: 4500, isBuiltIn: true, _v: 1 },
  { id: 'cert_auction_consultant', name: '경매권리분석사', category: '부동산', examDate: '2026-10-17', recommendedTotalMinutes: 4500, isBuiltIn: true, _v: 1 },
  { id: 'cert_realestate_rights', name: '부동산권리분석사', category: '부동산', examDate: '2026-11-21', recommendedTotalMinutes: 4500, isBuiltIn: true, _v: 1 },
  { id: 'cert_facility_mgr', name: '시설관리사', category: '부동산', examDate: '2026-09-19', recommendedTotalMinutes: 6000, isBuiltIn: true, _v: 1 },

  // 기타
  { id: 'cert_social_worker', name: '사회복지사 1급', category: '기타', examDate: '2026-12-05', recommendedTotalMinutes: 12000, isBuiltIn: true, _v: 1 },
  { id: 'cert_care_worker', name: '요양보호사', category: '기타', examDate: '2026-08-29', recommendedTotalMinutes: 1800, isBuiltIn: true, _v: 1 },
  { id: 'cert_forklift', name: '지게차운전기능사', category: '기타', examDate: '2026-08-16', recommendedTotalMinutes: 900, isBuiltIn: true, _v: 1 },
  { id: 'cert_cook_korean', name: '한식조리기능사', category: '기타', examDate: '2026-09-05', recommendedTotalMinutes: 1800, isBuiltIn: true, _v: 1 },
  { id: 'cert_bakery', name: '제과제빵기능사', category: '기타', examDate: '2026-09-05', recommendedTotalMinutes: 1800, isBuiltIn: true, _v: 1 },
  { id: 'cert_colorist', name: '컬러리스트기사', category: '기타', examDate: '2026-10-10', recommendedTotalMinutes: 4500, isBuiltIn: true, _v: 1 },
  { id: 'cert_interior_arch', name: '실내건축기사', category: '기타', examDate: '2026-08-08', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },
  { id: 'cert_electrician', name: '전기기사', category: '기타', examDate: '2026-09-19', recommendedTotalMinutes: 18000, isBuiltIn: true, _v: 1 },
  { id: 'cert_ind_safety', name: '산업안전기사', category: '기타', examDate: '2026-08-22', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },
  { id: 'cert_distribution_mgr', name: '유통관리사 2급', category: '기타', examDate: '2026-08-15', recommendedTotalMinutes: 3000, isBuiltIn: true, _v: 1 },
  { id: 'cert_logistics_mgr', name: '물류관리사', category: '기타', examDate: '2026-08-01', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },
  { id: 'cert_security_guide', name: '경비지도사', category: '기타', examDate: '2026-11-07', recommendedTotalMinutes: 6000, isBuiltIn: true, _v: 1 },
  { id: 'cert_insurance_adj', name: '손해사정사', category: '기타', examDate: '2026-09-05', recommendedTotalMinutes: 9000, isBuiltIn: true, _v: 1 },
  { id: 'cert_actuary', name: '보험계리사', category: '기타', examDate: '2026-09-05', recommendedTotalMinutes: 12000, isBuiltIn: true, _v: 1 },
  { id: 'cert_labor_attorney', name: '공인노무사', category: '기타', examDate: '2026-08-08', recommendedTotalMinutes: 18000, isBuiltIn: true, _v: 1 },
  { id: 'cert_barista', name: '바리스타 2급', category: '기타', examDate: '2026-08-29', recommendedTotalMinutes: 900, isBuiltIn: true, _v: 1 },
];
