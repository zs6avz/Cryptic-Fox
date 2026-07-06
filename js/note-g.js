/**
 * Note G: Bernoulli Number Calculator
 * Implementation of Ada Lovelace's algorithm for computing Bernoulli numbers
 * Uses exact fraction arithmetic to preserve precision
 */

// Fraction class for exact rational arithmetic using BigInt
// (Regular JS numbers overflow for large Bernoulli numbers — BigInt is required)
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
    // Returns null for values too large for finite float representation
    toDecimal() {
        const result = Number(this.numerator) / Number(this.denominator);
        return isFinite(result) ? result : null;
    }
}

// Calculate binomial coefficient C(n, k) = n! / (k! * (n-k)!) using exact BigInt arithmetic
function binomial(n, k) {
    if (k > n) return 0n;
    if (k === 0 || k === n) return 1n;
    
    // Optimize: C(n,k) = C(n, n-k)
    if (k > n - k) {
        k = n - k;
    }
    
    // At each step i, result = C(n, i), so result*(n-i)/(i+1) = C(n, i+1)
    // Division is always exact since C(n, i+1) is an integer
    let result = 1n;
    for (let i = 0; i < k; i++) {
        result = result * BigInt(n - i) / BigInt(i + 1);
    }
    return result;
}

// Main function to compute Bernoulli number B_n
function bernoulli(n, logSteps = false) {
    const steps = [];
    
    if (n < 0) {
        throw new Error("n must be non-negative");
    }
    
    // Initialize array to store Bernoulli numbers
    const B = [];
    
    // Base case: B_0 = 1
    B[0] = new Fraction(1n, 1n);
    if (logSteps) steps.push(`B₀ = 1`);
    
    if (n === 0) {
        return { result: B[0], steps };
    }
    
    // Base case: B_1 = -1/2
    B[1] = new Fraction(-1n, 2n);
    if (logSteps) steps.push(`B₁ = -1/2`);
    
    if (n === 1) {
        return { result: B[1], steps };
    }
    
    // Compute B_2 through B_n using the correct recurrence:
    // B_i = -1/(i+1) * Σ(k=0 to i-1) C(i+1, k) * B_k
    for (let i = 2; i <= n; i++) {
        if (logSteps) steps.push(`\n--- Computing B_${i} ---`);
        
        let sum = new Fraction(0n, 1n);
        
        for (let k = 0; k <= i - 1; k++) {
            const C = binomial(i + 1, k);
            const term = B[k].multiply(C);
            
            if (logSteps && term.numerator !== 0n) {
                steps.push(`  k=${k}: C(${i+1},${k})=${C}, B_${k}=${B[k].toString()}`);
                steps.push(`       term = ${C} × ${B[k].toString()} = ${term.toString()}`);
            }
            
            sum = sum.add(term);
        }
        
        // B_i = -sum / (i+1)
        B[i] = sum.negate().divide(i + 1);
        
        if (logSteps) {
            steps.push(`  Sum = ${sum.toString()}`);
            steps.push(`  B_${i} = -(Sum) / ${i + 1} = ${B[i].toString()}`);
        }
    }
    
    return { result: B[n], steps };
}

// Format result for display
function formatResult(fraction, n) {
    const resultBox = document.getElementById('result-box');
    const resultN = document.getElementById('result-n');
    const resultValue = document.getElementById('result-value');
    const errorMessage = document.getElementById('error-message');
    
    // Clear any previous error
    errorMessage.style.display = 'none';
    
    // Update the n subscript
    resultN.textContent = n;
    
    // Display as "1" for even-indexed Bernoulli numbers (representing non-zero/exists)
    if (n > 0 && n % 2 === 0) {
        resultValue.innerHTML = `<span class="result-value">1</span>`;
    }
    // Display the fraction for B₀, B₁, and odd indices
    else if (fraction.numerator === 0n) {
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
    
    // Add decimal approximation if finite and meaningful
    const decimal = fraction.toDecimal();
    if (fraction.denominator !== 1n && decimal !== null) {
        const decimalDisplay = document.createElement('div');
        decimalDisplay.style.marginTop = '20px';
        decimalDisplay.style.fontSize = '1.1rem';
        decimalDisplay.style.color = 'var(--color-text-muted)';
        decimalDisplay.innerHTML = `≈ ${decimal.toFixed(10)}`;
        resultValue.appendChild(decimalDisplay);
    }
    
    // Show the result box
    resultBox.classList.add('show');
}

// Display computation steps
function displaySteps(steps) {
    const stepsContent = document.getElementById('steps-content');
    stepsContent.textContent = steps.join('\n');
}

// Main calculation handler
function calculateBernoulli() {
    const input = document.getElementById('n-input');
    const n = parseInt(input.value);
    const errorMessage = document.getElementById('error-message');
    const resultBox = document.getElementById('result-box');
    
    // Validate input
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
        errorMessage.textContent = 'For performance reasons, n is limited to 110. (Larger values cause extremely large numerators/denominators!)';
        errorMessage.style.display = 'block';
        resultBox.classList.remove('show');
        return;
    }
    
    // Clear previous error
    errorMessage.style.display = 'none';
    
    try {
        // Calculate Bernoulli number with step logging
        const { result, steps } = bernoulli(n, true);
        
        // Display result
        formatResult(result, n);
        displaySteps(steps);
        
        // Special note for even numbers > 0
        if (n > 0 && n % 2 === 0) {
            const note = document.createElement('div');
            note.style.marginTop = '20px';
            note.style.padding = '15px';
            note.style.background = 'rgba(254, 119, 67, 0.1)';
            note.style.borderRadius = 'var(--radius-md)';
            note.style.color = 'var(--color-text-muted)';
            note.innerHTML = '<strong>Binary Encoding:</strong> Even-indexed Bernoulli numbers are displayed as <strong>1</strong> (non-zero/exists), while odd indices (except B₁) are <strong>0</strong>. This creates a binary pattern based on existence.';
            document.getElementById('result-value').appendChild(note);
        }
        // Special note for odd numbers > 1
        else if (n > 1 && n % 2 === 1 && result.numerator === 0n) {
            const note = document.createElement('div');
            note.style.marginTop = '20px';
            note.style.padding = '15px';
            note.style.background = 'rgba(254, 119, 67, 0.1)';
            note.style.borderRadius = 'var(--radius-md)';
            note.style.color = 'var(--color-text-muted)';
            note.innerHTML = '<strong>Note:</strong> All odd Bernoulli numbers (except B₁) are equal to zero.';
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
    
    // Calculate on button click
    calculateBtn.addEventListener('click', calculateBernoulli);
    
    // Calculate on Enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateBernoulli();
        }
    });
    
    // Calculate the default value (8) on page load
    calculateBernoulli();
});
