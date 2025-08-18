import Alert from "../models/alerts.js"
export const GetAllAlerts = async (req, res) => {
    try {
        const Alerts = await Alert.find({});
        res.send(Alerts);
    } catch (error) {
        res.status(500).send(error);
    }

};