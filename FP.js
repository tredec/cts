import { ExponentialCost, FreeCost, LinearCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber } from "./api/BigNumber";
import { theory } from "./api/Theory";
import { Utils } from "./api/Utils";

var id = "fractal_patterns";
var name = "Fractal Patterns";
var description = "A basic theory.";
var authors = "Gilles-Philippe Paillé";
var version = 1;

var currency = BigNumber.ZERO;
var rhodot = BigNumber.ZERO;
var q = BigNumber.ONE;
var r = BigNumber.ONE;
var c1, c2, q1, q2, r1, r2, n1, n2, n3, s;
var c1Exp, tnexp, unexp, terms, fractalTerm;

var sum = 1;
var prevSum = 1;
var T_n = BigNumber.ONE;
var S_n = BigNumber.ONE;
var U_n = BigNumber.ONE;

var maxUDN = BigNumber.ONE;

var updateN_flag = true;

//precomputed U_n every 100 generations until 15000 generations
let un_precomputed = [
  0, 9749, 38997, 92821, 155989, 271765, 371285, 448661, 623957, 808853, 1087061, 1415829, 1485141, 1663893, 1794645, 2068245, 2495829, 2681877, 3235413, 3527445, 4348245, 5600149, 5663317, 5807893, 5940565,
  6200341, 6655573, 6841621, 7178581, 7607701, 8272981, 9793813, 9983317, 10246549, 10727509, 11309845, 12941653, 13288981, 14109781, 15594133, 17392981, 22369685, 22400597, 22488341, 22653269, 22839317, 23231573,
  23488661, 23762261, 24243221, 24801365, 25677461, 26622293, 26830229, 27366485, 27800213, 28714325, 29858837, 30430805, 32081045, 33091925, 35461013, 39175253, 39364757, 39933269, 40196501, 40986197, 42341525,
  42910037, 43952021, 45239381, 47328533, 51766613, 52321301, 53155925, 54567701, 56439125, 61199765, 62376533, 64838933, 69571925, 74595221, 89478741, 89511189, 89602389, 89763861, 89953365, 90387093, 90613077,
  90872853, 91357269, 91915413, 92926293, 93732885, 93954645, 94480533, 95049045, 95838741, 96972885, 97555221, 99205461, 100247445, 102709845, 106289301, 106489173, 107042709, 107320917, 108110613, 109465941,
  110024085, 111200853, 112394901, 114857301, 118877205, 119435349, 120311445, 121723221, 123594645, 128324181, 129625365, 132367701, 136696341, 141844053, 156588693, 156701013, 156964245, 157459029, 158027541,
  159733077, 159996309, 160786005, 162239253, 163944789, 167070741, 169366101, 170062485, 171640149, 173304213, 175808085, 179086101, 180957525, 185783829, 189314133, 196701333, 207066453, 207624597, 209285205,
  210161301, 212623701, 216565269, 218270805, 222174357, 225756501, 232770453, 244799061, 246473493, 249506133, 253368213, 259355733, 273171093, 278287701, 285394965, 298380885, 314103957, 357914965, 357953557,
  358044757, 358209685, 358409557, 358962709, 359055445, 359318677, 359813461, 360371605, 361548373, 362178709, 362452309, 362933269, 363491413, 364367509, 365429077, 366052885, 367661653, 368962837, 371705173,
  374740885, 374931541, 375481621, 375818581, 376608277, 377922133, 378490645, 380196181, 380985877, 383354965, 387323029, 387891541, 388933525, 390220885, 392310037, 396821845
];

var stage = 1;

