/**
 * Note G: Bernoulli Number Calculator
 * Complete implementation with both Historical (Ada's Note G) and Modern algorithms
 * Uses exact fraction arithmetic to preserve precision
 */

// ============================================================================
// FRACTION CLASS - Exact Rational Arithmetic using BigInt
// ============================================================================

class Fraction {
    constructor(numerator, denominator = 1n) {
        // Accept regular numbers and convert to BigInt
        if (typeof numerator === 'number') numerator = BigInt(Math.round(numerator));
        if (typeof denominator === 'number') denominator = BigInt(Math.round(denominator));

        if (denominator === 0n) {
            throw new Error("Denominator cannot be zero");
        }
        
        // Normalize: move sign to numerator
        if (denominator < 0n) {
            numerator = -numerator;
            denominator = -denominator;
        }
        
        // Simplify the fraction
        const g = this.gcd(numerator < 0n ? -numerator : numerator, denominator);
        this.numerator = numerator / g;
        this.denominator = denominator / g;
    }
    
    // Greatest Common Divisor using Euclidean algorithm (BigInt)
    gcd(a, b) {
        while (b !== 0n) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a === 0n ? 1n : a;
    }
    
    // Add two fractions: a/b + c/d = (ad + bc) / bd
    add(other) {
        return new Fraction(
            this.numerator * other.denominator + other.numerator * this.denominator,
            this.denominator * other.denominator
        );
    }
    
    // Subtract two fractions
    subtract(other) {
        return new Fraction(
            this.numerator * other.denominator - other.numerator * this.denominator,
            this.denominator * other.denominator
        );
    }
    
    // Multiply two fractions: a/b * c/d = ac / bd
    multiply(other) {
        if (typeof other === 'number' || typeof other === 'bigint') {
            other = new Fraction(other, 1n);
        }
        return new Fraction(
            this.numerator * other.numerator,
            this.denominator * other.denominator
        );
    }
    
    // Divide two fractions: a/b ÷ c/d = ad / bc
    divide(other) {
        if (typeof other === 'number' || typeof other === 'bigint') {
            other = new Fraction(other, 1n);
        }
        return new Fraction(
            this.numerator * other.denominator,
            this.denominator * other.numerator
        );
    }
    
    // Negate a fraction
    negate() {
        return new Fraction(-this.numerator, this.denominator);
    }
    
    // Convert to string representation
    toString() {
        if (this.numerator === 0n) {
            return "0";
        }
        if (this.denominator === 1n) {
            return this.numerator.toString();
        }
        return `${this.numerator}/${this.denominator}`;
    }
    
