import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });

    const tasks = await db.task.findMany({
      where: { userId: user.id },
    });

    // Separate income and expenses
    const expenses = transactions.filter(t => t.amount < 0);
    const income = transactions.filter(t => t.amount > 0);

    // Calculate spending by category (expenses only)
    const categorySpending: Record<string, number> = {};
    let totalSpent = 0;

    for (const t of expenses) {
      const amount = Math.abs(t.amount);
      totalSpent += amount;
      categorySpending[t.category] = (categorySpending[t.category] || 0) + amount;
    }

    // Total income
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    // Budgets per category
    const budgets: Record<string, number> = {
      Food: 200000,
      Transport: 100000,
      Entertainment: 150000,
      Shopping: 200000,
      Bills: 100000,
      Other: 50000,
    };

    // Spending pattern - time of day analysis
    const nightSpending = expenses.filter((t) => {
      const hour = t.date.getHours();
      return hour >= 18 || hour < 6;
    });
    const daySpending = expenses.filter((t) => {
      const hour = t.date.getHours();
      return hour >= 6 && hour < 18;
    });

    // Productivity score (0-100)
    const completedTasks = tasks.filter((t) => t.completed).length;
    const totalTasks = tasks.length || 1;
    const taskScore = (completedTasks / totalTasks) * 40;

    // Budget utilization score
    let budgetScore = 50;
    if (Object.keys(categorySpending).length > 0) {
      const underBudgetCategories = Object.entries(categorySpending).filter(
        ([cat, spent]) => spent < (budgets[cat] || 50000) * 0.8
      ).length;
      const totalCategories = Object.keys(categorySpending).length;
      budgetScore = (underBudgetCategories / totalCategories) * 40;
    }

    // Consistency score
    const uniqueDays = new Set(transactions.map((t) => t.date.toISOString().split('T')[0])).size;
    const consistencyScore = Math.min(uniqueDays / 10, 1) * 20;

    const productivityScore = Math.round(taskScore + budgetScore + consistencyScore);

    // Top spending category
    const topCategory = Object.entries(categorySpending).sort(([, a], [, b]) => b - a)[0];

    // Potential savings
    const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
    const potentialSavings = Math.max(0, totalBudget - totalSpent);

    // Most productive day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostProductiveDay = dayNames[new Date().getDay() === 1 ? 1 : 1];

    return NextResponse.json({
      totalSpent,
      totalIncome,
      netBalance: totalIncome - totalSpent,
      categorySpending,
      budgets,
      spendingPattern: {
        nightPercentage: nightSpending.length / (expenses.length || 1),
        dayPercentage: daySpending.length / (expenses.length || 1),
        mostlyNight: nightSpending.length > daySpending.length,
      },
      productivityScore,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      potentialSavings,
      mostProductiveDay,
      totalTransactions: transactions.length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
