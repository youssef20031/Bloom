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
    const { temperature, humidity, powerDraw, smokelevel } = req.body;

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
    if (smokelevel === 1) {
      const alert4=await Alert.create({
        datacenterId: datacenter._id,
        type: 'smoke',
        severity: 'critical',
        message: `Smoke level is high`,
        status: 'new'
      });
      getIo().emit('new-alert', alert4);
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
      .populate('customerId', 'companyName');

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

// High-level health reports (backend-only, no new controllers)
export const getHealthOverview = async (req, res) => {
  try {
    const assets = await Datacenter.find({});

    const totalAssets = assets.length;
    const assetsByType = assets.reduce((acc, a) => {
      acc[a.assetType] = (acc[a.assetType] || 0) + 1;
      return acc;
    }, {});

    let tempSum = 0, tempCount = 0;
    let humiditySum = 0, humidityCount = 0;
    let powerSum = 0, powerCount = 0;

    assets.forEach(asset => {
      const latest = asset.iotReadings[asset.iotReadings.length - 1];
      if (!latest) return;
      if (typeof latest.temperature === 'number') { tempSum += latest.temperature; tempCount += 1; }
      if (typeof latest.humidity === 'number') { humiditySum += latest.humidity; humidityCount += 1; }
      if (typeof latest.powerDraw === 'number') { powerSum += latest.powerDraw; powerCount += 1; }
    });

    const activeAlerts = await Alert.find({ status: { $ne: 'resolved' } });
    const alertsBySeverity = activeAlerts.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {});
    const alertsByType = activeAlerts.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalAssets,
      assetsByType,
      averages: {
        temperature: tempCount ? +(tempSum / tempCount).toFixed(2) : null,
        humidity: humidityCount ? +(humiditySum / humidityCount).toFixed(2) : null,
        powerDraw: powerCount ? +(powerSum / powerCount).toFixed(2) : null
      },
      alerts: {
        totalActive: activeAlerts.length,
        bySeverity: alertsBySeverity,
        byType: alertsByType
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHealthByLocation = async (req, res) => {
  try {
    const assets = await Datacenter.find({});

    // Group assets by location
    const locationToAssets = assets.reduce((acc, a) => {
      acc[a.location] = acc[a.location] || [];
      acc[a.location].push(a);
      return acc;
    }, {});

    // Preload active alerts
    const activeAlerts = await Alert.find({ status: { $ne: 'resolved' } });
    const alertsByAssetId = activeAlerts.reduce((acc, a) => {
      const key = String(a.datacenterId);
      acc[key] = acc[key] || [];
      acc[key].push(a);
      return acc;
    }, {});

    const locations = Object.entries(locationToAssets).map(([location, locAssets]) => {
      const assetIds = locAssets.map(a => String(a._id));

      const assetsByType = locAssets.reduce((acc, a) => {
        acc[a.assetType] = (acc[a.assetType] || 0) + 1;
        return acc;
      }, {});

      let tempSum = 0, tempCount = 0;
      let humiditySum = 0, humidityCount = 0;
      let powerSum = 0, powerCount = 0;

      locAssets.forEach(asset => {
        const latest = asset.iotReadings[asset.iotReadings.length - 1];
        if (!latest) return;
        if (typeof latest.temperature === 'number') { tempSum += latest.temperature; tempCount += 1; }
        if (typeof latest.humidity === 'number') { humiditySum += latest.humidity; humidityCount += 1; }
        if (typeof latest.powerDraw === 'number') { powerSum += latest.powerDraw; powerCount += 1; }
      });

      // Alerts for this location
      let warning = 0, critical = 0;
      let byType = {};
      assetIds.forEach(id => {
        const list = alertsByAssetId[id] || [];
        list.forEach(a => {
          if (a.severity === 'warning') warning += 1;
          if (a.severity === 'critical') critical += 1;
          byType[a.type] = (byType[a.type] || 0) + 1;
        });
      });

      return {
        location,
        assetCount: locAssets.length,
        assetsByType,
        averages: {
          temperature: tempCount ? +(tempSum / tempCount).toFixed(2) : null,
          humidity: humidityCount ? +(humiditySum / humidityCount).toFixed(2) : null,
          powerDraw: powerCount ? +(powerSum / powerCount).toFixed(2) : null
        },
        alerts: {
          totalActive: warning + critical,
          bySeverity: { warning, critical },
          byType
        }
      };
    });

    res.json({ locations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssetsHealthList = async (req, res) => {
  try {
    const assets = await Datacenter.find({})
      .populate('assetId', 'name type')
      .populate('customerId', 'companyName contactPerson');

    const activeAlerts = await Alert.find({ status: { $ne: 'resolved' } });
    const alertsByAssetId = activeAlerts.reduce((acc, a) => {
      const key = String(a.datacenterId);
      acc[key] = acc[key] || [];
      acc[key].push(a);
      return acc;
    }, {});

    const data = assets.map(asset => {
      const latestReading = asset.iotReadings[asset.iotReadings.length - 1] || null;
      const alerts = alertsByAssetId[String(asset._id)] || [];
      const bySeverity = alerts.reduce((acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      }, {});

      return {
        id: asset._id,
        location: asset.location,
        assetType: asset.assetType,
        asset: asset.assetId || null,
        customer: asset.customerId || null,
        latestReading,
        alerts: {
          totalActive: alerts.length,
          bySeverity
        }
      };
    });

    res.json({ assets: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};