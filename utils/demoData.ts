
import { v4 as uuidv4 } from 'uuid';
import { Snapshot, IncomeRecord, AssetItem } from '../types';

const CATEGORIES = ['Bank', 'Stock', 'Real Estate', 'Crypto', 'Bond', 'Loan', 'Vehicle', 'Cash', 'Other'];
const MEMBERS = ['Me', 'Dad', 'Mom'];

const INCOME_CATEGORIES = ['Dividend', 'Interest', 'Rent', 'Salary', 'Bonus'];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

export const generateDemoData = () => {
  const snapshots: Snapshot[] = [];
  const incomeRecords: IncomeRecord[] = [];
  
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago
  const endDate = new Date();

  // 1. Generate Asset Snapshots (grouped by month to mimic user behavior)
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    
    // Create a snapshot for "Me" every month
    const items: AssetItem[] = [];
    
    // Bank
    items.push({ id: uuidv4(), category: 'Bank', name: 'Chase Checking', value: getRandomInt(5000, 15000), currency: 'USD', tags: [] });
    items.push({ id: uuidv4(), category: 'Bank', name: 'BOA Savings', value: getRandomInt(20000, 25000) + (current.getMonth() * 1000), currency: 'USD', tags: [] });
    
    // Stock (growing)
    items.push({ id: uuidv4(), category: 'Stock', name: 'Tech Portfolio', value: getRandomInt(40000, 50000) * (1 + (current.getFullYear() - 2022) * 0.1), currency: 'USD', tags: [] });
    
    // Real Estate (Static)
    items.push({ id: uuidv4(), category: 'Real Estate', name: 'Main Home', value: 450000, currency: 'USD', tags: [] });

    // Loan (decreasing)
    items.push({ id: uuidv4(), category: 'Loan', name: 'Mortgage', value: -300000 + (current.getMonth() * 500), currency: 'USD', tags: [] });

    snapshots.push({
      id: uuidv4(),
      date: dateStr,
      familyMember: 'Me',
      items,
      totalValue: items.reduce((acc, i) => acc + i.value, 0),
      note: 'Monthly Auto-generated Snapshot'
    });

    // Occasional snapshot for "Dad"
    if (current.getMonth() % 3 === 0) {
        snapshots.push({
            id: uuidv4(),
            date: dateStr,
            familyMember: 'Dad',
            items: [{ id: uuidv4(), category: 'Bond', name: 'Gov Bonds', value: 50000, currency: 'USD', tags: [] }],
            totalValue: 50000,
            note: 'Dad Portfolio'
        });
    }

    current.setMonth(current.getMonth() + 1);
  }

  // 2. Generate Income Records (~100 records)
  for (let i = 0; i < 100; i++) {
    const d = generateDate(startDate, endDate);
    const cat = getRandomItem(INCOME_CATEGORIES);
    const member = getRandomItem(MEMBERS);
    let val = 0;
    let name = '';

    switch(cat) {
        case 'Dividend': 
            val = getRandomInt(50, 500); 
            name = getRandomItem(['Apple', 'Microsoft', 'CocaCola', 'Vanguard ETF']);
            break;
        case 'Interest': 
            val = getRandomInt(10, 100); 
            name = 'Bank Interest';
            break;
        case 'Rent': 
            val = getRandomInt(1500, 2000); 
            name = 'Rental Unit A';
            break;
        case 'Salary':
            val = getRandomInt(4000, 5000);
            name = 'Monthly Paycheck';
            break;
        case 'Bonus':
            val = getRandomInt(1000, 10000);
            name = 'Year End Bonus';
            break;
    }

    incomeRecords.push({
        id: uuidv4(),
        date: d,
        category: cat,
        name,
        value: val,
        currency: 'USD',
        familyMember: member
    });
  }

  return { snapshots, incomeRecords };
};
