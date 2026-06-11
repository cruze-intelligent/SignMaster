/**
 * BadgeUnlock Component
 * 
 * Animated modal for displaying newly unlocked badges
 */

import { gsap } from 'gsap';
import translationService from '../services/TranslationService.js';

export class BadgeUnlockModal {
  constructor() {
    this.element = null;
    this.queue = [];
    this.showing = false;
    this.autoHideTimeout = null;
  }

  /**
   * Show badge unlock animation
   */
  async show(badge) {
    // Queue if already showing
    if (this.showing) {
      this.queue.push(badge);
      return;
    }

    this.showing = true;

    // Create modal if doesn't exist
    if (!this.element) {
      this.createModal();
    }

    // Update content
    this.updateContent(badge);

    // Show with animation
    await this.animateIn();

    // Auto-hide after 3 seconds
    this.autoHideTimeout = setTimeout(() => {
      this.hide();
    }, 3000);
  }

  /**
   * Create modal element
   */
  createModal() {
    this.element = document.createElement('div');
    this.element.className = 'badge-unlock-modal';
    this.element.innerHTML = `
      <div class="badge-unlock-modal__overlay"></div>
      <div class="badge-unlock-modal__content">
        <div class="badge-unlock-modal__badge">
          <div class="badge-unlock-modal__icon"></div>
          <div class="badge-unlock-modal__shine"></div>
        </div>
        <h2 class="badge-unlock-modal__title"></h2>
        <h3 class="badge-unlock-modal__badge-name"></h3>
        <p class="badge-unlock-modal__description"></p>
        <div class="badge-unlock-modal__points"></div>
        <button class="badge-unlock-modal__close"></button>
      </div>
    `;

    document.body.appendChild(this.element);

    // Close button
    this.element.querySelector('.badge-unlock-modal__close').addEventListener('click', () => {
      clearTimeout(this.autoHideTimeout);
      this.hide();
    });

    // Click overlay to close
    this.element.querySelector('.badge-unlock-modal__overlay').addEventListener('click', () => {
      this.hide();
    });
  }

  /**
   * Update modal content with badge data
   */
  updateContent(badge) {
    const icon = this.element.querySelector('.badge-unlock-modal__icon');
    const name = this.element.querySelector('.badge-unlock-modal__badge-name');
    const description = this.element.querySelector('.badge-unlock-modal__description');
    const points = this.element.querySelector('.badge-unlock-modal__points');
    const title = this.element.querySelector('.badge-unlock-modal__title');
    const close = this.element.querySelector('.badge-unlock-modal__close');

    icon.textContent = badge.icon;
    title.textContent = translationService.t('badge_unlocked');
    const badgeNameKey = `badge_name_${badge.id}`;
    const badgeDescKey = `badge_desc_${badge.id}`;
    name.textContent = translationService.t(badgeNameKey) !== badgeNameKey ? translationService.t(badgeNameKey) : badge.name;
    description.textContent = translationService.t(badgeDescKey) !== badgeDescKey ? translationService.t(badgeDescKey) : badge.description;
    points.innerHTML = `<strong>+${badge.points}</strong> ${translationService.t('badge_points')}`;
    close.textContent = translationService.t('continue');

    // Tier color
    const tierColors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF'
    };

    const badgeElement = this.element.querySelector('.badge-unlock-modal__badge');
    badgeElement.style.borderColor = tierColors[badge.tier] || '#FFD700';
  }

  /**
   * Animate modal in
   */
  animateIn() {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });

      // Fade in overlay
      tl.fromTo(
        this.element.querySelector('.badge-unlock-modal__overlay'),
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );

      // Scale in badge with bounce
      tl.fromTo(
        this.element.querySelector('.badge-unlock-modal__badge'),
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)' },
        '-=0.1'
      );

      // Shine effect
      tl.fromTo(
        this.element.querySelector('.badge-unlock-modal__shine'),
        { opacity: 0, rotation: 0 },
        { opacity: 1, rotation: 360, duration: 0.8 },
        '-=0.4'
      );

      // Fade in text
      tl.fromTo(
        [
          this.element.querySelector('.badge-unlock-modal__title'),
          this.element.querySelector('.badge-unlock-modal__badge-name'),
          this.element.querySelector('.badge-unlock-modal__description'),
          this.element.querySelector('.badge-unlock-modal__points')
        ],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 },
        '-=0.5'
      );

      // Button
      tl.fromTo(
        this.element.querySelector('.badge-unlock-modal__close'),
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3 },
        '-=0.2'
      );

      this.element.style.display = 'flex';
    });
  }

  /**
   * Animate modal out
   */
  animateOut() {
    return new Promise((resolve) => {
      gsap.to(this.element.querySelector('.badge-unlock-modal__content'), {
        scale: 0,
        rotation: 180,
        opacity: 0,
        duration: 0.4,
        ease: 'back.in(2)'
      });

      gsap.to(this.element.querySelector('.badge-unlock-modal__overlay'), {
        opacity: 0,
        duration: 0.3,
        delay: 0.2,
        onComplete: () => {
          this.element.style.display = 'none';
          resolve();
        }
      });
    });
  }

  /**
   * Hide modal
   */
  async hide() {
    clearTimeout(this.autoHideTimeout);
    await this.animateOut();
    this.showing = false;

    // Show next in queue
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.show(next);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.queue = [];
    this.showing = false;
  }
}

// Export singleton
const badgeUnlockModal = new BadgeUnlockModal();
export default badgeUnlockModal;