var init = () => {
  currency = theory.createCurrency();

  ///////////////////
  // Regular Upgrades

  // c1
  {
    let getDesc = (level) => "c_1=" + getC1(level).toString(0);
    c1 = theory.createUpgrade(0, currency, new FirstFreeCost(new ExponentialCost(2, Math.log2(1.4))));
    c1.getDescription = (_) => Utils.getMath(getDesc(c1.level));
    c1.getInfo = (amount) => Utils.getMathTo(getDesc(c1.level), getDesc(c1.level + amount));
  }

  // c2
  {
    let getDesc = (level) => "c_2=2^{" + level + "}";
    let getInfo = (level) => "c_2=" + getC2(level).toString(0);
    c2 = theory.createUpgrade(1, currency, new ExponentialCost(10, Math.log2(9)));
    c2.getDescription = (_) => Utils.getMath(getDesc(c2.level));
    c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level), getInfo(c2.level + amount));
  }
  // q1
  {
    let getDesc = (level) => "q_1=" + getQ1(level).toString(0);
    let getInfo = (level) => "q_1=" + getQ1(level).toString(0);
    q1 = theory.createUpgrade(2, currency, new FirstFreeCost(new ExponentialCost(1e25, Math.log2(12))));
    q1.getDescription = (_) => Utils.getMath(getDesc(q1.level));
    q1.getInfo = (amount) => Utils.getMathTo(getInfo(q1.level), getInfo(q1.level + amount));
  }
  // q2
  {
    let getDesc = (level) => "q_2=2^{" + level + "}";
    let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
    q2 = theory.createUpgrade(3, currency, new ExponentialCost(1e35, Math.log2(1e2)));
    q2.getDescription = (_) => Utils.getMath(getDesc(q2.level));
    q2.getInfo = (amount) => Utils.getMathTo(getInfo(q2.level), getInfo(q2.level + amount));
  }
  // r1
  {
    let getDesc = (level) => "r_1=" + getR1(level).toString(0);
    let getInfo = (level) => "r_1=" + getR1(level).toString(0);
    r1 = theory.createUpgrade(4, currency, new FirstFreeCost(new ExponentialCost(1e100, Math.log2(63))));
    r1.getDescription = (_) => Utils.getMath(getDesc(r1.level));
    r1.getInfo = (amount) => Utils.getMathTo(getInfo(r1.level), getInfo(r1.level + amount));
  }
  // r2
  {
    let getDesc = (level) => "r_2=3^{" + level + "}";
    let getInfo = (level) => "r_2=" + getR2(level).toString(0);
    r2 = theory.createUpgrade(5, currency, new ExponentialCost(1e125, Math.log2(1e8)));
    r2.getDescription = (_) => Utils.getMath(getDesc(r2.level));
    r2.getInfo = (amount) => Utils.getMathTo(getInfo(r2.level), getInfo(r2.level + amount));
  }
  // n1
  {
    let getDesc = (level) => "n_1=" + getN1(level).toString(0);
    let getInfo = (level) => "n_1=" + getN1(level).toString(0);
    n1 = theory.createUpgrade(6, currency, new ExponentialCost(1e4, Math.log2(5e4)));
    n1.getDescription = (_) => Utils.getMath(getDesc(n1.level));
    n1.getInfo = (amount) => Utils.getMathTo(getInfo(n1.level), getInfo(n1.level + amount));
    n1.bought = (_) => (updateN_flag = true);
  }
  // n2
  {
    let getDesc = (level) => "n_2=" + getN2(level).toString(0);
    let getInfo = (level) => "n_2=" + getN2(level).toString(0);
    n2 = theory.createUpgrade(7, currency, new ExponentialCost(1e205, Math.log2(4e3)));
    n2.getDescription = (_) => Utils.getMath(getDesc(n2.level));
    n2.getInfo = (amount) => Utils.getMathTo(getInfo(n2.level), getInfo(n2.level + amount));
    n2.bought = (_) => (updateN_flag = true);
  }
  // n3
  {
    let getDesc = (level) => "n_3=" + getN3(level).toString(0);
    let getInfo = (level) => "n_3=" + getN3(level).toString(0);
    n3 = theory.createUpgrade(8, currency, new ExponentialCost(1e280, Math.log2(1.5e3)));
    n3.getDescription = (_) => Utils.getMath(getDesc(n3.level));
    n3.getInfo = (amount) => Utils.getMathTo(getInfo(n3.level), getInfo(n3.level + amount));
    n3.bought = (_) => (updateN_flag = true);
  }
  // s
  {
    let getDesc = (level) => "s=" + getS(level).toString(2);
    let getInfo = (level) => "s=" + getS(level).toString(2);
    s = theory.createUpgrade(9, currency, new ExponentialCost(BigNumber.from("1e640"), Math.log2(8e1)));
    s.getDescription = (_) => Utils.getMath(getDesc(s.level));
    s.getInfo = (amount) => Utils.getMathTo(getInfo(s.level), getInfo(s.level + amount));
    s.bought = (_) => (updateN_flag = true);
  }

  /////////////////////
  // Permanent Upgrades
  theory.createPublicationUpgrade(0, currency, 1e8);
  theory.createBuyAllUpgrade(1, currency, 1e10);
  theory.createAutoBuyerUpgrade(2, currency, 1e15);

  ///////////////////////
  //// Milestone Upgrades
  theory.setMilestoneCost(new CustomCost((total) => BigNumber.from(getMilCustomCost(total))));
  function getMilCustomCost(lvl) {
    switch (lvl) {
      case 0:
        return 15 * 0.1;
      case 1:
        return 75 * 0.1;
      case 2:
        return 250 * 0.1;
      case 3:
        return 325 * 0.1;
      case 4:
        return 375 * 0.1;
      case 5:
        return 400 * 0.1;
      case 6:
        return 425 * 0.1;
      case 7:
        return 450 * 0.1;
      case 8:
        return 475 * 0.1;
      case 9:
        return 650 * 0.1;
      default:
        return 800 * 0.1;
    }
  }
  {
    tnexp = theory.createMilestoneUpgrade(0, 4);
    tnexp.description = Localization.getUpgradeIncCustomExpDesc("T_n", "0.5");
    tnexp.info = Localization.getUpgradeIncCustomExpInfo("T_n", "0.5");
    tnexp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
  }
  {
    fractalTerm = theory.createMilestoneUpgrade(1, 2);
    fractalTerm.getDescription = (_) => {
      if (fractalTerm.level === 0) {
        return "Add the Sierpinski Triangle fractal";
      }
      return "Add the Ulam-Warburton fractal";
    };
    fractalTerm.getInfo = (_) => {
      if (fractalTerm.level === 0) {
        return "Add the Sierpinski Triangle fractal";
      }
      return "Add the Ulam-Warburton fractal";
    };
    fractalTerm.boughtOrRefunded = (_) => {
      theory.invalidatePrimaryEquation();
      theory.invalidateTertiaryEquation();
      updateAvailability();
    };
    fractalTerm.canBeRefunded = () => unexp.level === 0;
  }
  {
    unexp = theory.createMilestoneUpgrade(2, 2);
    unexp.description = Localization.getUpgradeIncCustomExpDesc("U_n", "0.25");
    unexp.info = Localization.getUpgradeIncCustomExpInfo("U_n", "0.25");
    unexp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
  }
  {
    terms = theory.createMilestoneUpgrade(3, 3);
    terms.getDescription = (_) => {
      if (terms.level === 0) {
        return Localization.getUpgradeAddTermDesc("n_2");
      } else if (terms.level == 1) return Localization.getUpgradeAddTermDesc("n_3");
      return "$\\text{Adds term }s\\;\\;\\&\\;\\downarrow\\text{T_n exponent by 1.5}$";
    };
    terms.getInfo = (_) => {
      if (terms.level === 0) {
        return Localization.getUpgradeAddTermInfo("n_2");
      } else if (terms.level == 1) return Localization.getUpgradeAddTermInfo("n_3");
      return "$\\text{Adds the term }s\\;\\;\\&\\;\\downarrow\\text{T_n exponent by 1.5}$";
    };
    terms.boughtOrRefunded = (_) => {
      theory.invalidatePrimaryEquation();
      theory.invalidateSecondaryEquation();
      theory.invalidateTertiaryEquation();
      updateAvailability();
      updateN_flag = true;
    };
    terms.canBeRefunded = () => tnexp.level === 0 || terms.level === 3;
  }

  /////////////////
  //// Achievements
  //   achievement1 = theory.createAchievement(0, "Achievement 1", "Description 1", () => c1.level > 1);
  //   achievement2 = theory.createSecretAchievement(1, "Achievement 2", "Description 2", "Maybe you should buy two levels of c2?", () => c2.level > 1);

  //   ///////////////////
  //   //// Story chapters
  //   chapter1 = theory.createStoryChapter(0, "My First Chapter", "This is line 1,\nand this is line 2.\n\nNice.", () => c1.level > 0);
  //   chapter2 = theory.createStoryChapter(1, "My Second Chapter", "This is line 1 again,\nand this is line 2... again.\n\nNice again.", () => c2.level > 0);

  updateAvailability();
};

