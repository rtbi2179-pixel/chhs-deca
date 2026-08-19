/*
 * Blue Blazer Events Page — Cinematic Dark Editorial
 * Full catalog of DECA competitive events with embedded resource links
 * Filterable by career cluster and event type
 */

import { useDeferredValue, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Search, ChevronDown, ChevronUp, BookOpen, FileText, Video, Globe, Target, Loader2, ArrowUpRight, LibraryBig, CheckCircle2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/_core/hooks/useAuth'

const EVENTS_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663512099215/gkmjm4geRMb8GU58vHezuc/deca-events-bg-F7GzUTZoYD495mEMhM979L.webp'

type Cluster = 'All' | 'Marketing' | 'Finance' | 'Hospitality & Tourism' | 'Business Management' | 'Entrepreneurship' | 'Personal Finance'

interface EventResource {
  label: string
  url: string
  type: 'guide' | 'exam' | 'video' | 'practice' | 'external'
}

export interface DECAEvent {
  code: string
  name: string
  cluster: Cluster
  type: string
  participants: string
  description: string
  resources: EventResource[]
}

export const allEvents: DECAEvent[] = [
  // ── MARKETING ──
  {
    code: 'AAM', name: 'Apparel and Accessories Marketing Series', cluster: 'Marketing', type: 'Individual Series', participants: '1',
    description: 'Covers retailing, marketing, and management concepts specific to the apparel and accessories industry.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/apparel-and-accessories-marketing-series', type: 'guide' },
      { label: 'Marketing Cluster Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
      { label: 'Sample Marketing Exam (TeachDECA)', url: 'https://teachdeca.org/wp-content/uploads/2019/08/Teach_DECA_Marketing_Sample_Exam.pdf', type: 'practice' },
      { label: 'Quizlet Flashcards', url: 'https://quizlet.com/276054979/deca-marketing-cluster-practice-exam-flash-cards/', type: 'practice' },
    ],
  },
  {
    code: 'ASM', name: 'Automotive Services Marketing Series', cluster: 'Marketing', type: 'Individual Series', participants: '1',
    description: 'Focuses on marketing and management in the automotive services industry.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/automotive-services-marketing-series', type: 'guide' },
      { label: 'Marketing Cluster Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
      { label: 'Sample Marketing Exam', url: 'https://teachdeca.org/wp-content/uploads/2019/08/Teach_DECA_Marketing_Sample_Exam.pdf', type: 'practice' },
    ],
  },
  {
    code: 'BSM', name: 'Business Services Marketing Series', cluster: 'Marketing', type: 'Individual Series', participants: '1',
    description: 'Covers marketing concepts in the business services sector.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/business-services-marketing-series', type: 'guide' },
      { label: 'Marketing Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'FMS', name: 'Food Marketing Series', cluster: 'Marketing', type: 'Individual Series', participants: '1',
    description: 'Focuses on marketing and management in the food industry.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/food-marketing-series', type: 'guide' },
      { label: 'Marketing Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'MCS', name: 'Marketing Communications Series', cluster: 'Marketing', type: 'Individual Series', participants: '1',
    description: 'Covers advertising, public relations, and marketing communications.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/marketing-communications-series', type: 'guide' },
      { label: 'Marketing Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'RMS', name: 'Retail Merchandising Series', cluster: 'Marketing', type: 'Individual Series', participants: '1',
    description: 'Covers retail management, buying, and merchandising concepts.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/retail-merchandising-series', type: 'guide' },
      { label: 'Marketing Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'SEM', name: 'Sports and Entertainment Marketing Series', cluster: 'Marketing', type: 'Individual Series', participants: '1',
    description: 'Focuses on marketing in sports, entertainment, and recreation industries.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/sports-and-entertainment-marketing-series', type: 'guide' },
      { label: 'Marketing Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'PMK', name: 'Principles of Marketing', cluster: 'Marketing', type: 'Principles', participants: '1',
    description: 'For first-year DECA members. Covers fundamental marketing concepts and principles.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/principles-of-marketing', type: 'guide' },
      { label: 'Sample Role-Play Presentation', url: 'https://www.deca.org/advisor-resources/principles-of-marketing-presentation', type: 'video' },
      { label: 'Marketing Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'MTDM', name: 'Marketing Management Team Decision Making', cluster: 'Marketing', type: 'Team Decision Making', participants: '2',
    description: 'Teams analyze a marketing management case study and develop a solution.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/marketing-management-team-decision-making', type: 'guide' },
      { label: 'Marketing Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'BTDM', name: 'Buying and Merchandising Team Decision Making', cluster: 'Marketing', type: 'Team Decision Making', participants: '2',
    description: 'Teams solve a buying and merchandising case study.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/buying-and-merchandising-team-decision-making', type: 'guide' },
      { label: 'Marketing Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'STDM', name: 'Sports and Entertainment Marketing Team Decision Making', cluster: 'Marketing', type: 'Team Decision Making', participants: '2',
    description: 'Teams analyze a sports/entertainment marketing case study.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/sports-and-entertainment-marketing-team-decision-making', type: 'guide' },
      { label: 'Marketing Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'PSE', name: 'Professional Selling', cluster: 'Marketing', type: 'Professional Selling', participants: '1',
    description: 'Demonstrates professional selling skills in a simulated sales call.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/professional-selling', type: 'guide' },
      { label: 'Marketing Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'SEOR', name: 'Sports and Entertainment Marketing Operations Research', cluster: 'Marketing', type: 'Business Operations Research', participants: '1-3',
    description: 'Written event analyzing operations in sports/entertainment marketing.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/sports-and-entertainment-marketing-operations-research', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
      { label: 'Texas DECA Written Event Resources', url: 'https://www.texasdeca.org/resources-for-writtenprepared-events', type: 'external' },
    ],
  },
  {
    code: 'BMOR', name: 'Buying and Merchandising Operations Research', cluster: 'Marketing', type: 'Business Operations Research', participants: '1-3',
    description: 'Written event analyzing buying and merchandising operations.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/buying-and-merchandising-operations-research', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'IMCE', name: 'Integrated Marketing Campaign-Event', cluster: 'Marketing', type: 'Integrated Marketing Campaign', participants: '1-3',
    description: 'Develop a comprehensive marketing campaign for an event.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/integrated-marketing-campaign-event', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
      { label: 'Texas DECA Written Event Resources', url: 'https://www.texasdeca.org/resources-for-writtenprepared-events', type: 'external' },
    ],
  },
  {
    code: 'IMCP', name: 'Integrated Marketing Campaign-Product', cluster: 'Marketing', type: 'Integrated Marketing Campaign', participants: '1-3',
    description: 'Develop a comprehensive marketing campaign for a product.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/integrated-marketing-campaign-product', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'IMCS', name: 'Integrated Marketing Campaign-Service', cluster: 'Marketing', type: 'Integrated Marketing Campaign', participants: '1-3',
    description: 'Develop a comprehensive marketing campaign for a service.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/integrated-marketing-campaign-service', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },

  // ── FINANCE ──
  {
    code: 'ACT', name: 'Accounting Applications Series', cluster: 'Finance', type: 'Individual Series', participants: '1',
    description: 'Covers accounting principles, financial statements, and business finance.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/accounting-applications-series', type: 'guide' },
      { label: 'Finance Cluster Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
      { label: 'Sample Finance Exam (TeachDECA)', url: 'https://teachdeca.org/wp-content/uploads/2019/08/Teach_DECA_Finance_Sample_Exam.pdf', type: 'practice' },
    ],
  },
  {
    code: 'BFS', name: 'Business Finance Series', cluster: 'Finance', type: 'Individual Series', participants: '1',
    description: 'Focuses on financial analysis, investment, and business finance concepts.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/business-finance-series', type: 'guide' },
      { label: 'Finance Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
      { label: 'Sample Finance Exam', url: 'https://teachdeca.org/wp-content/uploads/2019/08/Teach_DECA_Finance_Sample_Exam.pdf', type: 'practice' },
    ],
  },
  {
    code: 'FCE', name: 'Financial Consulting', cluster: 'Finance', type: 'Individual Series', participants: '1',
    description: 'Covers financial planning, investment strategies, and consulting.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/financial-consulting', type: 'guide' },
      { label: 'Finance Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'PFN', name: 'Principles of Finance', cluster: 'Finance', type: 'Principles', participants: '1',
    description: 'For first-year members. Covers fundamental finance and accounting concepts.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/principles-of-finance', type: 'guide' },
      { label: 'Finance Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'FTDM', name: 'Financial Services Team Decision Making', cluster: 'Finance', type: 'Team Decision Making', participants: '2',
    description: 'Teams analyze a financial services case study and develop solutions.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/financial-services-team-decision-making', type: 'guide' },
      { label: 'Finance Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'FOR', name: 'Finance Operations Research', cluster: 'Finance', type: 'Business Operations Research', participants: '1-3',
    description: 'Written event analyzing financial operations of a business.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/finance-operations-research', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'SMG', name: 'Stock Market Game', cluster: 'Finance', type: 'Online Simulation', participants: '1-3',
    description: 'Online simulation where teams manage a virtual investment portfolio.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/stock-market-game', type: 'guide' },
      { label: 'Stock Market Game Official', url: 'https://www.stockmarketgame.org/', type: 'external' },
      { label: 'Investopedia Simulator', url: 'https://www.investopedia.com/simulator/', type: 'external' },
    ],
  },

  // ── HOSPITALITY & TOURISM ──
  {
    code: 'HLM', name: 'Hotel and Lodging Management Series', cluster: 'Hospitality & Tourism', type: 'Individual Series', participants: '1',
    description: 'Covers hotel management, front desk operations, and hospitality concepts.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/hotel-and-lodging-management-series', type: 'guide' },
      { label: 'Hospitality Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
      { label: 'H&T Practice Exam (Quizlet)', url: 'https://quizlet.com/446417010/deca-hospitality-and-tourism-practice-exam-1-50-flash-cards/', type: 'practice' },
    ],
  },
  {
    code: 'QSRM', name: 'Quick Serve Restaurant Management Series', cluster: 'Hospitality & Tourism', type: 'Individual Series', participants: '1',
    description: 'Focuses on quick service restaurant operations and management.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/quick-serve-restaurant-management-series', type: 'guide' },
      { label: 'Hospitality Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'RFSM', name: 'Restaurant and Food Service Management Series', cluster: 'Hospitality & Tourism', type: 'Individual Series', participants: '1',
    description: 'Covers full-service restaurant management and food service operations.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/restaurant-and-food-service-management-series', type: 'guide' },
      { label: 'Hospitality Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'PHT', name: 'Principles of Hospitality and Tourism', cluster: 'Hospitality & Tourism', type: 'Principles', participants: '1',
    description: 'For first-year members. Covers fundamental hospitality and tourism concepts.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/principles-of-hospitality-and-tourism', type: 'guide' },
      { label: 'Hospitality Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
      { label: 'H&T Practice Quiz', url: 'https://wayground.com/admin/quiz/5df28267953902001b7cd0a0/deca-hospitality-tourism-practice-test', type: 'practice' },
    ],
  },
  {
    code: 'HTDM', name: 'Hospitality Services Team Decision Making', cluster: 'Hospitality & Tourism', type: 'Team Decision Making', participants: '2',
    description: 'Teams analyze a hospitality services case study.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/hospitality-services-team-decision-making', type: 'guide' },
      { label: 'Hospitality Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'TTDM', name: 'Travel and Tourism Team Decision Making', cluster: 'Hospitality & Tourism', type: 'Team Decision Making', participants: '2',
    description: 'Teams analyze a travel and tourism case study.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/travel-and-tourism-team-decision-making', type: 'guide' },
      { label: 'Hospitality Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'HTPS', name: 'Hospitality and Tourism Professional Selling', cluster: 'Hospitality & Tourism', type: 'Professional Selling', participants: '1',
    description: 'Demonstrates professional selling skills in a hospitality/tourism context.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/hospitality-and-tourism-professional-selling', type: 'guide' },
      { label: 'Hospitality Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'HTOR', name: 'Hospitality and Tourism Operations Research', cluster: 'Hospitality & Tourism', type: 'Business Operations Research', participants: '1-3',
    description: 'Written event analyzing hospitality and tourism operations.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/hospitality-and-tourism-operations-research', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },

  // ── BUSINESS MANAGEMENT ──
  {
    code: 'HRM', name: 'Human Resources Management Series', cluster: 'Business Management', type: 'Individual Series', participants: '1',
    description: 'Covers HR management, staffing, training, and employee relations.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/human-resources-management-series', type: 'guide' },
      { label: 'BMA Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
      { label: 'Sample HR Role-Play', url: 'https://www.deca.org/advisor-resources/human-resources-sample-role-play-presentation', type: 'video' },
      { label: 'Sample BMA Exam (TeachDECA)', url: 'https://teachdeca.org/wp-content/uploads/2019/08/Teach_DECA_Business_Management_Sample_Exam.pdf', type: 'practice' },
    ],
  },
  {
    code: 'PBM', name: 'Principles of Business Management and Administration', cluster: 'Business Management', type: 'Principles', participants: '1',
    description: 'For first-year members. Covers fundamental business management concepts.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/principles-of-business-management-and-administration', type: 'guide' },
      { label: 'BMA Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
      { label: 'Sample BMA Exam', url: 'https://teachdeca.org/wp-content/uploads/2019/08/Teach_DECA_Business_Management_Sample_Exam.pdf', type: 'practice' },
    ],
  },
  {
    code: 'BLTDM', name: 'Business Law and Ethics Team Decision Making', cluster: 'Business Management', type: 'Team Decision Making', participants: '2',
    description: 'Teams analyze a business law and ethics case study.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/business-law-and-ethics-team-decision-making', type: 'guide' },
      { label: 'BMA Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'BOR', name: 'Business Services Operations Research', cluster: 'Business Management', type: 'Business Operations Research', participants: '1-3',
    description: 'Written event analyzing business services operations.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/business-services-operations-research', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
      { label: 'BOR Integration Guide', url: 'https://www.deca.org/advisor-resources/integrating-written-events-into-your-classroom', type: 'guide' },
    ],
  },
  {
    code: 'PMBS', name: 'Business Solutions Project', cluster: 'Business Management', type: 'Project Management', participants: '1-3',
    description: 'Develop and implement a business solution for a real organization.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/business-solutions-project', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'PMCD', name: 'Career Development Project', cluster: 'Business Management', type: 'Project Management', participants: '1-3',
    description: 'Develop a comprehensive career development plan and portfolio.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/career-development-project', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'PMCA', name: 'Community Awareness Project', cluster: 'Business Management', type: 'Project Management', participants: '1-3',
    description: 'Create and implement a community awareness campaign.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/community-awareness-project', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'PMCG', name: 'Community Giving Project', cluster: 'Business Management', type: 'Project Management', participants: '1-3',
    description: 'Plan and execute a community giving/fundraising initiative.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/community-giving-project', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'IBP', name: 'International Business Plan', cluster: 'Business Management', type: 'Entrepreneurship', participants: '1-3',
    description: 'Develop a comprehensive business plan for an international market.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/international-business-plan', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
      { label: 'Texas DECA Written Event Resources', url: 'https://www.texasdeca.org/resources-for-writtenprepared-events', type: 'external' },
    ],
  },

  // ── ENTREPRENEURSHIP ──
  {
    code: 'ENT', name: 'Entrepreneurship Series', cluster: 'Entrepreneurship', type: 'Individual Series', participants: '1',
    description: 'Covers entrepreneurship concepts, business planning, and innovation.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/entrepreneurship-series', type: 'guide' },
      { label: 'Entrepreneurship Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'PEN', name: 'Principles of Entrepreneurship', cluster: 'Entrepreneurship', type: 'Principles', participants: '1',
    description: 'For first-year members. Covers fundamental entrepreneurship concepts.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/principles-of-entrepreneurship', type: 'guide' },
      { label: 'Entrepreneurship Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'ETDM', name: 'Entrepreneurship Team Decision Making', cluster: 'Entrepreneurship', type: 'Team Decision Making', participants: '2',
    description: 'Teams analyze an entrepreneurship case study.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/entrepreneurship-team-decision-making', type: 'guide' },
      { label: 'Entrepreneurship Exam Blueprint', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', type: 'exam' },
    ],
  },
  {
    code: 'EBG', name: 'Business Growth Plan', cluster: 'Entrepreneurship', type: 'Entrepreneurship Written', participants: '1-3',
    description: 'Develop a comprehensive growth plan for an existing business.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/business-growth-plan', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
      { label: 'Texas DECA Written Event Resources', url: 'https://www.texasdeca.org/resources-for-writtenprepared-events', type: 'external' },
    ],
  },
  {
    code: 'EFB', name: 'Franchise Business Plan', cluster: 'Entrepreneurship', type: 'Entrepreneurship Written', participants: '1-3',
    description: 'Develop a business plan for a franchise operation.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/franchise-business-plan', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'EIB', name: 'Independent Business Plan', cluster: 'Entrepreneurship', type: 'Entrepreneurship Written', participants: '1-3',
    description: 'Develop a comprehensive business plan for a new independent business.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/independent-business-plan', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'EIP', name: 'Innovation Plan', cluster: 'Entrepreneurship', type: 'Entrepreneurship Written', participants: '1-3',
    description: 'Develop an innovative solution to a business problem.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/innovation-plan', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'ESB', name: 'Start-Up Business Plan', cluster: 'Entrepreneurship', type: 'Entrepreneurship Written', participants: '1-3',
    description: 'Develop a business plan for a new start-up company.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/start-up-business-plan', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },

  // ── PERSONAL FINANCE ──
  {
    code: 'PFL', name: 'Personal Financial Literacy', cluster: 'Personal Finance', type: 'Personal Financial Literacy', participants: '1',
    description: 'Covers personal financial planning, budgeting, investing, and financial decision-making.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/personal-financial-literacy', type: 'guide' },
      { label: 'PFL Exam Resource', url: 'https://www.deca.org/advisor-resources/personal-financial-literacy-exam-2025', type: 'exam' },
      { label: 'NGPF Free Resources', url: 'https://www.ngpf.org/', type: 'external' },
    ],
  },
  {
    code: 'PMFL', name: 'Financial Literacy Project', cluster: 'Personal Finance', type: 'Project Management', participants: '1-3',
    description: 'Develop and implement a financial literacy education program.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/financial-literacy-project', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
  {
    code: 'PMSP', name: 'Sales Project', cluster: 'Marketing', type: 'Project Management', participants: '1-3',
    description: 'Plan and execute a sales promotion or campaign project.',
    resources: [
      { label: 'DECA Event Page', url: 'https://www.deca.org/compete/sales-project', type: 'guide' },
      { label: 'Written Event Guide', url: 'https://www.decadirect.org/articles/the-ultimate-written-event-guide', type: 'guide' },
    ],
  },
]

