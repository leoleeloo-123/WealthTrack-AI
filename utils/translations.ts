
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
    masterDatabase: "Master Database",
    investmentIncome: "Investment Income",
    stockMarket: "Stock Market",
    bulkImport: "Bulk Import",
    dataManagement: "Data Management",
    settings: "Settings",
    overview: "Overview",
    assetHistory: "Asset History",
    bulkDataImport: "Bulk Data Import",
    appTitle: "WealthTrack",
    aiPowered: "AI POWERED",
    
    // Demo Mode
    demoMode: "DEMO MODE",
    demoModeDesc: "You are viewing sample data. Feel free to explore features.",
    clearDemo: "Clear Demo Data",

    // Dashboard
    familyMember: "Family Member",
    category: "Category",
    dateRange: "Period",
    from: "From",
    to: "To",
    analyze: "Analyze",
    aiInsights: "AI Financial Insights",
    totalNetWorth: "Total Net Worth",
    assetAllocation: "Asset Allocation",
    assetBreakdown: "Asset Breakdown (Latest)",
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

    // Master Database
    masterDbDesc: "A pivot-table view of your assets over time.",
    subTotal: "Sub Total",
    normalizedNote: "Values are normalized to approx. USD for aggregation.",
    viewAssets: "View Assets",
    viewIncome: "View Income",
    dataSource: "Data Source",

    // Investment Income
    incomeOverview: "Income Overview",
    incomeHistory: "Income History",
    incomeBreakdown: "Income Breakdown",
    totalIncome: "Total Income (All Time)",
    ytdIncome: "YTD Income",
    monthlyAvg: "Monthly Average",
    incomeDesc: "Track dividends, interest, and other investment earnings.",
    recentIncome: "Recent Income Records",
    source: "Source",

    // Form
    date: "Date",
    note: "Note (Optional)",
    notePlaceholder: "e.g. End of year review",
    assetItems: "Asset Items",
    rawTotal: "Raw Total",
    addAssetLine: "Add Asset Line",
    saveSnapshot: "Save Snapshot",
    cancel: "Cancel",
    newRecord: "New Record",
    newSnapshot: "New Snapshot",
    editSnapshot: "Edit Snapshot",
    formDesc: "Record your financial data.",
    namePlaceholder: "Name (e.g. Chase Checking)",
    
    // Income Form
    newIncomeRecord: "New Income Record",
    incomeDetails: "Income Details",
    total: "Total",
    sourcePlaceholder: "Source (e.g. Apple Stock)",
    addIncomeLine: "Add Income Line",
    saveIncome: "Save Income",

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
    importType: "Import Type",
    assetSnapshots: "Asset Snapshots",
    incomeRecords: "Investment Income",
    incomeFormat: "Expected format: Date | Category | Name | Value",
    
    // Data Management
    dataBackup: "Data Backup",
    backupDesc: "Export your data to safeguard against updates or to move to another device.",
    downloadCSV: "Download CSV (Assets & Income)",
    dangerZone: "Danger Zone",
    irriversible: "Irreversible actions regarding your data.",
    deleteAll: "Delete All Data",
    deleteWarning: "This will wipe all snapshots, reset categories to default, and remove all family members from this browser.",
    deleteConfirm: "⚠️ DANGER: Are you sure you want to delete ALL data?\n\nThis includes all snapshots, custom categories, and family members.",
    generateDemo: "Generate Demo Data",
    generateDemoDesc: "Populate the app with sample data to test features. (Will be added to existing data)",
    generate: "Generate",

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
    masterDatabase: "总数据库",
    investmentIncome: "投资收入",
    stockMarket: "股票市场",
    bulkImport: "批量导入",
    dataManagement: "数据管理",
    settings: "设置",
    overview: "概览",
    assetHistory: "资产历史",
    bulkDataImport: "批量数据导入",
    appTitle: "财富追踪",
    aiPowered: "AI 驱动",

    // Demo Mode
    demoMode: "演示模式",
    demoModeDesc: "您正在查看示例数据。请随意探索功能。",
    clearDemo: "清除演示数据",

    // Dashboard
    familyMember: "家庭成员",
    category: "类别",
    dateRange: "时间范围",
    from: "从",
    to: "至",
    analyze: "智能分析",
    aiInsights: "AI 财务洞察",
    totalNetWorth: "总资产净值",
    assetAllocation: "资产配置",
    assetBreakdown: "资产分布 (最新)",
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

    // Master Database
    masterDbDesc: "资产随时间变化的透视表视图。",
    subTotal: "小计",
    normalizedNote: "数值已折算为约合美元以便汇总。",
    viewAssets: "查看资产",
    viewIncome: "查看收入",
    dataSource: "数据来源",

    // Investment Income
    incomeOverview: "收入概览",
    incomeHistory: "收入历史",
    incomeBreakdown: "收入分布",
    totalIncome: "总收入 (累计)",
    ytdIncome: "今年收入 (YTD)",
    monthlyAvg: "月均收入",
    incomeDesc: "追踪股息、利息和其他投资收益。",
    recentIncome: "近期收入记录",
    source: "来源",

    // Form
    date: "日期",
    note: "备注 (可选)",
    notePlaceholder: "例如：年终盘点",
    assetItems: "资产明细",
    rawTotal: "原始总计",
    addAssetLine: "添加资产行",
    saveSnapshot: "保存记录",
    cancel: "取消",
    newRecord: "新建记录",
    newSnapshot: "新建记录",
    editSnapshot: "编辑记录",
    formDesc: "记录您的财务数据。",
    namePlaceholder: "名称 (例如：招商银行储蓄)",

    // Income Form
    newIncomeRecord: "新建收入记录",
    incomeDetails: "收入明细",
    total: "总计",
    sourcePlaceholder: "来源 (例如：苹果股票)",
    addIncomeLine: "添加收入行",
    saveIncome: "保存收入",

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
    importType: "导入类型",
    assetSnapshots: "资产快照 (Asset Snapshots)",
    incomeRecords: "投资收入 (Investment Income)",
    incomeFormat: "预期格式: 日期 | 类别 | 名称 | 金额",

    // Data Management
    dataBackup: "数据备份",
    backupDesc: "导出数据以防丢失，或迁移至其他设备。",
    downloadCSV: "下载 CSV (资产与收入)",
    dangerZone: "危险区域",
    irriversible: "此操作不可逆，请谨慎。",
    deleteAll: "删除所有数据",
    deleteWarning: "这将清除本浏览器中的所有记录、自定义类别和家庭成员。",
    deleteConfirm: "⚠️ 警告：确定要删除所有数据吗？\n\n这将包括所有快照、自定义类别和家庭成员。",
    generateDemo: "生成演示数据",
    generateDemoDesc: "使用样本数据填充应用程序以测试功能。（将添加到现有数据中）",
    generate: "生成",

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