function T(n) {
  if (n === 0) return 0;
  let log2N = Math.log2(n);
  if (log2N % 1 === 0) return (2 ** (2 * log2N + 1) + 1) / 3;
  let i = n - 2 ** Math.floor(log2N);
  return T(2 ** Math.floor(log2N)) + 2 * T(i) + T(i + 1) - 1;
}
let un;
function u(n) {
  if (n < 2) return n;
  return 4 * 3 ** (wt(n - 1) - 1);
}
function wt(n) {
  let temp = 0;
  for (let k = 1; ; k++) {
    if (2 ** k > n) break;
    temp += Math.floor(n / 2 ** k);
  }
  return n - temp;
}
function U(n) {
  let p = n - (n % 100);
  let temp = prevSum > p ? U_n.toNumber() : un_precomputed[Math.floor(n / 100)];
  for (let i = prevSum > p ? prevSum + 1 : p + 1; i <= n; i++) temp += u(i);
  return temp;
}
function S(n) {
  return BigNumber.THREE.pow(n);
}

function updateN() {
  T_n = BigNumber.from(T(sum));
  S_n = S(sum);
  U_n = BigNumber.from(U(sum));
  maxUDN = maxUDN.max(U_n / T_n);
  un = u(sum);
}

var updateAvailability = () => {
  q1.isAvailable = fractalTerm.level > 0;
  q2.isAvailable = fractalTerm.level > 0;
  r1.isAvailable = fractalTerm.level > 1;
  r2.isAvailable = fractalTerm.level > 1;
  n2.isAvailable = terms.level > 0;
  n3.isAvailable = terms.level > 1;
  unexp.isAvailable = fractalTerm.level > 1;
  s.isAvailable = terms.level > 2;
  tnexp.isAvailable = terms.level > 1;
};