const clusters: Cluster[] = ['All', 'Marketing', 'Finance', 'Hospitality & Tourism', 'Business Management', 'Entrepreneurship', 'Personal Finance']

const clusterColors: Record<Cluster, string> = {
  'All': 'bg-white/10 text-white border-white/20',
  'Marketing': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Finance': 'bg-green-500/15 text-green-300 border-green-500/30',
  'Hospitality & Tourism': 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'Business Management': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Entrepreneurship': 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  'Personal Finance': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
}

const resourceIcons = {
  guide: FileText,
  exam: Target,
  video: Video,
  practice: BookOpen,
  external: Globe,
}

const resourceColors = {
  guide: 'text-blue-400',
  exam: 'text-yellow-400',
  video: 'text-red-400',
  practice: 'text-green-400',
  external: 'text-purple-400',
}

const EVENT_CLUSTER_TO_PI_CLUSTER = {
  'Marketing': 'Marketing',
  'Finance': 'Finance',
  'Hospitality & Tourism': 'Hospitality & Tourism',
  'Business Management': 'Business Management & Administration',
  'Entrepreneurship': 'Entrepreneurship',
  'Personal Finance': 'Personal Financial Literacy',
} as const

type PiCluster = (typeof EVENT_CLUSTER_TO_PI_CLUSTER)[keyof typeof EVENT_CLUSTER_TO_PI_CLUSTER]

