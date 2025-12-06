import { Language } from '../types';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

export const translations: Translations = {
  en: {
    // Navigation & Layout
    dashboard: "Dashboard",
    history: "History & Data",
    bulkImport: "Bulk Import",
    dataManagement: "Data Management",
    settings: "Settings",
    overview: "Overview",
    assetHistory: "Asset History",
    bulkDataImport: "Bulk Data Import",
    appTitle: "WealthTrack",
    aiPowered: "AI POWERED",
    
    // Dashboard
    familyMember: "Family Member",
    category: "Category",
    analyze: "Analyze",
    aiInsights: "AI Financial Insights",
    totalNetWorth: "Total Net Worth",
    assetAllocation: "Asset Allocation",
    recentComposition: "Recent Composition",
    noData: "No data yet.",
    startByAdding: "Start by adding a",
    orUse: "or use",
    allFamily: "All Family",
    allPortfolio: "Portfolio",

    // History & Card
    totalValue: "Total Value",
    edit: "Edit",
    delete: "Delete",
    noRecords: "No records found matching your filter.",
    filterPlaceholder: "Filter by name, category, member or date...",

    // Form
    date: "Date",
    note: "Note (Optional)",
    notePlaceholder: "e.g. End of year review",
    assetItems: "Asset Items",
    rawTotal: "Raw Total",
    addAssetLine: "Add Asset Line",
    saveSnapshot: "Save Snapshot",
    cancel: "Cancel",
    newSnapshot: "New Snapshot",
    editSnapshot: "Edit Snapshot",
    formDesc: "Log your assets for a specific date and family member.",
    namePlaceholder: "Name (e.g. Chase Checking)",
    
    // Bulk
    parseData: "Parse Data",
    importItems: "Import Items",
    back: "Back",
    reviewImport: "Review Import",
    bulkDesc: "Copy and paste data from Excel or Google Sheets.",
    expectedFormat: "Expected format",
    name: "Name",
    value: "Value",
    currency: "Currency",
    
    // Data Management
    dataBackup: "Data Backup",
    backupDesc: "Export your data to safeguard against updates or to move to another device.",
    downloadCSV: "Download CSV",
    dangerZone: "Danger Zone",
    irriversible: "Irreversible actions regarding your data.",
    deleteAll: "Delete All Data",
    deleteWarning: "This will wipe all snapshots, reset categories to default, and remove all family members from this browser.",
    deleteConfirm: "⚠️ DANGER: Are you sure you want to delete ALL data?\n\nThis includes all snapshots, custom categories, and family members.",

    // Settings
    tagControl: "Tag Control",
    generalSettings: "General Settings",
    appearance: "Appearance",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    language: "Language",
    assetCategories: "Asset Categories",
    familyMembers: "Family Members",
    newCategoryPlaceholder: "New Category (e.g. Art)",
    newMemberPlaceholder: "New Member (e.g. Dad)",
    renameWarning: "Renaming here will update all historical records.",
    add: "Add"
  },
  zh: {
    // Navigation & Layout
    dashboard: "仪表盘",
    history: "历史数据",
    bulkImport: "批量导入",
    dataManagement: "数据管理",
    settings: "设置",
    overview: "概览",
    assetHistory: "资产历史",
    bulkDataImport: "批量数据导入",
    appTitle: "财富追踪",
    aiPowered: "AI 驱动",

    // Dashboard
    familyMember: "家庭成员",
    category: "类别",
    analyze: "智能分析",
    aiInsights: "AI 财务洞察",
    totalNetWorth: "总资产净值",
    assetAllocation: "资产配置",
    recentComposition: "近期组合",
    noData: "暂无数据。",
    startByAdding: "请先点击",
    orUse: "或使用",
    allFamily: "全家",
    allPortfolio: "投资组合",

    // History & Card
    totalValue: "总价值",
    edit: "编辑",
    delete: "删除",
    noRecords: "未找到匹配记录。",
    filterPlaceholder: "搜索名称、类别、成员或日期...",

    // Form
    date: "日期",
    note: "备注 (可选)",
    notePlaceholder: "例如：年终盘点",
    assetItems: "资产明细",
    rawTotal: "原始总计",
    addAssetLine: "添加资产行",
    saveSnapshot: "保存记录",
    cancel: "取消",
    newSnapshot: "新建记录",
    editSnapshot: "编辑记录",
    formDesc: "记录特定日期和家庭成员的资产。",
    namePlaceholder: "名称 (例如：招商银行储蓄)",

    // Bulk
    parseData: "解析数据",
    importItems: "导入项目",
    back: "返回",
    reviewImport: "确认导入",
    bulkDesc: "从 Excel 或 Google Sheets 复制并粘贴数据。",
    expectedFormat: "预期格式",
    name: "名称",
    value: "金额",
    currency: "货币",

    // Data Management
    dataBackup: "数据备份",
    backupDesc: "导出数据以防丢失，或迁移至其他设备。",
    downloadCSV: "下载 CSV",
    dangerZone: "危险区域",
    irriversible: "此操作不可逆，请谨慎。",
    deleteAll: "删除所有数据",
    deleteWarning: "这将清除本浏览器中的所有记录、自定义类别和家庭成员。",
    deleteConfirm: "⚠️ 警告：确定要删除所有数据吗？\n\n这将包括所有快照、自定义类别和家庭成员。",

    // Settings
    tagControl: "标签管理",
    generalSettings: "通用设置",
    appearance: "外观",
    theme: "主题",
    light: "亮色",
    dark: "暗色",
    language: "语言",
    assetCategories: "资产类别",
    familyMembers: "家庭成员管理",
    newCategoryPlaceholder: "新类别 (例如：艺术品)",
    newMemberPlaceholder: "新成员 (例如：爸爸)",
    renameWarning: "此处重命名将更新所有历史记录。",
    add: "添加"
  }
};
