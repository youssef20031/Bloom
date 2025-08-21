import axios from 'axios';
import ChatSession from '../models/chatSession.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// --- Helper Functions ---

const formatHistoryForAI = (messages) => {
    return messages.map((m) => [m.sender, m.content]);
};

const getHistoryAndRespond = async (req, res, endpoint) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).send('sessionId is required.');
        }

        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return res.status(404).send('Session not found.');
        }

        const transformedHistory = formatHistoryForAI(session.messages);
        const aiResponse = await axios.post(
            `${AI_SERVICE_URL}/${endpoint}`,
            { chat_history: transformedHistory },
            { responseType: 'stream' }
        );

        if (aiResponse.headers['content-type']) {
            res.setHeader('Content-Type', aiResponse.headers['content-type']);
        }
        if (aiResponse.headers['content-disposition']) {
            res.setHeader('Content-Disposition', aiResponse.headers['content-disposition']);
        }
        aiResponse.data.pipe(res);
    } catch (error) {
        console.error(`Error in ${endpoint}:`, error);
        res.status(500).send(`Error generating ${endpoint}.`);
    }
};


// --- Chat & Report Controllers ---

export const chat = async (req, res) => {
    console.log('--- CHAT REQUEST RECEIVED ---');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    try {
        const { input, sessionId, presalesUserId, customerId } = req.body;

        let session = null;
        if (sessionId) {
            session = await ChatSession.findById(sessionId);
            if (!session) return res.status(404).json({ error: 'Session not found' });
        } else {
            // --- THIS LOGIC IS NOW SIMPLIFIED ---
            // We no longer require presalesUserId to create a session.
            // It can be null or undefined.
            session = await ChatSession.create({
                presalesUserId: presalesUserId || undefined, // Will save if provided, otherwise won't
                customerId: customerId || undefined,
                messages: [],
                status: 'active'
            });
        }

        if (input) {
            session.messages.push({ sender: 'human', content: input });
            await session.save();
        }

        const chat_history_from_db = formatHistoryForAI(session.messages);
        const aiResponse = await axios.post(
            `${process.env.AI_SERVICE_URL || 'http://localhost:5001'}/chat`,
            { input, chat_history: chat_history_from_db },
            { responseType: 'stream' }
        );

        res.setHeader('X-Session-Id', session._id.toString());
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');

        let accumulatedAiResponse = '';
        aiResponse.data.on('data', (chunk) => {
            const text = chunk.toString();
            accumulatedAiResponse += text;
            res.write(text);
        });

        aiResponse.data.on('end', async () => {
            try {
                if (accumulatedAiResponse.trim().length > 0) {
                    session.messages.push({ sender: 'ai', content: accumulatedAiResponse });
                    await session.save();
                }
            } catch (persistErr) {
                console.error('Failed to save AI message to database:', persistErr);
            }
            res.end();
        });
        aiResponse.data.on('error', (err) => {
            console.error('AI service stream error:', err);
            res.end();
        });
    } catch (error) {
        console.error('Error in chat controller:', error);
        res.status(500).send('Error communicating with the AI service.');
    }
};

export const report = async (req, res) => {
    try {
        const { sessionId, complete } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

        const session = await ChatSession.findById(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const transformedHistory = formatHistoryForAI(session.messages);
        await axios.post(`${AI_SERVICE_URL}/json_report`, { chat_history: transformedHistory });

        if (complete === true) {
            await ChatSession.findByIdAndUpdate(sessionId, { status: 'completed' });
        }

        const humanReportResponse = await axios.post(
            `${AI_SERVICE_URL}/report`,
            { chat_history: transformedHistory },
            { responseType: 'stream' }
        );
        humanReportResponse.data.pipe(res);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).send('Error generating report.');
    }
};

export const reportDocx = (req, res) => getHistoryAndRespond(req, res, 'report_docx');
export const reportPdf = (req, res) => getHistoryAndRespond(req, res, 'report_pdf');


// --- Session CRUD Controllers ---

export const createSession = async (req, res) => {
    try {
        const { presalesUserId, customerId, sessionTitle } = req.body;
        if (!presalesUserId) return res.status(400).json({ error: 'presalesUserId is required' });
        const session = await ChatSession.create({ presalesUserId, customerId, sessionTitle });
        res.status(201).json(session);
    } catch (e) {
        console.error('Failed to create session:', e);
        res.status(500).json({ error: 'Failed to create session' });
    }
};

export const getSessions = async (req, res) => {
    try {
        const { presalesUserId, status } = req.query;
        const query = {};
        if (presalesUserId) query.presalesUserId = presalesUserId;
        if (status) query.status = status;
        const sessions = await ChatSession.find(query).sort({ updatedAt: -1 });
        res.json(sessions);
    } catch (e) {
        console.error('Failed to list sessions:', e);
        res.status(500).json({ error: 'Failed to list sessions' });
    }
};

export const getSessionById = async (req, res) => {
    try {
        const session = await ChatSession.findById(req.params.id);
        if (!session) return res.status(404).json({ error: 'Not found' });
        res.json(session);
    } catch (e) {
        console.error('Failed to get session:', e);
        res.status(500).json({ error: 'Failed to get session' });
    }
};

export const updateSessionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await ChatSession.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(updated);
    } catch (e) {
        console.error('Failed to update status:', e);
        res.status(500).json({ error: 'Failed to update status' });
    }
};