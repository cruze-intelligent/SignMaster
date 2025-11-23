/**
 * CertificateGenerator - Create downloadable PNG certificates
 * 
 * Generates professional certificates with:
 * - Player name and completion date
 * - Total XP and earned badges
 * - Badge points and leaderboard rank
 * - QR code linking to games.cruze-tech.com/signmaster
 * - Cruze Tech branding and tagline
 */

import QRCode from 'qrcode';
import cacheManager from './CacheManager.js';
import badgeManager from './BadgeManager.js';

class CertificateGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 1200;
    this.height = 850;
  }

  /**
   * Initialize canvas
   */
  initCanvas() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx = this.canvas.getContext('2d');
    }
    return this.ctx;
  }

  /**
   * Generate and download certificate
   */
  async generateCertificate(playerName, stats) {
    const ctx = this.initCanvas();
    
    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e8eef3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Border
    ctx.strokeStyle = '#D90000';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, this.width - 40, this.height - 40);

    // Inner border
    ctx.strokeStyle = '#FCDC04';
    ctx.lineWidth = 4;
    ctx.strokeRect(35, 35, this.width - 70, this.height - 70);

    // Header section
    await this.drawHeader(ctx);

    // Certificate content
    await this.drawContent(ctx, playerName, stats);

    // Badge showcase
    await this.drawBadges(ctx, stats.badges);

    // QR code
    await this.drawQRCode(ctx);

    // Footer
    this.drawFooter(ctx);

    // Generate unique certificate ID
    const certId = this.generateCertificateId(playerName, stats);

    // Save to cache
    const certificateData = {
      id: certId,
      playerName,
      stats,
      generatedAt: new Date().toISOString(),
      dataUrl: this.canvas.toDataURL('image/png')
    };
    
    await cacheManager.saveCertificate(certificateData);

    // Trigger download
    this.downloadCertificate(playerName);

    return certificateData;
  }

  /**
   * Draw header with Cruze Tech logo and title
   */
  async drawHeader(ctx) {
    // Cruze Tech Logo (simplified text-based)
    ctx.save();
    ctx.fillStyle = '#D90000';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRUZE TECH', this.width / 2, 80);

    // Tagline
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('Tech For You, Tech For Me', this.width / 2, 110);

    // Website
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#4A90E2';
    ctx.fillText('cruze-tech.com', this.width / 2, 135);

    // Certificate title
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText('Certificate of Achievement', this.width / 2, 200);

    // SignMaster subtitle
    ctx.font = '28px Arial, sans-serif';
    ctx.fillStyle = '#D90000';
    ctx.fillText('SignMaster: Uganda Sign Language', this.width / 2, 240);

    ctx.restore();
  }

  /**
   * Draw main certificate content
   */
  async drawContent(ctx, playerName, stats) {
    ctx.save();
    ctx.textAlign = 'center';

    // "This certifies that"
    ctx.font = '20px Georgia, serif';
    ctx.fillStyle = '#666';
    ctx.fillText('This certifies that', this.width / 2, 300);

    // Player name
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText(playerName, this.width / 2, 350);

    // Achievement text
    ctx.font = '18px Georgia, serif';
    ctx.fillStyle = '#666';
    ctx.fillText('has successfully completed the SignMaster program', this.width / 2, 390);
    ctx.fillText('and demonstrated proficiency in Uganda Sign Language', this.width / 2, 420);

    // Stats section
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#D90000';
    
    const statsY = 480;
    const spacing = 40;
    
    // XP
    ctx.fillText(`Total XP: ${stats.xp}`, this.width / 2 - 200, statsY);
    
    // Badges
    const badgeCount = stats.badges ? stats.badges.length : 0;
    ctx.fillText(`Badges Earned: ${badgeCount}`, this.width / 2 + 200, statsY);
    
    // Badge points
    const badgeStats = await badgeManager.getBadgeStats();
    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = '#4A90E2';
    ctx.fillText(`Badge Points: ${badgeStats.points}`, this.width / 2 - 200, statsY + spacing);
    
    // Rank
    ctx.fillText(`Rank: ${badgeStats.rank.rank}`, this.width / 2 + 200, statsY + spacing);

    // Date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(`Issued: ${date}`, this.width / 2, 590);

    ctx.restore();
  }

  /**
   * Draw badge showcase
   */
  async drawBadges(ctx, badges) {
    if (!badges || badges.length === 0) return;

    ctx.save();
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Top Achievements', this.width / 2, 640);

    // Show top 5 badges
    const topBadges = badges.slice(0, 5);
    const badgeSize = 50;
    const spacing = 80;
    const startX = this.width / 2 - (topBadges.length * spacing) / 2;

    topBadges.forEach((badge, i) => {
      const x = startX + i * spacing;
      const y = 680;

      // Badge circle background
      ctx.fillStyle = '#FCDC04';
      ctx.beginPath();
      ctx.arc(x, y, badgeSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Badge icon (emoji)
      ctx.font = '32px Arial, sans-serif';
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badge.icon, x, y);
    });

    ctx.restore();
  }

  /**
   * Draw QR code linking to game website
   */
  async drawQRCode(ctx) {
    try {
      const qrUrl = 'https://games.cruze-tech.com/signmaster';
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        }
      });

      const qrImage = new Image();
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
        qrImage.src = qrDataUrl;
      });

      const qrX = this.width - 180;
      const qrY = this.height - 180;

      // QR code background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - 10, qrY - 10, 140, 140);
      ctx.strokeStyle = '#D90000';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 10, qrY - 10, 140, 140);

      // Draw QR code
      ctx.drawImage(qrImage, qrX, qrY, 120, 120);

      // Label
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText('Scan to play', qrX + 60, qrY + 150);

    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  /**
   * Draw footer
   */
  drawFooter(ctx) {
    ctx.save();
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'left';
    
    const footerY = this.height - 50;
    
    // Left: Certificate ID
    const certId = `SM-${Date.now().toString(36).toUpperCase()}`;
    ctx.fillText(`Certificate ID: ${certId}`, 60, footerY);
    
    // Center: Verify link
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4A90E2';
    ctx.fillText('games.cruze-tech.com/signmaster', this.width / 2, footerY);
    
    // Right: Date
    ctx.textAlign = 'right';
    ctx.fillStyle = '#999';
    ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, this.width - 60, footerY);

    ctx.restore();
  }

  /**
   * Generate unique certificate ID
   */
  generateCertificateId(playerName, stats) {
    const timestamp = Date.now();
    const nameHash = playerName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `SM-${timestamp.toString(36)}-${Math.abs(nameHash).toString(36)}`.toUpperCase();
  }

  /**
   * Download certificate as PNG
   */
  downloadCertificate(playerName) {
    const filename = `SignMaster_Certificate_${playerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
    
    this.canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`📥 Certificate downloaded: ${filename}`);
    }, 'image/png');
  }

  /**
   * Preview certificate in modal
   */
  previewCertificate() {
    if (!this.canvas) return;

    const dataUrl = this.canvas.toDataURL('image/png');
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    const img = document.createElement('img');
    img.src = dataUrl;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.boxShadow = '0 0 50px rgba(0,0,0,0.5)';

    modal.appendChild(img);
    modal.onclick = () => modal.remove();

    document.body.appendChild(modal);
  }
}

// Export singleton
const certificateGenerator = new CertificateGenerator();
export default certificateGenerator;
