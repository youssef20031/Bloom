import RequestChange from '../models/requestChange.js';

// Create a new request change
export const createRequestChange = async (req, res) => {
    try {
        const { supportTicketId, tag, description } = req.body;
        if (!supportTicketId || !tag) {
            return res.status(400).json({ message: 'supportTicketId and tag are required' });
        }

        const requestChange = new RequestChange({ supportTicketId, tag, description });
        await requestChange.save();
        res.status(201).json({ message: 'Request change created successfully', requestChange });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all request changes
export const getAllRequestChanges = async (req, res) => {
    try {
        const changes = await RequestChange.find()
            .populate('supportTicketId');
        res.json(changes);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all approved request changes (optionally filtered by tag)
export const getApprovedRequestChanges = async (req, res) => {
    try {
        const { tag } = req.query;
        const filter = { status: 'approved' };
        if (tag) {
            const validTags = ['ai', 'dc'];
            if (!validTags.includes(tag)) {
                return res.status(400).json({ message: `Tag must be one of: ${validTags.join(', ')}` });
            }
            filter.tag = tag;
        }
        const changes = await RequestChange.find(filter)
            .populate('supportTicketId');
        res.json(changes);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update status of a request change
export const updateRequestChangeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const validStatuses = ['approved', 'not_approved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const change = await RequestChange.findByIdAndUpdate(id, { status }, { new: true });
        if (!change) {
            return res.status(404).json({ message: 'Request change not found' });
        }

        res.json({ message: 'Status updated', change });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
