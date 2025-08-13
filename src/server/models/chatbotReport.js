import mongoose from 'mongoose';

const chatbotReportSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  customerQuery: { type: String },
  identifiedNeeds: [{ type: String }],
  suggestedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
  timestamp: { type: Date, default: Date.now }
});

const ChatbotReport = mongoose.model('ChatbotReport', chatbotReportSchema);

export default ChatbotReport;

