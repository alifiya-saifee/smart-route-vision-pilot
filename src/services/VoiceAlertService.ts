
/**
 * Service for handling voice alerts for detected objects and lane departures
 */
class VoiceAlertService {
  private speechSynthesis: SpeechSynthesis;
  private alertCooldowns: Map<string, number>;
  private lastAlertTime: Map<string, number>;
  private isSpeaking: boolean;
  private alertQueue: string[];
  private alertVolume: number;
  private emergencyMode: boolean;

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.alertCooldowns = new Map();
    this.lastAlertTime = new Map();
    this.isSpeaking = false;
    this.alertQueue = [];
    this.alertVolume = 1.0;
    this.emergencyMode = false;

    // Set default cooldown times (in ms) for different alert types
    this.alertCooldowns.set('pedestrian', 10000);
    this.alertCooldowns.set('vehicle', 8000);
    this.alertCooldowns.set('lane_departure', 5000);
    this.alertCooldowns.set('traffic_sign', 6000);
    this.alertCooldowns.set('general', 3000);
    this.alertCooldowns.set('poi', 12000);
    this.alertCooldowns.set('emergency', 5000);
  }

  /**
   * Set the volume level for voice alerts
   * @param volume Value between 0 and 1
   */
  setVolume(volume: number) {
    this.alertVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set emergency mode status
   * @param isEmergency Whether emergency mode is active
   */
  setEmergencyMode(isEmergency: boolean) {
    if (isEmergency && !this.emergencyMode) {
      // Entering emergency mode - announce it
      this.alertCritical("Emergency mode activated. Recording collision risk.");
      
      // Dispatch event for UI components to respond
      const emergencyEvent = new CustomEvent('emergency-detected', {
        detail: { time: new Date() }
      });
      window.dispatchEvent(emergencyEvent);
    }
    
    this.emergencyMode = isEmergency;
  }

  /**
   * Speaks an alert if it hasn't been spoken recently (based on cooldown)
   * @param message The message to speak
   * @param alertType The type of alert for cooldown purposes
   * @param priority Priority level (higher number = higher priority)
   */
  speak(message: string, alertType: string = 'general', priority: number = 1): void {
    const now = Date.now();
    const cooldown = this.alertCooldowns.get(alertType) || 3000;
    const lastTime = this.lastAlertTime.get(alertType) || 0;
    
    // Check if we're still in cooldown period
    if (now - lastTime < cooldown) {
      return;
    }
    
    // In emergency mode, increase priority of all alerts
    if (this.emergencyMode && priority < 3) {
      priority = 3;
    }
    
    // Add to queue with priority
    this.queueAlert(message, alertType, priority);
    
    // Process queue if not already speaking
    if (!this.isSpeaking) {
      this.processNextAlert();
    }
  }

  /**
   * Add an alert to the queue with priority
   */
  private queueAlert(message: string, alertType: string, priority: number): void {
    // Format with metadata for sorting later
    const alertItem = `${priority}|${alertType}|${message}`;
    
    this.alertQueue.push(alertItem);
    
    // Sort queue by priority (higher first)
    this.alertQueue.sort((a, b) => {
      const priorityA = parseInt(a.split('|')[0], 10);
      const priorityB = parseInt(b.split('|')[0], 10);
      return priorityB - priorityA;
    });
  }

  /**
   * Process the next alert in the queue
   */
  private processNextAlert(): void {
    if (this.alertQueue.length === 0) {
      this.isSpeaking = false;
      return;
    }
    
    this.isSpeaking = true;
    
    // Get next alert and parse its parts
    const alertItem = this.alertQueue.shift() as string;
    const parts = alertItem.split('|');
    const alertType = parts[1];
    const message = parts[2];
    
    // Update last alert time for this type
    this.lastAlertTime.set(alertType, Date.now());
    
    // Create and configure speech utterance
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.volume = this.alertVolume;
    
    // Adjust rate based on alert type and emergency mode
    if (this.emergencyMode || alertType === 'emergency') {
      utterance.rate = 1.2; // Faster for emergency
    } else {
      utterance.rate = 1.1; // Slightly faster than normal for urgency
    }
    
    // Set voice based on alert type
    const voices = this.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Try to find a clear, authoritative voice
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('English') || 
        voice.name.includes('US')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }
    
    // When done speaking, process the next alert
    utterance.onend = () => {
      this.processNextAlert();
    };
    
    // Speak the alert
    this.speechSynthesis.speak(utterance);
  }

  /**
   * Alert for pedestrian detection
   */
  alertPedestrian(count: number = 1): void {
    const message = count > 1 
      ? `Caution. ${count} pedestrians detected ahead` 
      : "Caution. Pedestrian detected ahead";
    this.speak(message, 'pedestrian', 3);
  }

  /**
   * Alert for lane departure
   */
  alertLaneDeparture(direction: string): void {
    const message = `Lane departure ${direction}`;
    this.speak(message, 'lane_departure', 2);
  }

  /**
   * Alert for traffic sign detection
   */
  alertTrafficSign(signType: string): void {
    this.speak(`${signType} ahead`, 'traffic_sign', 2);
  }

  /**
   * Alert for vehicle detection that might be a risk
   */
  alertVehicle(vehicleType: string, distance: number, count: number = 1): void {
    if (distance < 15) {
      // Vehicle very close - emergency!
      this.setEmergencyMode(true);
      this.speak(`Warning! ${vehicleType} too close!`, 'emergency', 5);
    } else if (distance < 30) {
      // Vehicle close - alert
      this.speak(`${vehicleType} close behind`, 'vehicle', 3);
    } else if (count > 2) {
      this.speak(`Multiple ${vehicleType}s ahead`, 'vehicle', 1);
    }
  }
  
  /**
   * Alert for point of interest detection
   */
  alertPOI(poiType: string, distance: number, direction: string): void {
    let messagePrefix = "";
    
    if (poiType.toLowerCase() === "hospital") {
      messagePrefix = "Hospital";
    } else if (poiType.toLowerCase() === "gas" || poiType.toLowerCase() === "gas station") {
      messagePrefix = "Gas station";
    } else {
      messagePrefix = poiType;
    }
    
    const distanceKm = (distance / 1000).toFixed(1);
    this.speak(`${messagePrefix} ${distanceKm} kilometers ${direction}`, 'poi', 1);
  }

  /**
   * General alert for any critical situation
   */
  alertCritical(message: string): void {
    this.speak(message, 'emergency', 4);
  }
}

export default new VoiceAlertService();
