import Invoice from '../models/invoice.js';

// Get monthly revenue report for a given year (defaults to current year)
export const getMonthlyRevenueReport = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const report = await Invoice.aggregate([
      { $match: { status: 'paid', issueDate: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
      {
        $group: {
          _id: { month: { $month: '$issueDate' } },
          revenue: { $sum: '$amount' }
        }
      },
      { $project: { _id: 0, month: '$_id.month', revenue: 1 } },
      { $sort: { month: 1 } }
    ]);

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
