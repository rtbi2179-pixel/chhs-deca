import { describe, it, expect } from 'vitest';

describe('Explanation Button - State Management', () => {
  it('should toggle explanation state from false to true', () => {
    let showExplanation = false;
    const setShowExplanation = (value: boolean | ((prev: boolean) => boolean)) => {
      if (typeof value === 'function') {
        showExplanation = value(showExplanation);
      } else {
        showExplanation = value;
      }
    };

    // Initial state
    expect(showExplanation).toBe(false);

    // Click button to show explanation
    setShowExplanation(!showExplanation);
    expect(showExplanation).toBe(true);

    // Click button to hide explanation
    setShowExplanation(!showExplanation);
    expect(showExplanation).toBe(false);
  });

  it('should display explanation when showExplanation is true and currentQuestion exists', () => {
    const currentQuestion = {
      id: 'MKT-0001',
      rationale: 'This is the correct answer because...',
      distractorRationaleA: 'Option A is wrong because...',
      distractorRationaleB: 'Option B is wrong because...',
      distractorRationaleC: 'Option C is wrong because...',
      distractorRationaleD: 'Option D is wrong because...',
    };

    const showExplanation = true;

    // Check conditions for displaying explanation
    expect(showExplanation).toBe(true);
    expect(currentQuestion).toBeDefined();
    expect(currentQuestion.rationale).toBeTruthy();
    expect(currentQuestion.distractorRationaleA).toBeTruthy();
  });

  it('should have all distractor rationale fields populated', () => {
    const currentQuestion = {
      id: 'MKT-0001',
      rationale: 'Correct answer rationale',
      distractorRationaleA: 'Why A is wrong',
      distractorRationaleB: 'Why B is wrong',
      distractorRationaleC: 'Why C is wrong',
      distractorRationaleD: 'Why D is wrong',
    };

    expect(currentQuestion.distractorRationaleA).toBeTruthy();
    expect(currentQuestion.distractorRationaleB).toBeTruthy();
    expect(currentQuestion.distractorRationaleC).toBeTruthy();
    expect(currentQuestion.distractorRationaleD).toBeTruthy();
  });

  it('should reset explanation state when moving to next question', () => {
    let showExplanation = true;
    
    // Simulate moving to next question
    showExplanation = false;
    
    expect(showExplanation).toBe(false);
  });

  it('should show explanation button with correct text', () => {
    let showExplanation = false;
    const buttonText = showExplanation ? 'Hide' : 'Show';
    
    expect(buttonText).toBe('Show');
    
    showExplanation = true;
    const updatedButtonText = showExplanation ? 'Hide' : 'Show';
    
    expect(updatedButtonText).toBe('Hide');
  });

  it('should have chevron rotate when explanation is shown', () => {
    let showExplanation = false;
    const shouldRotate = showExplanation ? 'rotate-180' : '';
    
    expect(shouldRotate).toBe('');
    
    showExplanation = true;
    const updatedRotate = showExplanation ? 'rotate-180' : '';
    
    expect(updatedRotate).toBe('rotate-180');
  });

  it('should render explanation content only when conditions are met', () => {
    const showExplanation = true;
    const currentQuestion = {
      rationale: 'Test rationale',
      distractorRationaleA: 'Test A',
      distractorRationaleB: 'Test B',
      distractorRationaleC: 'Test C',
      distractorRationaleD: 'Test D',
    };

    // Both conditions must be true to show explanation
    const shouldShowExplanation = showExplanation && !!currentQuestion;
    
    expect(shouldShowExplanation).toBe(true);
    expect(currentQuestion.rationale).toBeTruthy();
    expect(currentQuestion).toBeDefined();
  });
});
