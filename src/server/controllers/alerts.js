import Alert from "../models/alerts.js";
import AlertService from "../utils/alertService.js";
export const GetAllAlerts = async (req, res) => {
    try {
        const Alerts = await Alert.find({});
        res.send(Alerts);
    } catch (error) {
        res.status(500).send(error);
    }

};

export const MarkAlertAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await AlertService.updateAlert(id, { read: true });
        if (!alert) {
            return res.status(404).send({ message: "Alert not found" });
        }
        res.send(alert);
    } catch (error) {
        res.status(500).send(error);
    }
};

export const CreateTestAlert = async (req, res) => {
    try {
        console.log('🧪 CreateTestAlert endpoint called');
        const newAlert = await AlertService.createTestAlert();
        console.log('✅ Test alert created in controller:', newAlert._id);
        res.status(201).send(newAlert);
    } catch (error) {
        console.error('❌ Error creating test alert in controller:', error);
        res.status(500).send({ message: 'Failed to create test alert', error: error.message });
    }
};

export const CreateRandomTestAlert = async (req, res) => {
    try {
        console.log('🎲 CreateRandomTestAlert endpoint called');
        const newAlert = await AlertService.createRandomTestAlert();
        console.log('✅ Random test alert created in controller:', newAlert._id);
        res.status(201).send(newAlert);
    } catch (error) {
        console.error('❌ Error creating random test alert in controller:', error);
        res.status(500).send({ message: 'Failed to create random test alert', error: error.message });
    }
};

export const ResolveAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const resolvedAlert = await AlertService.resolveAlert(id);
        res.send(resolvedAlert);
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).send({ message: 'Failed to resolve alert', error: error.message });
    }
};
