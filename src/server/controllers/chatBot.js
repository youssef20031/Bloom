import axios from 'axios';
import ChatSession from '../models/chatSession.js';
import Customer from '../models/customer.js'; 

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// --- Helper Functions ---

const formatHistoryForAI = (messages) => {
    return messages.map((m) => [m.sender, m.content]);
};

// --- MODIFIED: This entire function is updated to handle dynamic filenames ---
const getHistoryAndRespond = async (req, res, endpoint) => {
    try {
        const { sessionId } = req.body;
        console.log(`[Report Gen] Received request for session ID: ${sessionId}`); // <-- DEBUG LOG 1

        if (!sessionId) {
            return res.status(400).send('sessionId is required.');
        }

        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return res.status(404).send('Session not found.');
        }
        
        // <-- DEBUG LOG 2: Check the session object itself
        console.log('[Report Gen] Found session object:', JSON.stringify(session, null, 2)); 

        let customerName = 'General';
        if (session.customerId) {
            console.log(`[Report Gen] Session has customerId: ${session.customerId}. Looking up customer...`); // <-- DEBUG LOG 3
            const customer = await Customer.findById(session.customerId);
            if (customer) {
                console.log(`[Report Gen] Found customer: ${customer.companyName}`); // <-- DEBUG LOG 4
                customerName = customer.companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            } else {
                console.log(`[Report Gen] Customer with ID ${session.customerId} NOT FOUND in database.`); // <-- DEBUG LOG 5
            }
        } else {
            console.log('[Report Gen] Session has no customerId. Using default name.'); // <-- DEBUG LOG 6
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const extension = endpoint.includes('docx') ? 'docx' : 'pdf';
        const filename = `presales_report_${customerName}_${dateStr}.${extension}`;

        console.log(`[Report Gen] Final filename will be: ${filename}`); // <-- DEBUG LOG 7

        const transformedHistory = formatHistoryForAI(session.messages);

        // --- EDITED SECTION START ---
        // This is the fix for the "Invalid URL" error.
        // We use the same robust URL construction as in your `chat` function.
        const aiResponse = await axios.post(
            `${process.env.AI_SERVICE_URL || 'http://localhost:5001'}/${endpoint}`,
            { chat_history: transformedHistory },
            { responseType: 'stream' }
        );

        // Set headers for the file download
        if (aiResponse.headers['content-type']) {
            res.setHeader('Content-Type', aiResponse.headers['content-type']);
        }
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        aiResponse.data.pipe(res);
        // --- EDITED SECTION END ---

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
        const session = await ChatSession.findById(req.params.id).populate('customerId', 'companyName');
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
export const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSession = await ChatSession.findByIdAndDelete(id);

        if (!deletedSession) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (e) {
        console.error('Failed to delete session:', e);
        res.status(500).json({ error: 'Failed to delete session' });
    }
};