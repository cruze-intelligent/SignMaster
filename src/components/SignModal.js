/**
 * SignModal Component
 * 
 * Displays an enlarged view of a sign when clicked
 */

import { gsap } from 'gsap';
import assetLoader from '../services/AssetLoader.js';

class SignModal {
  constructor() {
    this.element = null;
    this.isOpen = false;
    this.currentSign = null;
    this.init();
  }

  /**
   * Initialize the modal element
   */
  init() {
    // Create modal element
    this.element = document.createElement('div');
    this.element.className = 'sign-modal';
    this.element.innerHTML = `
      <div class="sign-modal__overlay"></div>
      <div class="sign-modal__content">
        <button class="sign-modal__close" aria-label="Close">&times;</button>
        <div class="sign-modal__image-container">
          <img class="sign-modal__image" alt="" />
          <div class="sign-modal__loader">
            <div class="spinner"></div>
          </div>
        </div>
        <div class="sign-modal__info">
          <h2 class="sign-modal__title"></h2>
          <p class="sign-modal__description"></p>
          <div class="sign-modal__meta">
            <span class="sign-modal__category"></span>
            <span class="sign-modal__difficulty"></span>
          </div>
        </div>
        <div class="sign-modal__actions">
          <button class="btn-primary sign-modal__learn">✓ I've Learned This</button>
          <button class="btn-secondary sign-modal__practice">🎯 Practice</button>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(this.element);

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    const closeBtn = this.element.querySelector('.sign-modal__close');
    closeBtn.addEventListener('click', () => this.close());

    // Overlay click
    const overlay = this.element.querySelector('.sign-modal__overlay');
    overlay.addEventListener('click', () => this.close());

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Learn button
    const learnBtn = this.element.querySelector('.sign-modal__learn');
    learnBtn.addEventListener('click', () => {
      this.markAsLearned();
    });

    // Practice button
    const practiceBtn = this.element.querySelector('.sign-modal__practice');
    practiceBtn.addEventListener('click', () => {
      this.startPractice();
    });
  }

  /**
   * Open modal with sign data
   */
  async open(sign, category) {
    this.currentSign = sign;
    this.isOpen = true;

    // Update content
    const title = this.element.querySelector('.sign-modal__title');
    const description = this.element.querySelector('.sign-modal__description');
    const categoryEl = this.element.querySelector('.sign-modal__category');
    const difficultyEl = this.element.querySelector('.sign-modal__difficulty');
    const img = this.element.querySelector('.sign-modal__image');
    const loader = this.element.querySelector('.sign-modal__loader');

    title.textContent = sign.label;
    description.textContent = sign.description || `Learn how to sign "${sign.label}" in Uganda Sign Language`;
    categoryEl.textContent = `📁 ${category}`;
    difficultyEl.textContent = `📊 ${sign.difficulty || 'beginner'}`;

    // Show loader, hide image initially
    loader.style.display = 'flex';
    img.style.opacity = '0';

    // Show modal
    this.element.style.display = 'flex';
    
    // Animate in
    gsap.fromTo(this.element.querySelector('.sign-modal__overlay'),
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );
    
    gsap.fromTo(this.element.querySelector('.sign-modal__content'),
      { opacity: 0, scale: 0.8, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
    );

    // Load image
    try {
      const url = await assetLoader.loadSignImage(sign.filename, category);
      img.src = url;
      img.onload = () => {
        loader.style.display = 'none';
        gsap.to(img, { opacity: 1, duration: 0.3 });
      };
    } catch (error) {
      console.error('Failed to load sign image:', error);
      loader.innerHTML = '<p>Failed to load image</p>';
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close modal
   */
  close() {
    if (!this.isOpen) return;

    // Animate out
    gsap.to(this.element.querySelector('.sign-modal__overlay'), {
      opacity: 0,
      duration: 0.2
    });
    
    gsap.to(this.element.querySelector('.sign-modal__content'), {
      opacity: 0,
      scale: 0.8,
      y: 30,
      duration: 0.2,
      onComplete: () => {
        this.element.style.display = 'none';
        this.isOpen = false;
        this.currentSign = null;
      }
    });

    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Mark current sign as learned
   */
  markAsLearned() {
    if (!this.currentSign) return;
    
    // Dispatch event for state manager to handle
    const event = new CustomEvent('signLearned', {
      detail: { sign: this.currentSign }
    });
    document.dispatchEvent(event);
    
    // Visual feedback
    const btn = this.element.querySelector('.sign-modal__learn');
    btn.textContent = '✓ Marked as Learned!';
    btn.style.background = 'var(--color-success)';
    
    setTimeout(() => {
      this.close();
    }, 800);
  }

  /**
   * Start practice mode for this sign
   */
  startPractice() {
    if (!this.currentSign) return;
    
    // Dispatch event for practice mode
    const event = new CustomEvent('startPractice', {
      detail: { sign: this.currentSign }
    });
    document.dispatchEvent(event);
    
    this.close();
  }
}

// Export singleton instance
const signModal = new SignModal();
export default signModal;