var tick = (elapsedTime, multiplier) => {
  let dt = BigNumber.from(elapsedTime * multiplier);
  let bonus = theory.publicationMultiplier;

  if (updateN_flag) {
    prevSum = sum;
    sum = 1 + getN1(n1.level) + (terms.level > 0 ? getN2(n2.level) : 0) + (terms.level > 1 ? getN3(n3.level) : 0);
    updateN();
    updateN_flag = false;
    theory.invalidateTertiaryEquation();
  }
  let A = BigNumber.TEN.pow(BigNumber.from(sum).log2().floor());

  let qdot = (getQ1(q1.level) * getQ2(q2.level) * S_n.log().pow(2 + (terms.level > 2 ? getS(s.level) : 0)) * currency.value.pow(0.1) * A) / BigNumber.HUNDRED;
  q += fractalTerm.level > 0 ? qdot * dt : 0;

  let rdot = (((getR1(r1.level) * getR2(r2.level) * U_n.pow(1.25 + unexp.level * 0.25)) / T_n) * A) / BigNumber.THOUSAND;
  r += fractalTerm.level > 1 ? rdot * dt : 0;

  rhodot = bonus * getC1(c1.level) * getC2(c2.level) * T_n.pow(1 + tnexp.level / 2 + (terms.level > 2 ? getS(s.level) - 1.5 : 0)) * A;
  rhodot *= fractalTerm.level > 0 ? q : 1;
  rhodot *= fractalTerm.level > 1 ? r * U_n : 1;

  currency.value += rhodot * dt;

  theory.invalidateTertiaryEquation();
};

var postPublish = () => {
  q = BigNumber.ONE;
  r = BigNumber.ONE;
  prevSum = 1;
  sum = 1;
  U_n = BigNumber.ONE;
  maxUDN = BigNumber.ONE;
  updateN_flag = true;
};
var getInternalState = () => `${q} ${r}`;

var setInternalState = (state) => {
  let values = state.split(" ");
  if (values.length > 0) q = parseBigNumber(values[0]);
  if (values.length > 1) r = parseBigNumber(values[1]);

  updateN_flag = true;
};

