const fs = require('fs').promises;

let financialData;
let keywords;
async function loadFinancialData() {
  try {
    const data = await fs.readFile('./financial_data.json', 'utf-8');
    financialData = JSON.parse(data);
  } catch (err) {
    console.error('Error reading financial data file:', err);
  }
}

async function loadKeywords() {
  try {
    const data = await fs.readFile('./Keywords.json', 'utf-8');
    keywords = JSON.parse(data);
  } catch (err) {
    console.error('Error reading keywords file:', err);
  }
}

function getFinancialData() {
  return financialData;
}

function calculateTotalSpending(userRecord, startMonth, endMonth) {
  const monthMap = keywords.monthMap;

  let totalSpending = 0;
  let addMonths = false;

  for (const month of Object.keys(monthMap)) {
    if (month === startMonth.toLowerCase()) {
      addMonths = true;
    }
    if (addMonths) {
      totalSpending += userRecord.spending[monthMap[month]] || 0;
    }
    if (month === endMonth.toLowerCase()) {
      break;
    }
  }

  return totalSpending;
}

function calculateMonthlySavings(userRecord, month) {
  const monthMap = keywords.monthMap;

  const spending = userRecord.spending[monthMap[month.toLowerCase()]] || 0;
  const income = userRecord.income;
  return income - spending;
}

