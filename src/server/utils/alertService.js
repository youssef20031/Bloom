import { getIo } from '../socket.js';
import Alert from '../models/alerts.js';

// Minimal alertService stub
export async function sendAlertEmail({ email, ip, count }) {
  // In production, integrate with an email service
  console.log(`ALERT: ${count} failed login attempts for ${email} from IP ${ip}`);
}

class AlertService {
  // Emit a new alert to all connected clients
  static async emitNewAlert(alertData) {
    try {
      console.log('📡 AlertService.emitNewAlert called with data:', alertData);
      const io = getIo();
      console.log('🔌 Got io instance:', typeof io, 'emit function exists:', typeof io.emit);
      
      // Create the alert in database
      const newAlert = new Alert(alertData);
      await newAlert.save();
      console.log('💾 Alert saved to database:', newAlert._id);
      
      // Populate the datacenter information if datacenterId exists
      if (newAlert.datacenterId) {
        await newAlert.populate('datacenterId');
        console.log('🏢 Datacenter populated');
      }
      
      console.log('🚨 New alert created and emitted:', newAlert._id);
      
      // Emit to all clients
      console.log('📢 Emitting to all clients...');
      io.emit('new-alert', {
        alert: newAlert,
        timestamp: new Date().toISOString(),
        eventType: 'new-alert',
        type: newAlert.type
      });
      
      // Also emit to IT dashboard room specifically
      console.log('📢 Emitting to IT dashboard room...');
      io.to('it-dashboard').emit('it-alert', {
        alert: newAlert,
        timestamp: new Date().toISOString(),
        eventType: 'new-alert',
        type: newAlert.type
      });
      
      console.log('✅ Alert emission completed');
      return newAlert;
    } catch (error) {
      console.error('❌ Error creating and emitting alert:', error);
      throw error;
    }
  }

  // Update an existing alert and emit the update
  static async updateAlert(alertId, updateData) {
    try {
      const io = getIo();
      
      const updatedAlert = await Alert.findByIdAndUpdate(
        alertId, 
        updateData, 
        { new: true }
      );
      
      if (!updatedAlert) {
        throw new Error('Alert not found');
      }
      
      if (updatedAlert.datacenterId) {
        await updatedAlert.populate('datacenterId');
      }
      
      console.log('📝 Alert updated and emitted:', alertId);
      
      // Emit update to all clients
      io.emit('alert-update', {
        alert: updatedAlert,
        timestamp: new Date().toISOString(),
        eventType: 'alert-update',
        type: updatedAlert.type
      });
      
      return updatedAlert;
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  }

  // Resolve an alert
  static async resolveAlert(alertId) {
    try {
      const io = getIo();
      
      const resolvedAlert = await Alert.findByIdAndUpdate(
        alertId,
        { status: 'resolved' },
        { new: true }
      );
      
      if (!resolvedAlert) {
        throw new Error('Alert not found');
      }
      
      if (resolvedAlert.datacenterId) {
        await resolvedAlert.populate('datacenterId');
      }
      
      console.log('✅ Alert resolved and emitted:', alertId);
      
      // Emit resolution to all clients
      io.emit('alert-resolved', {
        alert: resolvedAlert,
        timestamp: new Date().toISOString(),
        eventType: 'alert-resolved',
        type: resolvedAlert.type
      });
      
      return resolvedAlert;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Create a test alert for demonstration
  static async createTestAlert() {
    const testAlertData = {
      datacenterId: null, // Will work without datacenter reference
      type: 'temperature',
      severity: 'warning',
      message: 'Server temperature exceeded normal operating range - Test Alert',
      status: 'new'
    };

    return await this.emitNewAlert(testAlertData);
  }

  // Simulate different types of alerts for testing
  static async createRandomTestAlert() {
    const alertTypes = ['temperature', 'humidity', 'power', 'security', 'smoke'];
    const severities = ['warning', 'critical'];
    const messages = {
      temperature: 'Temperature threshold exceeded',
      humidity: 'Humidity levels outside acceptable range',
      power: 'Power consumption anomaly detected',
      security: 'Unauthorized access attempt detected',
      smoke: 'Smoke detector activated'
    };

    const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

    const testAlertData = {
      datacenterId: null, // Will work without datacenter reference
      type: randomType,
      severity: randomSeverity,
      message: `${messages[randomType]} - Test Alert`,
      status: 'new'
    };

    return await this.emitNewAlert(testAlertData);
  }
}

export default AlertService;