var getPrimaryEquation = () => {
  if (stage === 0) {
    theory.primaryEquationHeight = 240;
    theory.primaryEquationScale = 0.78;
    let result = "T_{2^k+i}\\left\\{ \\begin{array}{llll}\\frac{1}{3}(2^{2k+1}+1)  & \\text{if } i = 0,  \\\\ T_{2^k}+2T_i + T_{i+1}-1 & \\text{if } i = 1,..., 2^k - 1. \\end{array}\\right\\}\\\\\\\\ ";
    if (fractalTerm.level > 1) {
      result += "\\qquad\\qquad   u_0 = 0,\\;\\; u_1 = 1,\\;\\; u_n=4(3^{w_{n-1}-1}) \\\\\\ ";
      result += "\\qquad\\qquad\\qquad\\qquad w_n = n-\\sum_{k=1}^{\\infty}\\left\\lfloor\\frac{n}{2^k}\\right\\rfloor \\\\ ";
      result += "\\qquad\\qquad\\qquad\\qquad\\qquad U_n = \\sum_{i=0}^n u_i \\\\\\\\ ";
    }
    if (fractalTerm.level > 0) result += "\\qquad\\qquad\\qquad\\qquad\\qquad\\quad S_n = 3^n";
    return result;
  } else {
    theory.primaryEquationHeight = fractalTerm.level === 0 ? 60 : 110;
    theory.primaryEquationScale = fractalTerm.level === 0 ? 1 : 0.9;
    let result = `\\dot{\\rho} = c_1c_2`;
    result += "A";
    if (fractalTerm.level > 0) result += "q" + (fractalTerm.level > 1 ? "r" : "");
    result += `T_n^{${tnexp.level > 0 || terms.level > 2 ? (1 + tnexp.level / 2 - (terms.level > 2 ? 1.5 : 0)).toString() : ""}${terms.level > 2 ? "+s" : ""}}`;
    if (fractalTerm.level > 1) result += "U_n";
    if (fractalTerm.level > 0) result += `\\\\\\\\ \\dot{q} = q_1q_2A\\ln(S_n)^{2${terms.level > 2 ? "+s" : ""}}\\rho^{0.1}/100`;
    if (fractalTerm.level > 1) result += `\\\\\\\\ \\dot{r} = r_1r_2AU_n^{${1.25 + unexp.level * 0.25}}/(1000T_n)`;
    return result;
  }
};

var getSecondaryEquation = () => {
  if (stage === 0) return "";

  theory.secondaryEquationHeight = 60;
  let result = "\\begin{matrix}";
  result += "n = 1+n_1";
  if (terms.level > 0) result += "+n_2";
  if (terms.level > 1) result += "+n_3";
  result += "\\\\\\\\ A = 10^{\\lfloor log_2(n) \\rfloor}\\;\\;\\;\\;";
  result += theory.latexSymbol + "=\\max\\rho^{0.1}";
  result += "\\\\ {}\\end{matrix}";
  return result;
};
var getTertiaryEquation = () => {
  let result = "\\begin{matrix}";
  if (stage === 0) {
    result += "T_n=" + T_n.toString(0);
    if (fractalTerm.level > 1) result += ",&U_n=" + U_n.toString(0);
    if (fractalTerm.level > 0) result += ",&S_n=" + S_n.toString(0);
  } else {
    result += "n =" + BigNumber.from(sum).toString(0) + ",& ";

    if (fractalTerm.level > 0) result += "q=" + q.toString(2) + ",& ";
    if (fractalTerm.level > 1) result += "r=" + r.toString(2) + ",& ";

    result += "\\dot{\\rho} =" + rhodot.toString(2);
  }
  result += "\\\\ {}\\end{matrix}";
  return result;
};
var canGoToPreviousStage = () => stage === 1;
var goToPreviousStage = () => {
  stage--;
  theory.invalidatePrimaryEquation();
  theory.invalidateSecondaryEquation();
  theory.invalidateTertiaryEquation();
};
var canGoToNextStage = () => stage === 0;
var goToNextStage = () => {
  stage++;
  theory.invalidatePrimaryEquation();
  theory.invalidateSecondaryEquation();
  theory.invalidateTertiaryEquation();
};

var getPublicationMultiplier = (tau) => tau.pow(1.1) * BigNumber.TWO;
var getPublicationMultiplierFormula = (symbol) => "2" + symbol + "^{1.1}";
var getTau = () => currency.value.pow(0.1);
var getCurrencyFromTau = (tau) => [tau.max(BigNumber.ONE).pow(10), currency.symbol];
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();

let getStepP1Sum = (lvl, stepLength) => (((lvl - (lvl % stepLength)) / stepLength - 1) / 2 + 1) * (lvl - (lvl % stepLength)) + (lvl % stepLength) * Math.ceil(lvl / stepLength);

var getC1 = (level) => Utils.getStepwisePowerSum(level, 2, 20, 0);
var getC2 = (level) => BigNumber.TWO.pow(level);
var getQ1 = (level) => Utils.getStepwisePowerSum(level, 4, 10, 0);
var getQ2 = (level) => BigNumber.TWO.pow(level);
var getR1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getR2 = (level) => BigNumber.THREE.pow(level);
var getN1 = (level) => BigNumber.from(getStepP1Sum(level, 30));
var getN2 = (level) => BigNumber.from(getStepP1Sum(level, 20));
var getN3 = (level) => BigNumber.from(getStepP1Sum(level, 15));
var getS = (level) => BigNumber.from(1 + level * 0.01);

init();
