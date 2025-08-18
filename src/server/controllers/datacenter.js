import Datacenter from '../models/datacenter.js';
import Alert from '../models/alerts.js';
import { getIo } from '../socket.js';
// Create a new datacenter asset
export const createDatacenterAsset = async (req, res) => {
  try {
    const asset = new Datacenter(req.body);
    await asset.save();
    res.status(201).json(asset);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add IoT reading to an asset & check alerts
export const addIotReading = async (req, res) => {
  try {
    const { datacenterId } = req.params;
    const { temperature, humidity, powerDraw } = req.body;

    const datacenter = await Datacenter.findById(datacenterId);
    if (!datacenter) {
      return res.status(404).send({ error: 'Datacenter not found' });
    }

    // 1. Push new reading
    const newReading = { temperature, humidity, powerDraw, timestamp: new Date() };
    datacenter.iotReadings.push(newReading);
    await datacenter.save();

    // 2. Check thresholds
    if (temperature > 30) {
      const alert = await Alert.create({
        datacenterId: datacenter._id,
        type: 'temperature',
        severity: 'critical',
        message: `Temperature exceeded 30°C (current: ${temperature}°C)`,
        status: 'new'
      });
      getIo().emit('new-alert', alert);
    }

    if (humidity > 70) {
      const alert2 = await Alert.create({
        datacenterId: datacenter._id,
        type: 'humidity',
        severity: 'warning',
        message: `Humidity exceeded 70% (current: ${humidity}%)`,
        status: 'new'
      });
      getIo().emit('new-alert', alert2);
    }

    if (powerDraw > 1000) {
      const alert3=await Alert.create({
        datacenterId: datacenter._id,
        type: 'power',
        severity: 'warning',
        message: `Power draw exceeded 1000W (current: ${powerDraw}W)`,
        status: 'new'
      });
      getIo().emit('new-alert', alert3);
    }

    res.status(200).send({ message: 'Reading added and alerts checked', datacenter });

  } catch (error) {
    res.status(500).send(error);
  }
};
// Get all assets with latest reading (it still needs the customer to work for it to work) 
export const getAllAssetsWithLatestReading = async (req, res) => {
  try {
    const assets = await Datacenter.find({})
      .populate('assetId', 'name type')
      .populate('customerId', 'name email');

    const formatted = assets.map(asset => ({
      ...asset.toObject(),
      latestReading: asset.iotReadings[asset.iotReadings.length - 1] || null
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Get datacenter by id
export const getDataCenterById = async (req, res) => {
  try {
    const dataCenter = await Datacenter.findById(req.params.id);
    if (!dataCenter) {
      return res.status(404).json({ message: 'Data center not found' });
    }
    res.status(200).json(dataCenter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};