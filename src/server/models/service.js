import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, index: true },
        description: { type: String },
        type: {
            type: String,
            enum: ['ai_only', 'ai_hosted', 'infrastructure'],
            required: true
        },
        associatedProducts: [
            { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
        ],
        hostingDetails: {
            datacenterLocation: { type: String },
            vmSpecs: { type: Object }
        }
    },
    { timestamps: true }
);

// Prevent model overwrite in development or hot-reloading environments
const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

export default Service;
