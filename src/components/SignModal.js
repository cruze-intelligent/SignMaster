/**
 * SignModal Component
 *
 * Displays a reviewed learning card for a sign when clicked.
 */

import { gsap } from 'gsap';
import assetLoader from '../services/AssetLoader.js';
import manifestLoader from '../services/ManifestLoader.js';
import stateManager from '../services/StateManager.js';
import translationService from '../services/TranslationService.js';

class SignModal {
  constructor() {
    this.element = null;
    this.isOpen = false;
    this.currentSign = null;
    this.currentCategory = null;
    this.init();
  }

  init() {
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
          <p class="sign-modal__acholi" style="display: none;"></p>
          <div class="sign-modal__meta">
            <span class="sign-modal__category"></span>
            <span class="sign-modal__difficulty"></span>
          </div>
          <div class="sign-modal__notice"></div>
          <div class="sign-modal__details" style="display: none;">
            <h3 class="sign-modal__section-title"></h3>
            <div class="sign-modal__detail-list"></div>
          </div>
          <div class="sign-modal__checklist">
            <h3 class="sign-modal__section-title sign-modal__checklist-title"></h3>
            <div class="sign-modal__check-grid"></div>
          </div>
          <div class="sign-modal__related" style="display: none;">
            <h3 class="sign-modal__section-title sign-modal__related-title"></h3>
            <div class="sign-modal__related-list"></div>
          </div>
        </div>
        <div class="sign-modal__actions">
          <button class="btn-primary sign-modal__learn"></button>
          <button class="btn-secondary sign-modal__practice"></button>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const closeBtn = this.element.querySelector('.sign-modal__close');
    closeBtn.addEventListener('click', () => this.close());

    const overlay = this.element.querySelector('.sign-modal__overlay');
    overlay.addEventListener('click', () => this.close());

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    const learnBtn = this.element.querySelector('.sign-modal__learn');
    learnBtn.addEventListener('click', () => {
      this.markAsLearned();
    });

    const practiceBtn = this.element.querySelector('.sign-modal__practice');
    practiceBtn.addEventListener('click', () => {
      this.startPractice();
    });
  }

  getInstructionRows(sign) {
    const instruction = sign.instruction || {};
    return [
      { key: 'handshape', label: translationService.t('handshape'), value: instruction.handshape },
      { key: 'location', label: translationService.t('location'), value: instruction.location },
      { key: 'orientation', label: translationService.t('orientation'), value: instruction.orientation },
      { key: 'movement', label: translationService.t('movement'), value: instruction.movement },
      { key: 'usage_tip', label: translationService.t('usage_tip'), value: instruction.usageTip }
    ].filter(row => row.value);
  }