type EventPiStudyDialogProps = {
  event: DECAEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EventPiStudyDialog({ event, open, onOpenChange }: EventPiStudyDialogProps) {
  const [piSearch, setPiSearch] = useState('')
  const [piOffset, setPiOffset] = useState(0)
  const deferredPiSearch = useDeferredValue(piSearch.trim())
  const piCluster = EVENT_CLUSTER_TO_PI_CLUSTER[event.cluster as Exclude<Cluster, 'All'>] as PiCluster | undefined
  const eventStudyQuery = trpc.piLearning.getEventStudyGuide.useQuery(
    { eventCode: event.code, search: deferredPiSearch, offset: piOffset, limit: 24 },
    { enabled: open },
  )
  const clusterModulesQuery = trpc.piLearning.getModulesByCluster.useQuery(
    { cluster: piCluster || 'Marketing', search: deferredPiSearch, offset: piOffset, limit: 24 },
    { enabled: open && !eventStudyQuery.isLoading && eventStudyQuery.data?.totalModules === 0 && Boolean(piCluster) },
  )

  const officialAreas = eventStudyQuery.data?.instructionalAreas ?? []
  const officialModules = officialAreas.flatMap((area) => area.modules)
  const usesClusterFallback = !eventStudyQuery.isLoading && officialModules.length === 0 && Boolean(piCluster)
  const displayedModules = usesClusterFallback ? (clusterModulesQuery.data?.modules ?? []) : officialModules
  const shownModules = displayedModules
  const totalModules = usesClusterFallback ? clusterModulesQuery.data?.totalModules ?? 0 : eventStudyQuery.data?.totalModules ?? 0
  const hasMoreModules = usesClusterFallback ? Boolean(clusterModulesQuery.data?.hasMore) : Boolean(eventStudyQuery.data?.hasMore)
  const showingFrom = totalModules ? piOffset + 1 : 0
  const showingTo = Math.min(piOffset + shownModules.length, totalModules)
  const normalizedPiSearch = deferredPiSearch.toLocaleLowerCase()
  const studyPathHref = '/pi-quizlet'
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPiSearch('')
      setPiOffset(0)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-4xl overflow-hidden border-blue-400/25 bg-[oklch(0.09_0.014_265)] p-0 text-white shadow-[0_24px_80px_oklch(0.02_0.04_265/0.75)]">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,oklch(0.35_0.13_255/0.28),transparent_45%)] px-6 py-6 pr-14">
          <DialogHeader className="gap-2 text-left">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-blue-300">
              <LibraryBig className="h-4 w-4" /> Event PI Study Path
            </div>
            <DialogTitle className="font-display text-3xl tracking-wide text-white">{event.code} — Required Performance Indicators</DialogTitle>
            <DialogDescription className="max-w-2xl text-sm leading-6 text-slate-300">
              Review the performance indicators aligned with {event.name}, then open a complete lesson, flashcard set, review, quiz, scenarios, and teach-back activity in the PI Study Library.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-2.5 py-1 ${clusterColors[event.cluster]}`}>{event.cluster}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-300">{event.type}</span>
            {!eventStudyQuery.isLoading && totalModules > 0 && <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-blue-200">{totalModules} study modules</span>}
          </div>
          <div className="relative mt-5">
            <label htmlFor={`event-pi-search-${event.code}`} className="sr-only">Search {event.code} performance indicators</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300/75" />
            <input
              id={`event-pi-search-${event.code}`}
              type="search"
              value={piSearch}
              onChange={(input) => {
                setPiSearch(input.target.value)
                setPiOffset(0)
              }}
              placeholder={`Search ${event.code} PIs by code, skill, or area`}
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/65 py-2 pl-10 pr-20 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
            />
            {piSearch && <button type="button" onClick={() => { setPiSearch(''); setPiOffset(0); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-blue-200 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60">Clear</button>}
          </div>
        </div>

        <div className="max-h-[calc(86vh-275px)] overflow-y-auto px-6 py-5">
          {eventStudyQuery.isLoading || clusterModulesQuery.isLoading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin text-blue-300" /> Loading the PI study path…
            </div>
          ) : totalModules === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-blue-300" />
              <p className="mt-3 font-medium text-white">This event’s PI study path is being prepared.</p>
              <p className="mt-1 text-sm text-slate-400">You can still browse the full PI Study Library for related competitive-event preparation.</p>
            </div>
          ) : (
            <>
              {usesClusterFallback && (
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-100">
                  <LibraryBig className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <p>This event uses the complete <strong>{event.cluster}</strong> PI pathway while its event-specific list is finalized.</p>
                </div>
              )}
              {normalizedPiSearch && <p className="mb-4 text-xs text-slate-400">{totalModules} applicable performance indicators match <span className="font-medium text-blue-200">“{piSearch.trim()}”</span>.</p>}
              {shownModules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] px-5 py-10 text-center">
                  <Search className="mx-auto h-6 w-6 text-blue-300" />
                  <p className="mt-3 font-medium text-white">No event PIs match that search.</p>
                  <p className="mt-1 text-sm text-slate-400">Try a PI code, a skill keyword, instructional area, or the event’s cluster.</p>
                  <button type="button" onClick={() => { setPiSearch(''); setPiOffset(0); }} className="mt-4 text-sm font-semibold text-blue-300 transition hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60">Clear search</button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {shownModules.map((module: any) => (
                    <a
                      key={module.id}
                      href={`${studyPathHref}?module=${module.id}`}
                      className="group rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-blue-400/40 hover:bg-blue-500/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-blue-300">{module.piId}</p>
                          <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white group-hover:text-blue-100">{module.performanceIndicator}</h3>
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-300" />
                      </div>
                      <p className="mt-3 truncate text-xs text-slate-400">{module.instructionalArea}</p>
                      {module.progress && <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> {module.progress.masteryScore}% mastery</div>}
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">Showing {showingFrom}–{showingTo} of {totalModules} applicable performance indicators for this event.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPiOffset((current) => Math.max(0, current - 24))} disabled={piOffset === 0} className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                  <button type="button" onClick={() => setPiOffset((current) => current + 24)} disabled={!hasMoreModules} className="rounded-md border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40">Next PIs</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-black/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">Every PI opens as a complete learning module.</p>
          <a href={studyPathHref} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">
            Open PI Study Library <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EventCard({ event, isFocusedEvent, canSelectEvent, isSelecting, onSelectEvent }: { event: DECAEvent; isFocusedEvent: boolean; canSelectEvent: boolean; isSelecting: boolean; onSelectEvent: (eventCode: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const clusterColor = clusterColors[event.cluster]

  return (
    <motion.div
      layout
      className="glass-card overflow-hidden"
    >
      <button
        className="w-full text-left p-5 flex items-start justify-between gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="shrink-0 w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <span className="font-mono-data text-xs text-blue-400 font-bold text-center leading-tight">{event.code}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${clusterColor}`}>{event.cluster}</span>
              <span className="text-xs text-white/30 font-mono-data">{event.type}</span>
              <span className="text-xs text-white/30">· {event.participants} participant{event.participants !== '1' ? 's' : ''}</span>
            </div>
            <h3 className="text-white font-semibold text-sm sm:text-base leading-tight">{event.name}</h3>
            {!expanded && <p className="text-white/40 text-xs mt-1 line-clamp-1">{event.description}</p>}
          </div>
        </div>
        <div className="shrink-0 text-white/30 mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatedExpand expanded={expanded}>
        <div className="px-5 pb-5 border-t border-white/5">
          <p className="text-white/60 text-sm mt-4 mb-4">{event.description}</p>
          <div className="mb-4 rounded-xl border border-blue-400/20 bg-blue-500/[0.06] p-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-100">Event focus</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-400">Make {event.code} your focused event, then use the PI Library to browse complete learning modules.</p>
            </div>
            <div className="mt-3 flex w-full flex-col gap-2 sm:mt-0 sm:w-auto sm:flex-row">
              <button type="button" onClick={() => onSelectEvent(event.code)} disabled={!canSelectEvent || isSelecting || isFocusedEvent} title={!canSelectEvent ? 'Sign in to select an event' : undefined} className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3.5 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-200/70 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto">
                {isFocusedEvent ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />} {isFocusedEvent ? 'Focused Event' : isSelecting ? 'Selecting…' : 'Select This Event'}
              </button>
              <a href="/pi-quizlet" className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-100 transition hover:border-blue-300/60 hover:bg-blue-500/20 sm:w-auto"><LibraryBig className="h-4 w-4" /> Open PI Library</a>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {event.resources.map((res, idx) => {
              const Icon = resourceIcons[res.type]
              const color = resourceColors[res.type]
              return (
                <a
                  key={`${event.code}-${idx}`}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/3 hover:bg-white/6 border border-white/5 hover:border-white/10 transition-all duration-200 group"
                >
                  <Icon size={14} className={`${color} shrink-0`} />
                  <span className="text-white/70 group-hover:text-white text-xs flex-1 min-w-0 truncate">{res.label}</span>
                  <ExternalLink size={11} className="text-white/20 group-hover:text-white/50 shrink-0" />
                </a>
              )
            })}
          </div>
        </div>
      </AnimatedExpand>
    </motion.div>
  )
}

