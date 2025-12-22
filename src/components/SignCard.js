/**
 * SignCard Component
 * 
 * Displays a sign image card with lazy loading, animations, and interactions
 */

import assetLoader from '../services/AssetLoader.js';
import { gsap } from 'gsap';

export class SignCard {
  constructor(sign, category) {
    this.sign = sign;
    this.category = category;
    this.element = null;
    this.loaded = false;
  }

  /**
   * Render the sign card
   */
  render() {
    this.element = document.createElement('div');
    this.element.className = 'sign-card';
    this.element.setAttribute('data-sign-id', this.sign.id);
    
    this.element.innerHTML = `
      <div class="sign-card__inner">
        <div class="sign-card__image-wrapper">
          <img 
            class="sign-card__image" 
            alt="${this.sign.label}"
            data-filename="${this.sign.filename}"
          />
          <div class="sign-card__loader">
            <div class="spinner"></div>
          </div>
        </div>
        <div class="sign-card__label">${this.sign.label}</div>
        ${this.sign.verified ? '<span class="sign-card__verified">✓</span>' : ''}
      </div>
    `;
    
    // Lazy load image
    const img = this.element.querySelector('.sign-card__image');
    assetLoader.lazyLoadImage(img, this.sign.filename, this.category);
    
    // Hide loader when image loads (backup listener)
    img.addEventListener('load', () => {
      this.loaded = true;
      const loader = this.element.querySelector('.sign-card__loader');
      if (loader) loader.style.display = 'none';
    });
    
    return this.element;
  }

  /**
   * Animate card entrance - only called explicitly
   */
  animateIn() {
    // Simple fade in without transform conflicts
    gsap.to(this.element, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  }

  /**
   * Highlight card (for correct answer)
   */
  highlightCorrect() {
    gsap.to(this.element, {
      scale: 1.1,
      boxShadow: '0 0 20px rgba(0, 255, 0, 0.6)',
      duration: 0.3,
      yoyo: true,
      repeat: 1
    });
  }

  /**
   * Shake card (for wrong answer)
   */
  shakeWrong() {
    gsap.to(this.element, {
      x: [-10, 10, -10, 10, 0],
      duration: 0.5
    });
  }

  /**
   * Remove card with animation
   */
  remove() {
    return new Promise((resolve) => {
      if (!this.element || !this.element.parentNode) {
        resolve();
        return;
      }
      this.element.remove();
      resolve();
    });
  }

  /**
   * Update sign data
   */
  update(sign) {
    this.sign = sign;
    const label = this.element.querySelector('.sign-card__label');
    if (label) {
      label.textContent = sign.label;
    }
  }
}

/**
 * SignGrid Component
 * 
 * Manages a grid of SignCard components
 */
export class SignGrid {
  constructor(containerElement) {
    this.container = containerElement;
    this.cards = [];
  }

  /**
   * Render sign cards in grid
   */
  async renderSigns(signs, category) {
    // Clear existing cards synchronously (no animation)
    this.cards.forEach(card => {
      if (card.element && card.element.parentNode) {
        card.element.parentNode.removeChild(card.element);
      }
    });
    this.cards = [];
    
    if (!this.container) {
      console.error('❌ Container is null!');
      return;
    }
    
    // Also clear container's innerHTML to be safe
    this.container.innerHTML = '';
    
    // Limit stagger to first 12 cards only (visible ones)
    const maxStagger = 12;
    
    signs.forEach((sign, index) => {
      const card = new SignCard(sign, category);
      this.cards.push(card);
      
      const cardElement = card.render();
      this.container.appendChild(cardElement);
      
      // Only animate first few visible cards with short stagger
      if (index < maxStagger) {
        gsap.fromTo(cardElement, 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.3, delay: index * 0.05 }
        );
      }
    });
    
    console.log(`✅ Rendered ${signs.length} sign cards`);
  }

  /**
   * Get card by sign ID
   */
  getCard(signId) {
    return this.cards.find(card => card.sign.id === signId);
  }

  /**
   * Clear all cards
   */
  async clear() {
    const removePromises = this.cards.map(card => card.remove());
    await Promise.all(removePromises);
    this.cards = [];
  }

  /**
   * Shuffle cards with animation
   */
  shuffle() {
    const positions = this.cards.map(card => ({
      x: card.element.offsetLeft,
      y: card.element.offsetTop
    }));
    
    // Fisher-Yates shuffle
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    
    // Animate to new positions
    this.cards.forEach((card, index) => {
      gsap.to(card.element, {
        x: positions[index].x - card.element.offsetLeft,
        y: positions[index].y - card.element.offsetTop,
        duration: 0.5,
        ease: 'power2.inOut'
      });
    });
  }
}
