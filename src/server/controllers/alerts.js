import Alert from "../models/alerts.js"
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
        const alert = await Alert.findByIdAndUpdate(id, { read: true }, { new: true });
        if (!alert) {
            return res.status(404).send({ message: "Alert not found" });
        }
        res.send(alert);
    } catch (error) {
        res.status(500).send(error);
    }
};
