/**
 * Porter Stemmer Algorithm
 * JavaScript implementation of the Porter Stemming Algorithm
 * Based on the canonical Python version by Martin Porter
 * 
 * Porter, 1980, An algorithm for suffix stripping, Program, Vol. 14, no. 3, pp 130-137
 * 
 * Usage:
 *   const stemmer = new PorterStemmer();
 *   const stem = stemmer.stem("running");  // "run"
 */

class PorterStemmer {
    constructor() {
        this.b = "";
        this.k = 0;
        this.j = 0;
    }

    cons(i) {
        // Returns true if b[i] is a consonant
        const ch = this.b[i];
        if (ch === 'a' || ch === 'e' || ch === 'i' || ch === 'o' || ch === 'u') {
            return false;
        }
        if (ch === 'y') {
            return (i === 0) ? true : !this.cons(i - 1);
        }
        return true;
    }

    m() {
        // Measures the number of consonant sequences between 0 and j
        let n = 0;
        let i = 0;
        const jVal = this.j;
        
        while (true) {
            if (i > jVal) return n;
            if (!this.cons(i)) break;
            i++;
        }
        i++;
        
        while (true) {
            while (true) {
                if (i > jVal) return n;
                if (this.cons(i)) break;
                i++;
            }
            i++;
            n++;
            while (true) {
                if (i > jVal) return n;
                if (!this.cons(i)) break;
                i++;
            }
            i++;
        }
    }

    vowelinstem() {
        // Returns true if 0...j contains a vowel
        for (let i = 0; i <= this.j; i++) {
            if (!this.cons(i)) return true;
        }
        return false;
    }

    doublec(j) {
        // Returns true if j,(j-1) contain a double consonant
        if (j < 1) return false;
        if (this.b[j] !== this.b[j - 1]) return false;
        return this.cons(j);
    }

    cvc(i) {
        // Returns true if i-2,i-1,i has the form consonant-vowel-consonant
        // and the second c is not w,x or y
        if (i < 2 || !this.cons(i) || this.cons(i - 1) || !this.cons(i - 2)) {
            return false;
        }
        const ch = this.b[i];
        return ch !== 'w' && ch !== 'x' && ch !== 'y';
    }

    ends(s) {
        // Returns true if b ends with s
        const len = s.length;
        const k = this.k;
        if (s[len - 1] !== this.b[k]) return false;
        if (len > k + 1) return false;
        if (this.b.substring(k - len + 1, k + 1) !== s) return false;
        this.j = k - len;
        return true;
    }

    setto(s) {
        // Sets (j+1),...k to the characters in s
        const len = s.length;
        const j = this.j;
        this.b = this.b.substring(0, j + 1) + s + this.b.substring(j + 1 + len);
        this.k = j + len;
    }

    r(s) {
        // Used by step1b and step1c, replaces suffix with s if m() > 0
        if (this.m() > 0) {
            this.setto(s);
        }
    }

    step1ab() {
        // Gets rid of plurals and -ed or -ing
        if (this.b[this.k] === 's') {
            if (this.ends("sses")) {
                this.k -= 2;
            } else if (this.ends("ies")) {
                this.setto("i");
            } else if (this.b[this.k - 1] !== 's') {
                this.k--;
            }
        }
        if (this.ends("eed")) {
            if (this.m() > 0) this.k--;
        } else if ((this.ends("ed") || this.ends("ing")) && this.vowelinstem()) {
            this.k = this.j;
            if (this.ends("at")) {
                this.setto("ate");
            } else if (this.ends("bl")) {
                this.setto("ble");
            } else if (this.ends("iz")) {
                this.setto("ize");
            } else if (this.doublec(this.k)) {
                this.k--;
                const ch = this.b[this.k];
                if (ch === 'l' || ch === 's' || ch === 'z') {
                    this.k++;
                }
            } else if (this.m() === 1 && this.cvc(this.k)) {
                this.setto("e");
            }
        }
    }

    step1c() {
        // Turns terminal y to i when there is another vowel in the stem
        if (this.ends("y") && this.vowelinstem()) {
            this.b = this.b.substring(0, this.k) + 'i' + this.b.substring(this.k + 1);
        }
    }