function SelectedEventPiPanel({ event }: { event: DECAEvent }) {
  const studyInput = useMemo(() => ({ eventCode: event.code, search: '', offset: 0, limit: 24 }), [event.code])
  const eventStudyQuery = trpc.piLearning.getEventStudyGuide.useQuery(studyInput, { staleTime: 5 * 60 * 1000 })
  const modules = eventStudyQuery.data?.instructionalAreas.flatMap((area) => area.modules) ?? []

  return (
    <section aria-label="Selected event performance indicators" className="mb-7 overflow-hidden rounded-2xl border border-blue-400/25 bg-[linear-gradient(135deg,oklch(0.14_0.07_255/0.58),oklch(0.06_0.014_265/0.82))] shadow-[0_20px_48px_oklch(0.04_0.08_255/0.18)]">
      <div className="flex flex-col gap-3 border-b border-blue-300/15 px-5 py-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-mono-data uppercase tracking-[0.16em] text-blue-200/70">Focused event PI path</p><h2 className="mt-1 text-xl font-semibold text-white">{event.code} — {event.name}</h2><p className="mt-1 text-sm text-blue-100/65">Required performance indicators for your selected event are displayed here by default.</p></div>{eventStudyQuery.data && <span className="text-xs font-mono-data text-blue-100/70">{eventStudyQuery.data.totalModules} indicators</span>}</div>
      <div className="p-5">{eventStudyQuery.isLoading ? <div className="flex min-h-32 items-center justify-center gap-3 text-sm text-blue-100/70"><Loader2 className="h-5 w-5 animate-spin text-blue-300" /> Loading selected-event PIs…</div> : modules.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{modules.map((module: any) => <a key={module.id} href={`/pi-quizlet?module=${module.id}`} className="group rounded-xl border border-white/10 bg-black/10 p-4 transition hover:border-blue-300/45 hover:bg-blue-400/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-300"><p className="text-[11px] font-mono-data uppercase tracking-[0.12em] text-blue-300">{module.piId}</p><h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white group-hover:text-blue-100">{module.performanceIndicator}</h3><p className="mt-3 truncate text-xs text-white/45">{module.instructionalArea}</p></a>)}</div> : <div className="rounded-xl border border-dashed border-white/15 bg-black/10 px-5 py-8 text-center text-sm text-blue-100/70">No performance indicators are available for this event yet.</div>}</div>
    </section>
  )
}

function AnimatedExpand({ expanded, children }: { expanded: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
      transition={{ duration: 0.25 }}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  )
}

export default function Events() {
  const [activeCluster, setActiveCluster] = useState<Cluster>('All')
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const utils = trpc.useUtils()
  const primaryEventQuery = trpc.preferences.getPrimaryEvent.useQuery(undefined, { enabled: Boolean(user?.id) })
  const setPrimaryEvent = trpc.preferences.setPrimaryEvent.useMutation({
    onSuccess: async () => { await utils.preferences.getPrimaryEvent.invalidate() },
  })

  const filtered = allEvents.filter((e) => {
    const matchCluster = activeCluster === 'All' || e.cluster === activeCluster
    const matchSearch = search === '' ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.type.toLowerCase().includes(search.toLowerCase())
    return matchCluster && matchSearch
  })

  return (
    <div className="page-shell events-atmosphere">
      {/* Header */}
      <div
        className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(112deg, oklch(0.055 0.014 265 / 0.94) 4%, oklch(0.09 0.035 255 / 0.78) 48%, oklch(0.04 0.012 265 / 0.9) 100%), url(${EVENTS_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay removed for transparency */}
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono-data tracking-widest uppercase mb-4">
            60+ Competitive Events
          </div>
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-4">EVENT RESOURCES</h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Every DECA competitive event — with official DECA links, exam blueprints, practice materials, and study guides. Click any event to expand resources.
          </p>
          <div className="mt-8 grid max-w-5xl gap-4 lg:grid-cols-2">
            <a
              href="/pi-quizlet"
              className="group flex w-full items-center gap-4 rounded-2xl border border-blue-300/45 bg-[linear-gradient(115deg,oklch(0.22_0.1_255/0.82),oklch(0.08_0.025_265/0.9))] p-4 text-left shadow-[0_18px_42px_oklch(0.05_0.08_255/0.32)] transition-all duration-200 hover:-translate-y-1 hover:border-blue-200/80 hover:bg-[linear-gradient(115deg,oklch(0.27_0.12_255/0.88),oklch(0.1_0.035_265/0.94))] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200/30 bg-blue-200/10 text-blue-100 shadow-[0_0_24px_oklch(0.7_0.16_250/0.2)]"><LibraryBig className="h-6 w-6" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[10px] font-mono-data uppercase tracking-[0.16em] text-blue-100/65">Performance indicators</span><span className="mt-1 block text-lg font-semibold text-white">Open PI Library</span><span className="mt-1 block text-sm leading-5 text-blue-100/70">Browse every complete PI learning module in the dedicated PI Library.</span></span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-blue-100 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="/event-match?retake=1"
              className="group flex w-full items-center gap-4 rounded-2xl border border-blue-300/45 bg-[linear-gradient(115deg,oklch(0.22_0.1_255/0.82),oklch(0.08_0.025_265/0.9))] p-4 text-left shadow-[0_18px_42px_oklch(0.05_0.08_255/0.32)] transition-all duration-200 hover:-translate-y-1 hover:border-blue-200/80 hover:bg-[linear-gradient(115deg,oklch(0.27_0.12_255/0.88),oklch(0.1_0.035_265/0.94))] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200/30 bg-blue-200/10 text-blue-100 shadow-[0_0_24px_oklch(0.7_0.16_250/0.2)]"><Target className="h-6 w-6" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[10px] font-mono-data uppercase tracking-[0.16em] text-blue-100/65">Competition planning</span><span className="mt-1 block text-lg font-semibold text-white">Start Event Finder</span><span className="mt-1 block text-sm leading-5 text-blue-100/70">Start the short survey to explore events that fit your interests and strengths.</span></span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-blue-100 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-30 border-b border-white/10 bg-[oklch(0.055_0.012_265/0.76)] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
              />
            </div>
            {/* Cluster filters */}
            <div className="flex flex-wrap gap-2">
              {clusters.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCluster(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    activeCluster === c
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 text-white/30 text-xs font-mono-data">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((event) => (
            <EventCard key={event.code} event={event} isFocusedEvent={primaryEventQuery.data?.primaryEventCode === event.code} canSelectEvent={Boolean(user?.id)} isSelecting={setPrimaryEvent.isPending && setPrimaryEvent.variables?.eventCode === event.code} onSelectEvent={(eventCode) => setPrimaryEvent.mutate({ eventCode })} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg">No events found for "{search}"</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/manus-storage/Untitleddesign_c1fb0d88.png" alt="Blue Blazer logo" className="h-8 w-8 rounded-lg bg-white p-0.5 object-contain" />
            <span className="text-white/60 text-sm">Blue Blazer © 2025–2026</span>
          </div>
          <div className="flex items-center gap-6 text-white/30 text-sm">
            <a href="https://www.deca.org" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">DECA.org</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
