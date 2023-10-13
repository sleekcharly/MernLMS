// file for admin dashboard analytics generator

// import dependencies
import { Document, Model } from 'mongoose';

// setup interface
interface MonthData {
  month: string;
  count: number;
}

// this function generates last 12 months analytics
export async function generateLast12MonthsData<T extends Document>(
  model: Model<T>,
): Promise<{ last12Months: MonthData[] }> {
  // initialize variables
  const last12Months: MonthData[] = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);

  // generate last 12 months data
  for (let i = 11; i >= 0; i--) {
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - i * 28,
    );
    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - 28,
    );

    const monthYear = endDate.toLocaleDateString('default', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const count = await model.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
    });

    last12Months.push({ month: monthYear, count });
  }

  return { last12Months };
}