function generateResponse(message, userInfo, userContext) {
  if (!financialData) {
    return 'Financial data not available.';
  }

  if (!keywords) {
    return 'Keywords not available.';
  }

  const user = userInfo.name;
  const userRecord = financialData.users.find(u => u.name.toLowerCase() === user.toLowerCase() && u.id === parseInt(userInfo.id));
  if (!userRecord) {
    return 'User not found.';
  }

  const lowerCaseMessage = message.toLowerCase();

  if (lowerCaseMessage.includes('exit')) {
    userContext.topic = null;
    return 'You have exited the current topic. You can now choose a new topic: spendings, savings, overview stocks, income, other';
  }

  if (!userContext.topic) {
    if (lowerCaseMessage.includes('spending')) {
      userContext.topic = 'spending';
      return 'What would you like to know about spendings? (e.g., total spendings, spendings for a specific month, spendings for a specific year)';
    } else if (lowerCaseMessage.includes('savings')) {
      userContext.topic = 'savings';
      return 'What would you like to know about savings? (e.g., total savings, savings for a specific month)';
    } else if (lowerCaseMessage.includes('overview')) {
      userContext.topic = 'overview';
      return 'What would you like to know? stocks, real estate, savings account, bonds, retirement funds. '
    } else if (lowerCaseMessage.includes('income')) {
      userContext.topic = 'income';
      return 'What would you like to know about your income sources? (e.g., job, investments, other)';
    } else if (lowerCaseMessage.includes('other')) {
      userContext.topic = 'other';
      return 'What would you like to know? (e.g., mortgage, debt, tax,...)';
    } else {
      return 'Please specify what you would like to know about (e.g., spendings, savings, overview stocks, income, other).';
    }
  } else if (userContext.topic === 'spending') {
    if (lowerCaseMessage.includes('total')) {
      const totalSpending = Object.values(userRecord.spending).reduce((acc, val) => acc + val, 0);
      return `Your total spendings are $${totalSpending}. Would you like to know for a particular month or year?`;
    } else if (lowerCaseMessage.includes('for')) {
      const query = lowerCaseMessage.split('for')[1].trim();
      const monthMap = keywords.monthMap;
      if (monthMap[query.toLowerCase()]) {
        const spending = userRecord.spending[monthMap[query.toLowerCase()]] || 0;
        return `Your spendings for ${query} are $${spending}.`;
      } else if (userRecord.spendingOverYears[query]) {
        const spending = userRecord.spendingOverYears[query];
        return `Your spendings for ${query} are $${spending}.`;
      } else {
        return `I didn't understand that. Please specify a valid month or year.`;
      }
    } else if (lowerCaseMessage.includes('from') && lowerCaseMessage.includes('to')) {
      const [startMonth, endMonth] = lowerCaseMessage.split('from')[1].split('to').map(m => m.trim());
      const totalSpending = calculateTotalSpending(userRecord, startMonth, endMonth);
      return `Your total spendings from ${startMonth} to ${endMonth} are $${totalSpending}.`;
    } else {
      return 'I didn\'t understand that. Please specify total spendings or spendings for a particular month, year, or range.';
    }
  } else if (userContext.topic === 'savings') {
    if (lowerCaseMessage.includes('total')) {
      const totalSavings = userRecord.savings;
      return `Your total savings are $${totalSavings}.`;
    } else if (lowerCaseMessage.includes('for')) {
      const query = lowerCaseMessage.split('for')[1].trim();
      const monthMap = keywords.monthMap;
      if (monthMap[query.toLowerCase()]) {
        const savings = calculateMonthlySavings(userRecord, query);
        return `Your savings for ${query} are $${savings}.`;
      } else {
        return `I didn't understand that. Please specify a valid month.`;
      }
    } else {
      return 'I didn\'t understand that. Please specify total savings or savings for a particular month.';
    }
  } else if (userContext.topic === 'income') {
    const incomeSources = userRecord.incomeSources;
    if (lowerCaseMessage.includes('job')) {
      return `Your income from job is $${incomeSources.job}.`;
    } else if (lowerCaseMessage.includes('investments')) {
      return `Your income from investments is $${incomeSources.investments}.`;
    } else if (lowerCaseMessage.includes('other')) {
      return `Your other income is $${incomeSources.other}.`;
    } else {
      return `Your income sources are: Job - $${incomeSources.job}, Investments - $${incomeSources.investments}, Other - $${incomeSources.other}.`;
    }
  } 
  else if (userContext.topic === 'overview') {
    const userOverview = userRecord.assetOverview;
    if (lowerCaseMessage.includes('stocks')) {
      return `Your stocks are worth $${userOverview.stocks}`;
    } else if (lowerCaseMessage.includes('real estate')) {
      return `Your real estate is worth $${userOverview.realEstate}`;
    } else if (lowerCaseMessage.includes('savings account')) {
      return `Your savings account is worth $${userOverview.savingsAccount}`;
    } else if (lowerCaseMessage.includes('bonds')) {
      return `Your bonds are worth $${userOverview.bonds}`;
    } else if (lowerCaseMessage.includes('retirement fund')) {
      return `Your retirement fund is worth $${userOverview.retirementFund}`;
    } else {
      return `I did not understand! Please specify what do you want to know.`;
    }
    }else if (userContext.topic === 'other') {
    for (const [category, categoryKeywords] of Object.entries(keywords)) {
      if (categoryKeywords.some(keyword => lowerCaseMessage.includes(keyword))) {
        switch (category) {
          case 'debt':
            return `${userRecord.name}'s debt: $${JSON.stringify(userRecord.debt)}`;
          case 'investment':
            return `${userRecord.name}'s investments: ${JSON.stringify(userRecord.investments)}`;
          case 'creditScore':
            return `${userRecord.name}'s credit score: ${userRecord.creditScore}`;
          case 'tax':
            return `${userRecord.name}'s tax details: ${JSON.stringify(userRecord.taxes)}`;
          case 'retirementFund':
            return `${userRecord.name}'s retirement fund: $${userRecord.retirementFund}`;
          case 'mortgage':
            return `${userRecord.name}'s mortgage details: ${JSON.stringify(userRecord.mortgage)}`;
          case 'rent':
            return `${userRecord.name}'s rent details: ${JSON.stringify(userRecord.rent)}`;
          case 'utilityBills':
            return `${userRecord.name}'s utility bills: ${JSON.stringify(userRecord.utilityBills)}`;
          case 'carLoan':
            return `${userRecord.name}'s car loan details: ${JSON.stringify(userRecord.carLoan)}`;
          case 'studentLoan':
            return `${userRecord.name}'s student loan details: ${JSON.stringify(userRecord.studentLoan)}`;
          case 'howFucked':
            return `${userRecord.name}'s status: ${JSON.stringify(userRecord.HowFuckedAmI)}`;
          case 'canIAffordRent':
            return `${userRecord.name}'s rent status: ${JSON.stringify(userRecord.CanIAffordRent)}`;
          case 'canIAffordToLive':
            return `${userRecord.name}'s living status: ${JSON.stringify(userRecord.CanIAffordToLive)}`;
          case 'canIAffordFood':
            return `${userRecord.name}'s food status: ${JSON.stringify(userRecord.CanIAffordFood)}`;
          default:
            return 'I\'m sorry, I\'m not sure how to answer that. Ask me again!';
        }
      }
    }

    return 'I didn\'t understand that. Please specify what you would like to know about (e.g., spendings, savings, overview stocks, income, other).';
  }
}

module.exports = {
  loadFinancialData,
  loadKeywords,
  getFinancialData,
  generateResponse
};
