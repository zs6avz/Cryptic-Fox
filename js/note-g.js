/**
 * Note G: Bernoulli Number Calculator
 * Implementation of Ada Lovelace's algorithm for computing Bernoulli numbers
 * Uses exact fraction arithmetic to preserve precision
 */

// Fraction class for exact rational arithmetic
class Fraction {
    constructor(numerator, denominator = 1) {
        if (denominator === 0) {
            throw new Error("Denominator cannot be zero");
        }
        
        // Normalize: move sign to numerator
        if (denominator < 0) {
            numerator = -numerator;
            denominator = -denominator;
        }
        
        // Simplify the fraction
        const g = this.gcd(Math.abs(numerator), Math.abs(denominator));
        this.numerator = numerator / g;
        this.denominator = denominator / g;
    }
    
    // Greatest Common Divisor using Euclidean algorithm
    gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a || 1;
    }
    
    // Add two fractions: a/b + c/d = (ad + bc) / bd
    add(other) {
        const newNumerator = this.numerator * other.denominator + other.numerator * this.denominator;
        const newDenominator = this.denominator * other.denominator;
        return new Fraction(newNumerator, newDenominator);
    }
    
    // Multiply two fractions: a/b * c/d = ac / bd
    multiply(other) {
        if (typeof other === 'number') {
            other = new Fraction(other, 1);
        }
        return new Fraction(
            this.numerator * other.numerator,
            this.denominator * other.denominator
        );
    }
    
    // Divide two fractions: a/b ÷ c/d = ad / bc
    divide(other) {
        if (typeof other === 'number') {
            other = new Fraction(other, 1);
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
        if (this.numerator === 0) {
            return "0";
        }
        if (this.denominator === 1) {
            return this.numerator.toString();
        }
        return `${this.numerator}/${this.denominator}`;
    }
    
    // Convert to decimal (for display purposes only)
    toDecimal() {
        return this.numerator / this.denominator;
    }
}

// Calculate binomial coefficient C(n, k) = n! / (k! * (n-k)!)
function binomial(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    // Optimize: C(n,k) = C(n, n-k)
    if (k > n - k) {
        k = n - k;
    }
    
    let result = 1;
    for (let i = 0; i < k; i++) {
        result = result * (n - i) / (i + 1);
    }
    
    return Math.round(result); // Round to handle floating point errors
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
    B[0] = new Fraction(1, 1);
    if (logSteps) steps.push(`B₀ = 1/1 = 1`);
    
    if (n === 0) {
        return { result: B[0], steps };
    }
    
    // Base case: B_1 = 1/2 (using positive convention)
    B[1] = new Fraction(1, 2);
    if (logSteps) steps.push(`B₁ = 1/2 (base case)`);
    
    if (n === 1) {
        return { result: B[1], steps };
    }
    
    // Compute B_2 through B_n recursively
    for (let i = 2; i <= n; i++) {
        if (logSteps) steps.push(`\n--- Computing B_${i} ---`);
        
        // Start with B_i = 0
        let sum = new Fraction(0, 1);
        
        // Sum over k from 0 to i-1
        for (let k = 0; k <= i - 1; k++) {
            const C = binomial(i, k);
            const divisor = i + 1 - k;
            
            // term = C(i,k) * B_k / (i+1-k)
            let term = B[k].multiply(C).divide(divisor);
            
            if (logSteps && term.numerator !== 0) {
                steps.push(`  k=${k}: C(${i},${k})=${C}, B_${k}=${B[k].toString()}, divisor=${divisor}`);
                steps.push(`       term = ${C} × ${B[k].toString()} ÷ ${divisor} = ${term.toString()}`);
            }
            
            sum = sum.add(term);
        }
        
        // B_i = -sum (according to the formula)
        B[i] = sum.negate();
        
        if (logSteps) {
            steps.push(`  Sum = ${sum.toString()}`);
            steps.push(`  B_${i} = -(Sum) = ${B[i].toString()}`);
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
    
    // Display the fraction
    if (fraction.numerator === 0) {
        resultValue.innerHTML = `<span class="result-value">0</span>`;
    } else if (fraction.denominator === 1) {
        resultValue.innerHTML = `<span class="result-value">${fraction.numerator}</span>`;
    } else {
        resultValue.innerHTML = `
            <div class="fraction-display">
                <span class="fraction-numerator">${fraction.numerator}</span>
                <span class="fraction-denominator">${fraction.denominator}</span>
            </div>
        `;
    }
    
    // Add decimal approximation if useful
    const decimal = fraction.toDecimal();
    if (fraction.denominator !== 1) {
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
        
        // Special note for odd numbers > 1
        if (n > 1 && n % 2 === 1 && result.numerator === 0) {
            const note = document.createElement('div');
            note.style.marginTop = '20px';
            note.style.padding = '15px';
            note.style.background = 'rgba(254, 119, 67, 0.1)';
            note.style.borderRadius = 'var(--radius-md)';
            note.style.color = 'var(--color-text-muted)';
            note.innerHTML = '<strong>Note:</strong> All odd Bernoulli numbers (except B₁) are equal to zero. This is a well-known mathematical property!';
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