  renderInstructionRows(sign) {
    const container = this.element.querySelector('.sign-modal__details');
    const list = this.element.querySelector('.sign-modal__detail-list');
    const title = this.element.querySelector('.sign-modal__section-title');
    const rows = this.getInstructionRows(sign);

    title.textContent = translationService.t('learning_details');

    if (rows.length === 0) {
      container.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    list.innerHTML = rows.map(row => `
      <div class="sign-modal__detail-item">
        <span class="sign-modal__detail-label">${row.label}</span>
        <span class="sign-modal__detail-value">${row.value}</span>
      </div>
    `).join('');
    container.style.display = 'block';
  }

  renderChecklist() {
    const title = this.element.querySelector('.sign-modal__checklist-title');
    const grid = this.element.querySelector('.sign-modal__check-grid');
    const items = [
      translationService.t('handshape'),
      translationService.t('location'),
      translationService.t('movement'),
      translationService.t('facial_expression')
    ];

    title.textContent = translationService.t('self_check');
    grid.innerHTML = items.map((item, index) => `
      <label class="sign-modal__check-item">
        <input type="checkbox" data-check-index="${index}">
        <span>${item}</span>
      </label>
    `).join('');
  }

  async renderRelatedSigns(sign, category) {
    const container = this.element.querySelector('.sign-modal__related');
    const title = this.element.querySelector('.sign-modal__related-title');
    const list = this.element.querySelector('.sign-modal__related-list');
    const categorySigns = await manifestLoader.getCategorySigns(category);
    const related = categorySigns.filter(entry => entry.id !== sign.id).slice(0, 3);

    if (related.length === 0) {
      container.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    title.textContent = translationService.t('practice_next');
    list.innerHTML = related.map(entry => `
      <button class="sign-modal__related-chip" data-related-id="${entry.id}">
        ${entry.label}
      </button>
    `).join('');

    list.querySelectorAll('[data-related-id]').forEach(button => {
      button.addEventListener('click', async () => {
        const nextSign = await manifestLoader.getSignById(button.dataset.relatedId);
        if (nextSign) {
          this.open(nextSign, nextSign.category || category);
        }
      });
    });

    container.style.display = 'block';
  }

  updateActionButtons(sign) {
    const learnBtn = this.element.querySelector('.sign-modal__learn');
    const practiceBtn = this.element.querySelector('.sign-modal__practice');
    const learned = stateManager.isSignLearned(sign.id);

    if (learned) {
      learnBtn.textContent = `✓ ${translationService.t('learned')}`;
      learnBtn.disabled = true;
      learnBtn.classList.add('sign-modal__learn--done');
    } else {
      learnBtn.textContent = `✓ ${translationService.t('learn_this')}`;
      learnBtn.disabled = false;
      learnBtn.classList.remove('sign-modal__learn--done');
    }

    practiceBtn.textContent = `🎯 ${translationService.t('practice')}`;
  }

  async open(sign, category) {
    this.currentSign = sign;
    this.currentCategory = category;
    this.isOpen = true;

    const title = this.element.querySelector('.sign-modal__title');
    const description = this.element.querySelector('.sign-modal__description');
    const acholi = this.element.querySelector('.sign-modal__acholi');
    const categoryEl = this.element.querySelector('.sign-modal__category');
    const difficultyEl = this.element.querySelector('.sign-modal__difficulty');
    const notice = this.element.querySelector('.sign-modal__notice');
    const img = this.element.querySelector('.sign-modal__image');
    const loader = this.element.querySelector('.sign-modal__loader');

    title.textContent = sign.label;
    description.textContent =
      sign.description || `${translationService.t('learn_to_sign')} "${sign.label}" ${translationService.t('in_usl')}`;
    categoryEl.textContent = `📁 ${category}`;
    difficultyEl.textContent = `📊 ${sign.difficulty || translationService.t('beginner')}`;
    notice.textContent = translationService.t('review_notice');

    if (sign.acholiLabel) {
      acholi.textContent = `Acholi: ${sign.acholiLabel}`;
      acholi.style.display = 'block';
    } else {
      acholi.style.display = 'none';
      acholi.textContent = '';
    }

    this.renderInstructionRows(sign);
    this.renderChecklist();
    await this.renderRelatedSigns(sign, category);
    this.updateActionButtons(sign);

    loader.style.display = 'flex';
    img.style.opacity = '0';
    this.element.style.display = 'flex';

    gsap.fromTo(
      this.element.querySelector('.sign-modal__overlay'),
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );

    gsap.fromTo(
      this.element.querySelector('.sign-modal__content'),
      { opacity: 0, scale: 0.8, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
    );

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

    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.isOpen) return;

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
        this.currentCategory = null;
      }
    });

    document.body.style.overflow = '';
  }

  markAsLearned() {
    if (!this.currentSign || stateManager.isSignLearned(this.currentSign.id)) return;

    const event = new CustomEvent('signLearned', {
      detail: {
        sign: this.currentSign,
        category: this.currentCategory
      }
    });
    document.dispatchEvent(event);

    const btn = this.element.querySelector('.sign-modal__learn');
    btn.textContent = `✓ ${translationService.t('learned')}`;
    btn.disabled = true;
    btn.classList.add('sign-modal__learn--done');

    setTimeout(() => {
      this.close();
    }, 800);
  }

  startPractice() {
    if (!this.currentSign) return;

    const event = new CustomEvent('startPractice', {
      detail: {
        sign: this.currentSign,
        category: this.currentCategory
      }
    });
    document.dispatchEvent(event);

    this.close();
  }
}

const signModal = new SignModal();
export default signModal;