    // Convert to decimal approximation for display only
    toDecimal() {
        const result = Number(this.numerator) / Number(this.denominator);
        return isFinite(result) ? result : null;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Calculate binomial coefficient C(n, k) = n! / (k! * (n-k)!)
function binomial(n, k) {
    if (k > n) return 0n;
    if (k === 0 || k === n) return 1n;
    
    if (k > n - k) {
        k = n - k;
    }
    
    let result = 1n;
    for (let i = 0; i < k; i++) {
        result = result * BigInt(n - i) / BigInt(i + 1);
    }
    return result;
}

// ============================================================================
// MODERN ALGORITHM - Standard Recursive Formula
// ============================================================================

function bernoulliModern(n, logSteps = false) {
    const steps = [];
    
    if (n < 0) {
        throw new Error("n must be non-negative");
    }
    
    const B = [];
    
    // Base case: B_0 = 1
    B[0] = new Fraction(1n, 1n);
    if (logSteps) steps.push(`B₀ = 1`);
    
    if (n === 0) {
        return { result: B[0], steps };
    }
    
    // Base case: B_1 = -1/2 (modern convention)
    B[1] = new Fraction(-1n, 2n);
    if (logSteps) steps.push(`B₁ = -1/2 (modern convention)\n`);
    
    if (n === 1) {
        return { result: B[1], steps };
    }
    
    // Compute B_2 through B_n using the recurrence:
    // B_i = -1/(i+1) * Σ(k=0 to i-1) C(i+1, k) * B_k
    for (let i = 2; i <= n; i++) {
        if (logSteps) steps.push(`--- Computing B₍${i}₎ ---`);
        
        let sum = new Fraction(0n, 1n);
        
        for (let k = 0; k <= i - 1; k++) {
            const C = binomial(i + 1, k);
            const term = B[k].multiply(C);
            
            if (logSteps && term.numerator !== 0n) {
                steps.push(`  k=${k}: C(${i+1},${k})=${C}, B₍${k}₎=${B[k].toString()}`);
                steps.push(`       term = ${C} × ${B[k].toString()} = ${term.toString()}`);
            }
            
            sum = sum.add(term);
        }
        
        B[i] = sum.negate().divide(i + 1);
        
        if (logSteps) {
            steps.push(`  Sum = ${sum.toString()}`);
            steps.push(`  B₍${i}₎ = -(Sum) / ${i + 1} = ${B[i].toString()}\n`);
        }
    }
    
    return { result: B[n], steps };
}

// ============================================================================
// HISTORICAL ALGORITHM - Ada Lovelace's Note G
// ============================================================================

function bernoulliNoteG(n, logSteps = false, includeBug = false) {
    const steps = [];
    
    if (n < 0) {
        throw new Error("n must be non-negative");
    }
    
    // Special case: B₀ = 1
    if (n === 0) {
        if (logSteps) steps.push(`B₀ = 1 (predefined base value)`);
        return { result: new Fraction(1n, 1n), steps };
    }
    
    // Special case: B₁ = +1/2 (Ada's historical convention)
    if (n === 1) {
        if (logSteps) {
            steps.push(`B₁ = 1/2 (Ada's historical convention)`);
            steps.push(`Note: Modern mathematics uses B₁ = -1/2\n`);
        }
        return { result: new Fraction(1n, 2n), steps };
    }
    
    // For odd n > 1, return 0
    if (n > 1 && n % 2 === 1) {
        if (logSteps) {
            steps.push(`B₃, B₅, B₇, ... = 0 (all odd Bernoulli numbers except B₁)`);
            if (includeBug && n === 7) {
                steps.push(`\n⚠️ Note: The historical B₇ bug affects even indices during computation,`);
                steps.push(`but B₇ itself is still 0 (odd index property).`);
            }
        }
        return { result: new Fraction(0n, 1n), steps };
    }
    
    // Build all Bernoulli numbers up to n
    const B = [];
    B[0] = new Fraction(1n, 1n);
    B[1] = new Fraction(1n, 2n);  // Ada's +1/2
    
    if (logSteps) {
        steps.push(`========================================`);
        steps.push(`Ada Lovelace's Note G Algorithm`);
        steps.push(`Operation-Based (Analytical Engine)`);
        steps.push(`========================================\n`);
        steps.push(`Historical convention: B₁ = +1/2`);
        steps.push(`Initial Store: B₀ = 1, B₁ = 1/2\n`);
    }
    
    // Compute even Bernoulli numbers using Ada's algorithm
    for (let i = 2; i <= n; i++) {
        if (i % 2 === 1) {
            B[i] = new Fraction(0n, 1n);
            continue;
        }
        
        if (logSteps) {
            steps.push(`\n${'='.repeat(50)}`);
            steps.push(`Computing B₍${i}₎ - Analytical Engine Simulation`);
            steps.push(`${'='.repeat(50)}`);
        }
        
        // Initialize Store variables (Mill registers)
        let V1 = new Fraction(1n, 1n);
        let V2 = new Fraction(2n, 1n);
        let V3 = new Fraction(BigInt(i), 1n);
        let V4 = new Fraction(0n, 1n);
        let V5 = new Fraction(0n, 1n);
        let V6 = new Fraction(0n, 1n);
        let V7 = new Fraction(0n, 1n);
        
        let opNum = 1;
        
        if (logSteps) {
            steps.push(`\nStore (Variables):`);
            steps.push(`  V₁ = 1 (constant), V₂ = 2 (constant), V₃ = ${i} (index)`);
            steps.push(`  V₄, V₅, V₆, V₇ = 0 (working registers)\n`);
        }
        
        // === OPERATION 1: V₄ = V₃ - V₁ ===
        V4 = V3.subtract(V1);
        if (logSteps) {
            steps.push(`Op.${opNum}: V₄ ← V₃ - V₁ = ${V3.toString()} - ${V1.toString()} = ${V4.toString()}`);
        }
        opNum++;
        
        // === OPERATION 2: V₅ = V₃ + V₁ ===
        V5 = V3.add(V1);
        if (logSteps) {
            steps.push(`Op.${opNum}: V₅ ← V₃ + V₁ = ${V3.toString()} + ${V1.toString()} = ${V5.toString()}`);
        }
        opNum++;
        
        // === OPERATION 3: V₄ = V₄ / V₅ ===
        V4 = V4.divide(V5);
        if (logSteps) {
            steps.push(`Op.${opNum}: V₄ ← V₄ / V₅ = (n-1)/(n+1) = ${V4.toString()}\n`);
        }
        opNum++;
        
        // === OPERATIONS 4-6: Initial accumulation ===
        if (logSteps) {
            steps.push(`Accumulation phase:`);
        }
        
        // Op.4: V₆ = V₄ × B₀
        V6 = V4.multiply(B[0]);
        if (logSteps) {
            steps.push(`Op.${opNum}: V₆ ← V₄ × B₀ = ${V4.toString()} × ${B[0].toString()} = ${V6.toString()}`);
        }
        opNum++;
        
        // Op.5: V₇ = V₄ × B₁
        V7 = V4.multiply(B[1]);
        if (logSteps) {
            steps.push(`Op.${opNum}: V₇ ← V₄ × B₁ = ${V4.toString()} × ${B[1].toString()} = ${V7.toString()}`);
        }
        opNum++;
        
        // Op.6: V₆ = V₆ + V₇
        V6 = V6.add(V7);
        if (logSteps) {
            steps.push(`Op.${opNum}: V₆ ← V₆ + V₇ = ${V6.toString()}\n`);
        }
        opNum++;
        
        // === LOOP: Process remaining even Bernoulli numbers ===
        let currentIndex = 2;
        let loopIteration = 1;
        
        while (currentIndex < i) {
            if (logSteps) {
                steps.push(`Loop iteration ${loopIteration}: processing B₍${currentIndex}₎`);
            }
            
            // Compute scaling coefficients from binomial pattern
            const n_plus_1 = BigInt(i + 1);
            const two_m = BigInt(2 * currentIndex);
            const two_m_plus_1 = BigInt(2 * currentIndex + 1);
            
            // Scale V₆ by appropriate binomial factor
            const scaleFactor = new Fraction(
                n_plus_1 - two_m,
                n_plus_1 - two_m + 2n
            );
            V6 = V6.multiply(scaleFactor);
            
            if (logSteps) {
                steps.push(`  Op.${opNum}: V₆ scaled by factor = ${V6.toString()}`);
            }
            opNum++;
            
            // Compute contribution from B[currentIndex]
            const coeff = new Fraction(
                binomial(Number(n_plus_1), Number(two_m)) * two_m * two_m_plus_1,
                1n
            );
            V7 = V4.multiply(B[currentIndex]).multiply(coeff);
            
            if (logSteps) {
                steps.push(`  Op.${opNum}: V₇ ← V₄ × B₍${currentIndex}₎ × coefficients = ${V7.toString()}`);
            }
            opNum++;
            
            // *** THE B₇ BUG ***
            // When computing B₈ with the bug enabled, Operation 13 subtracts instead of adds
            // This occurs when processing B₆ (the 13th operation in Ada's table)
            const isOperation13Bug = includeBug && i === 8 && currentIndex === 6;
            
            if (isOperation13Bug) {
                V6 = V6.subtract(V7);  // BUG: subtract instead of add
                if (logSteps) {
                    steps.push(`  Op.${opNum}: V₆ ← V₆ - V₇  ⚠️ [HISTORICAL BUG: Operation 13]`);
                    steps.push(`           Should be addition! This is Ada's published error.`);
                    steps.push(`           Result: ${V6.toString()}`);
                }
            } else {
                V6 = V6.add(V7);
                if (logSteps) {
                    steps.push(`  Op.${opNum}: V₆ ← V₆ + V₇ = ${V6.toString()}`);
                }
            }
            opNum++;
            
            currentIndex += 2;
            loopIteration++;
            if (logSteps) steps.push(``);
        }
        
        // === FINAL OPERATION ===
        if (logSteps) {
            steps.push(`Final computation:`);
            steps.push(`Op.${opNum}: B₍${i}₎ ← -V₆ / V₅ = -(${V6.toString()}) / ${V5.toString()}`);
        }
        
        B[i] = V6.negate().divide(V5);
        
        if (logSteps) {
            steps.push(`Result: B₍${i}₎ = ${B[i].toString()}`);
            
            if (includeBug && i === 8) {
                steps.push(`\n⚠️ This result contains the historical Operation 13 bug!`);
                const correct = bernoulliModern(i, false).result;
                steps.push(`   Correct value: B₍${i}₎ = ${correct.toString()}`);
                steps.push(`   This demonstrates the kind of error Ada would have debugged.`);
            }
        }
    }
    
    return { result: B[n], steps };
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

// Global state
let currentMode = 'modern';

function setMode(mode) {
    currentMode = mode;
    
    // Update button states
    document.getElementById('mode-modern').classList.toggle('active', mode === 'modern');
    document.getElementById('mode-historical').classList.toggle('active', mode === 'historical');
    
    // Update description
    const modeDesc = document.getElementById('mode-description');
    const bugToggle = document.getElementById('bug-toggle-group');
    
    if (mode === 'modern') {
        modeDesc.textContent = 'Uses modern recursive formula with B₁ = -1/2 (standard mathematical convention)';
        bugToggle.style.display = 'none';
    } else {
        modeDesc.innerHTML = 'Uses Ada Lovelace\'s original operation-based algorithm with B₁ = +1/2<br><strong>Simulates the Analytical Engine\'s Store and Mill operations</strong>';
        bugToggle.style.display = 'block';
    }
    
    // Recalculate with new mode
    calculateBernoulli();
}

function updateBugDescription() {
    const bugDesc = document.getElementById('bug-description');
    const includeBug = document.getElementById('include-bug').checked;
    
    if (includeBug) {
        bugDesc.innerHTML = '<strong>⚠️ Historical bug enabled:</strong> When computing B₈, Operation 13 will subtract V₇ instead of adding it (as published in Ada\'s table). This produces an incorrect B₈ value, demonstrating the reality of debugging in early computing.';
    } else {
        bugDesc.textContent = 'Bug disabled: All results will be mathematically correct';
    }
    
    // Recalculate
    calculateBernoulli();
}

function formatResult(fraction, n, mode) {
    const resultBox = document.getElementById('result-box');
    const resultN = document.getElementById('result-n');
    const resultValue = document.getElementById('result-value');
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.style.display = 'none';
    resultN.textContent = n;
    
    // Display the fraction
    if (fraction.numerator === 0n) {
        resultValue.innerHTML = `<span class="result-value">0</span>`;
    } else if (fraction.denominator === 1n) {
        resultValue.innerHTML = `<span class="result-value">${fraction.numerator}</span>`;
    } else {
        resultValue.innerHTML = `
            <div class="fraction-display">
                <span class="fraction-numerator">${fraction.numerator}</span>
                <span class="fraction-denominator">${fraction.denominator}</span>
            </div>
        `;
    }
    
    // Add decimal approximation
    const decimal = fraction.toDecimal();
    if (decimal !== null && fraction.numerator !== 0n) {
        const decimalDisplay = document.createElement('div');
        decimalDisplay.style.marginTop = '20px';
        decimalDisplay.style.fontSize = '1.1rem';
        decimalDisplay.style.color = 'var(--color-text-muted)';
        decimalDisplay.innerHTML = `≈ ${decimal.toExponential(10)}`;
        resultValue.appendChild(decimalDisplay);
    }
    
    // Add mode indicator
    const modeIndicator = document.createElement('div');
    modeIndicator.style.marginTop = '15px';
    modeIndicator.style.padding = '10px';
    modeIndicator.style.background = 'rgba(139, 69, 69, 0.1)';
    modeIndicator.style.borderRadius = 'var(--radius-sm)';
    modeIndicator.style.fontSize = '0.9rem';
    modeIndicator.style.color = 'var(--color-text-muted)';
    
    if (mode === 'historical') {
        const bugEnabled = document.getElementById('include-bug').checked;
        modeIndicator.innerHTML = `<strong>Historical Mode:</strong> B₁ = +1/2 (Ada's convention)${bugEnabled && n === 8 ? ' <strong style="color: var(--color-primary);">⚠️ Contains Operation 13 bug</strong>' : ''}`;
    } else {
        modeIndicator.innerHTML = `<strong>Modern Mode:</strong> B₁ = -1/2 (standard convention)`;
    }
    resultValue.appendChild(modeIndicator);
    
    resultBox.classList.add('show');
}

function displaySteps(steps) {
    const stepsContent = document.getElementById('steps-content');
    stepsContent.textContent = steps.join('\n');
}

function calculateBernoulli() {
    const input = document.getElementById('n-input');
    const n = parseInt(input.value);
    const errorMessage = document.getElementById('error-message');
    const resultBox = document.getElementById('result-box');
    
    // Validation
    if (isNaN(n)) {
        errorMessage.textContent = 'Please enter a valid number.';
        errorMessage.style.display = 'block';
        resultBox.classList.remove('show');
        return;
    }
    
    if (n < 0) {
        errorMessage.textContent = 'n must be non-negative.';
        errorMessage.style.display = 'block';
        resultBox.classList.remove('show');
        return;
    }
    
    if (n > 110) {
        errorMessage.textContent = 'For performance reasons, n is limited to 110.';
        errorMessage.style.display = 'block';
        resultBox.classList.remove('show');
        return;
    }
    
    errorMessage.style.display = 'none';
    
    try {
        let result, steps;
        
        if (currentMode === 'modern') {
            ({ result, steps } = bernoulliModern(n, true));
        } else {
            const includeBug = document.getElementById('include-bug').checked;
            ({ result, steps } = bernoulliNoteG(n, true, includeBug));
        }
        
        formatResult(result, n, currentMode);
        displaySteps(steps);
        
        // Add note for odd numbers
        if (n > 1 && n % 2 === 1 && result.numerator === 0n) {
            const note = document.createElement('div');
            note.style.marginTop = '15px';
            note.style.padding = '15px';
            note.style.background = 'rgba(139, 69, 69, 0.1)';
            note.style.borderRadius = 'var(--radius-md)';
            note.style.color = 'var(--color-text-muted)';
            note.innerHTML = '<strong>Mathematical Property:</strong> All odd Bernoulli numbers (except B₁) equal zero.';
            document.getElementById('result-value').appendChild(note);
        }
        
    } catch (error) {
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.display = 'block';
        resultBox.classList.remove('show');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const input = document.getElementById('n-input');
    
    // Only initialize if we're on the note-g.html page
    if (calculateBtn && input) {
        calculateBtn.addEventListener('click', calculateBernoulli);
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                calculateBernoulli();
            }
        });
        
        // Calculate default value on load
        calculateBernoulli();
    }
});