    step2() {
        // Maps double suffices to single ones
        switch (this.b[this.k - 1]) {
            case 'a':
                if (this.ends("ational")) { this.r("ate"); break; }
                if (this.ends("tional")) { this.r("tion"); break; }
                break;
            case 'c':
                if (this.ends("enci")) { this.r("ence"); break; }
                if (this.ends("anci")) { this.r("ance"); break; }
                break;
            case 'e':
                if (this.ends("izer")) { this.r("ize"); break; }
                break;
            case 'l':
                if (this.ends("bli")) { this.r("ble"); break; }
                if (this.ends("alli")) { this.r("al"); break; }
                if (this.ends("entli")) { this.r("ent"); break; }
                if (this.ends("eli")) { this.r("e"); break; }
                if (this.ends("ousli")) { this.r("ous"); break; }
                break;
            case 'o':
                if (this.ends("ization")) { this.r("ize"); break; }
                if (this.ends("ation")) { this.r("ate"); break; }
                if (this.ends("ator")) { this.r("ate"); break; }
                break;
            case 's':
                if (this.ends("alism")) { this.r("al"); break; }
                if (this.ends("iveness")) { this.r("ive"); break; }
                if (this.ends("fulness")) { this.r("ful"); break; }
                if (this.ends("ousness")) { this.r("ous"); break; }
                break;
            case 't':
                if (this.ends("aliti")) { this.r("al"); break; }
                if (this.ends("iviti")) { this.r("ive"); break; }
                if (this.ends("biliti")) { this.r("ble"); break; }
                break;
            case 'g':
                if (this.ends("logi")) { this.r("log"); break; }
                break;
        }
    }

    step3() {
        // Deals with -ic-, -full, -ness etc
        switch (this.b[this.k]) {
            case 'e':
                if (this.ends("icate")) { this.r("ic"); break; }
                if (this.ends("ative")) { this.r(""); break; }
                if (this.ends("alize")) { this.r("al"); break; }
                break;
            case 'i':
                if (this.ends("iciti")) { this.r("ic"); break; }
                break;
            case 'l':
                if (this.ends("ical")) { this.r("ic"); break; }
                if (this.ends("ful")) { this.r(""); break; }
                break;
            case 's':
                if (this.ends("ness")) { this.r(""); break; }
                break;
        }
    }

    step4() {
        // Takes off -ant, -ence etc., in context <c>vcvc<v>
        switch (this.b[this.k - 1]) {
            case 'a':
                if (this.ends("al")) break;
                return;
            case 'c':
                if (this.ends("ance")) break;
                if (this.ends("ence")) break;
                return;
            case 'e':
                if (this.ends("er")) break;
                return;
            case 'i':
                if (this.ends("ic")) break;
                return;
            case 'l':
                if (this.ends("able")) break;
                if (this.ends("ible")) break;
                return;
            case 'n':
                if (this.ends("ant")) break;
                if (this.ends("ement")) break;
                if (this.ends("ment")) break;
                if (this.ends("ent")) break;
                return;
            case 'o':
                if (this.ends("ion") && this.j >= 0 && (this.b[this.j] === 's' || this.b[this.j] === 't')) break;
                if (this.ends("ou")) break;
                return;
            case 's':
                if (this.ends("ism")) break;
                return;
            case 't':
                if (this.ends("ate")) break;
                if (this.ends("iti")) break;
                return;
            case 'u':
                if (this.ends("ous")) break;
                return;
            case 'v':
                if (this.ends("ive")) break;
                return;
            case 'z':
                if (this.ends("ize")) break;
                return;
            default:
                return;
        }
        if (this.m() > 1) {
            this.k = this.j;
        }
    }

    step5() {
        // Removes a final -e if m() > 1, and changes -ll to -l if m() > 1
        this.j = this.k;
        if (this.b[this.k] === 'e') {
            const a = this.m();
            if (a > 1 || (a === 1 && !this.cvc(this.k - 1))) {
                this.k--;
            }
        }
        if (this.b[this.k] === 'l' && this.doublec(this.k) && this.m() > 1) {
            this.k--;
        }
    }

    stem(w) {
        // Stem a word. Returns the stemmed form.
        if (typeof w !== 'string' || w.length <= 2) {
            return w;
        }
        
        this.b = w.toLowerCase();
        this.k = this.b.length - 1;
        
        if (this.k <= 1) {
            return this.b;
        }
        
        this.step1ab();
        this.step1c();
        this.step2();
        this.step3();
        this.step4();
        this.step5();
        
        return this.b.substring(0, this.k + 1);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PorterStemmer;
}
