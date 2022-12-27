import { ExponentialCost, FreeCost, LinearCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber } from "./api/BigNumber";
import { theory, QuaternaryEntry } from "./api/Theory";
import { Utils } from "./api/Utils";

var id = "fractal_patterns";
var name = "Fractal Patterns";
var description =
  "A theory that takes advantage of the growth of the 3 fractal patterns:\n Toothpick Sequence (Tₙ),\n Sierpiński triangle (Sₙ),\n Ulam-Warburton cellular automaton (Uₙ).\n\n Big thanks to Gen (Gen#3006) and NGZ (NGZ001#3998) for all the help and suggestions with the LaTeX.";
var authors = "XLII#0042";
var version = 2.1;

var currency = BigNumber.ZERO;
var quaternaryEntries;
var rhodot = BigNumber.ZERO;
let qdot = BigNumber.ZERO;
let rdot = BigNumber.ZERO;
var q = BigNumber.ONE;
var r = BigNumber.ONE;
var t_cumulative = BigNumber.ZERO;
var A = BigNumber.ONE;
var tvar, c1, c2, q1, q2, r1, n1, n2, n3, s;
var tnexp, unexp, terms, fractalTerm, sterm, qexp;

var n = 1;
var prevN = 1;
var T_n = BigNumber.ONE;
var S_n = BigNumber.ONE;
var U_n = BigNumber.ONE;

var updateN_flag = true;
var adBoost = BigNumber.ONE;

//precomputed U_n every 100 generations until 20000 generations
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
//precomputed values of 2-U_n/T_n until 20000 n, which appear if n is a power of two
let approx = [
  1, 0.33333333333333326, 0.09090909090909083, 0.023255813953488413, 0.005847953216374213, 0.0014641288433381305, 0.00036616623947272053, 0.00009154994049254128, 0.000022888008972099527, 0.000005722034984501079,
  0.0000014305107924883487, 3.576278260197796e-7, 8.940696449855068e-8, 2.235174156872688e-8, 5.587935447692871e-9
];

var stage = 1;

var init = () => {
  currency = theory.createCurrency();
  quaternaryEntries = [];

  ///////////////////
  // Regular Upgrades
  // tvar
  {
    let getDesc = (level) => "\\dot{t}=" + getTdot(level).toString(1);
    tvar = theory.createUpgrade(0, currency, new ExponentialCost(1e4, Math.log2(1e4)));
    tvar.getDescription = (_) => Utils.getMath(getDesc(tvar.level));
    tvar.getInfo = (amount) => Utils.getMathTo(getDesc(tvar.level), getDesc(tvar.level + amount));
    tvar.maxLevel = 4;
  }
  // c1
  {
    let getDesc = (level) => "c_1=" + getC1(level).toString(0);
    c1 = theory.createUpgrade(1, currency, new FirstFreeCost(new ExponentialCost(2, Math.log2(1.4))));
    c1.getDescription = (_) => Utils.getMath(getDesc(c1.level));
    c1.getInfo = (amount) => Utils.getMathTo(getDesc(c1.level), getDesc(c1.level + amount));
  }

  // c2
  {
    let getDesc = (level) => "c_2=2^{" + level + "}";
    let getInfo = (level) => "c_2=" + getC2(level).toString(0);
    c2 = theory.createUpgrade(2, currency, new ExponentialCost(2e5, Math.log2(16.42)));
    c2.getDescription = (_) => Utils.getMath(getDesc(c2.level));
    c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level), getInfo(c2.level + amount));
  }
  // q1
  {
    let getDesc = (level) => "q_1=" + getQ1(level).toString(0);
    let getInfo = (level) => "q_1=" + getQ1(level).toString(0);
    q1 = theory.createUpgrade(3, currency, new FirstFreeCost(new ExponentialCost(1e32, Math.log2(12))));
    q1.getDescription = (_) => Utils.getMath(getDesc(q1.level));
    q1.getInfo = (amount) => Utils.getMathTo(getInfo(q1.level), getInfo(q1.level + amount));
  }
  // q2
  {
    let getDesc = (level) => "q_2=2^{" + level + "}";
    let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
    q2 = theory.createUpgrade(4, currency, new ExponentialCost(1e40, Math.log2(1e3)));
    q2.getDescription = (_) => Utils.getMath(getDesc(q2.level));
    q2.getInfo = (amount) => Utils.getMathTo(getInfo(q2.level), getInfo(q2.level + amount));
  }
  // r1
  {
    let getDesc = (level) => "r_1=" + getR1(level).toString(3);
    let getInfo = (level) => "r_1=" + getR1(level).toString(3);
    r1 = theory.createUpgrade(5, currency, new FirstFreeCost(new ExponentialCost(1e125, Math.log2(15))));
    r1.getDescription = (_) => Utils.getMath(getDesc(r1.level));
    r1.getInfo = (amount) => Utils.getMathTo(getInfo(r1.level), getInfo(r1.level + amount));
  }
  // n1
  {
    let getDesc = (level) => "n_1=" + getN1(level).toString(0);
    let getInfo = (level) => "n_1=" + getN1(level).toString(0);
    n1 = theory.createUpgrade(6, currency, new ExponentialCost(1e4, Math.log2(3e6)));
    n1.getDescription = (_) => Utils.getMath(getDesc(n1.level));
    n1.getInfo = (amount) => Utils.getMathTo(getInfo(n1.level), getInfo(n1.level + amount));
    n1.bought = (_) => (updateN_flag = true);
  }
  // n2
  {
    let getDesc = (level) => "n_2=" + getN2(level).toString(0);
    let getInfo = (level) => "n_2=" + getN2(level).toString(0);
    n2 = theory.createUpgrade(7, currency, new ExponentialCost(1e280, Math.log2(3e4)));
    n2.getDescription = (_) => Utils.getMath(getDesc(n2.level));
    n2.getInfo = (amount) => Utils.getMathTo(getInfo(n2.level), getInfo(n2.level + amount));
    n2.bought = (_) => (updateN_flag = true);
  }
  // n3
  {
    let getDesc = (level) => "n_3=" + getN3(level).toString(0);
    let getInfo = (level) => "n_3=" + getN3(level).toString(0);
    n3 = theory.createUpgrade(8, currency, new ExponentialCost(BigNumber.from("1e325"), Math.log2(1.8e4)));
    n3.getDescription = (_) => Utils.getMath(getDesc(n3.level));
    n3.getInfo = (amount) => Utils.getMathTo(getInfo(n3.level), getInfo(n3.level + amount));
    n3.bought = (_) => (updateN_flag = true);
  }
  // s
  {
    let getDesc = (level) => "s=" + getS(level).toString(2);
    let getInfo = (level) => "s=" + getS(level).toString(2);
    s = theory.createUpgrade(9, currency, new ExponentialCost(BigNumber.from("1e790"), Math.log2(1e30)));
    s.getDescription = (_) => Utils.getMath(getDesc(s.level));
    s.getInfo = (amount) => Utils.getMathTo(getInfo(s.level), getInfo(s.level + amount));
    s.bought = (_) => (updateN_flag = true);
  }

  /////////////////////
  // Permanent Upgrades
  theory.createPublicationUpgrade(0, currency, 1e9);
  theory.createBuyAllUpgrade(1, currency, 1e12);
  theory.createAutoBuyerUpgrade(2, currency, 1e15);

  ///////////////////////
  //// Milestone Upgrades
  theory.setMilestoneCost(new CustomCost((total) => BigNumber.from(getMilCustomCost(total))));
  function getMilCustomCost(lvl) {
    switch (lvl) {
      case 0:
        return 21 * 0.075;
      case 1:
        return 105 * 0.075;
      case 2:
        return 175 * 0.075;
      case 3:
        return 225 * 0.075;
      case 4:
        return 250 * 0.075;
      case 5:
        return 275 * 0.075;
      case 6:
        return 365 * 0.075;
      case 7:
        return 450 * 0.075;
      case 8:
        return 575 * 0.075;
      case 9:
        return 640 * 0.075;
      case 10:
        return 700 * 0.075;
      case 11:
        return 725 * 0.075;
      case 12:
        return 800 * 0.075;
      default:
        return 1460 * 0.075;
    }
  }
  {
    tnexp = theory.createMilestoneUpgrade(0, 4);
    tnexp.description = Localization.getUpgradeIncCustomExpDesc("T_n", "1");
    tnexp.info = Localization.getUpgradeIncCustomExpInfo("T_n", "1");
    tnexp.boughtOrRefunded = (_) => {
      updateAvailability();
      theory.invalidatePrimaryEquation();
    };
    tnexp.canBeRefunded = () => terms.level === 0;
  }
  {
    fractalTerm = theory.createMilestoneUpgrade(1, 2);
    fractalTerm.getDescription = (_) => {
      if (fractalTerm.level === 0) {
        return "Add the Ulam-Warburton fractal";
      }
      return "Add the Sierpinski Triangle fractal";
    };
    fractalTerm.getInfo = (_) => {
      if (fractalTerm.level === 0) {
        return "Add the Ulam-Warburton fractal";
      }
      return "Add the Sierpinski Triangle fractal";
    };
    fractalTerm.boughtOrRefunded = (_) => {
      theory.invalidatePrimaryEquation();
      theory.invalidateTertiaryEquation();
      updateAvailability();
      quaternaryEntries = [];
    };
    fractalTerm.canBeRefunded = () => unexp.level === 0;
  }
  {
    terms = theory.createMilestoneUpgrade(2, 2);
    terms.getDescription = (_) => {
      if (terms.level === 0) {
        return Localization.getUpgradeAddTermDesc("n_2");
      }
      return Localization.getUpgradeAddTermDesc("n_3");
    };
    terms.getInfo = (_) => {
      if (terms.level === 0) {
        return Localization.getUpgradeAddTermInfo("n_2");
      }
      return Localization.getUpgradeAddTermInfo("n_3");
    };
    terms.boughtOrRefunded = (_) => {
      theory.invalidatePrimaryEquation();
      theory.invalidateSecondaryEquation();
      theory.invalidateTertiaryEquation();
      updateAvailability();
      updateN_flag = true;
    };
    terms.canBeRefunded = (_) => unexp.level === 0;
  }
  {
    unexp = theory.createMilestoneUpgrade(3, 4);
    unexp.description = Localization.getUpgradeIncCustomExpDesc("U_n", "0.25");
    unexp.info = Localization.getUpgradeIncCustomExpInfo("U_n", "0.25");
    unexp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
    unexp.canBeRefunded = (_) => qexp.level === 0 && sterm.level === 0;
    unexp.boughtOrRefunded = (_) => {
      theory.invalidatePrimaryEquation();
      updateAvailability();
    };
  }
  {
    sterm = theory.createMilestoneUpgrade(4, 1);
    sterm.getDescription = () => "$\\text{Add the term }s\\;\\;\\&\\;\\downarrow T_n\\text{exponent by 2}$";
    sterm.getInfo = () => "$\\text{Add the term }s\\;\\;\\&\\;\\downarrow T_n\\text{exponent by 2}$";
    sterm.boughtOrRefunded = (_) => {
      updateAvailability();
      theory.invalidatePrimaryEquation();
    };
    sterm.canBeRefunded = (_) => qexp.level === 0;
  }
  {
    qexp = theory.createMilestoneUpgrade(5, 1);
    qexp.getDescription = () => "$\\dot{r} = r_1(T_nU_n)^{\\log(\\sqrt{2T_n})}S_{\\lfloor \\sqrt{n} \\rfloor}$";
    qexp.getInfo = () => "$(T_nU_n)\\text{ exponent: } \\log(n) \\rightarrow \\log(\\sqrt{2T_n})$";
    qexp.boughtOrRefunded = (_) => {
      theory.invalidatePrimaryEquation();
    };
  }

  updateAvailability();
};

function T(n) {
  if (n === 0) return 0;
  let log2N = Math.log2(n);
  if (log2N % 1 === 0) return (2 ** (2 * log2N + 1) + 1) / 3;
  let i = n - 2 ** Math.floor(log2N);
  return T(2 ** Math.floor(log2N)) + 2 * T(i) + T(i + 1) - 1;
}
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
  let temp = prevN > p ? U_n.toNumber() : un_precomputed[Math.floor(n / 100)];
  for (let i = prevN > p ? prevN + 1 : p + 1; i <= n; i++) temp += u(i);
  return temp;
}
function S(n) {
  return BigNumber.THREE.pow(n);
}
function t2pk(n) {
  let precomputed = [
    1, 3.000000000000001, 11.00000000000001, 42.99999999999992, 171.00000000000162, 683.0000000000389, 2731.0000000000005, 10922.999999999689, 43690.99999999998, 174763.00000063577, 699051.0000001589,
    2796203.0000000396, 11184811.00000001, 44739243.11111111, 178956970.66666666, 715827882.6666666
  ];
  if (n < 16) return BigNumber.from(precomputed[n]);
  return BigNumber.from(715827882.6666666) * BigNumber.FOUR.pow(n - 15);
}

function updateN() {
  T_n = BigNumber.from(T(n));
  S_n = S(Math.floor(Math.sqrt(n)));
  U_n = BigNumber.from(U(n));
}

var updateAvailability = () => {
  q1.isAvailable = fractalTerm.level > 0;
  q2.isAvailable = fractalTerm.level > 0;
  r1.isAvailable = fractalTerm.level > 1;
  n2.isAvailable = terms.level > 0;
  n3.isAvailable = terms.level > 1;
  s.isAvailable = sterm.level > 0;
  terms.isAvailable = tnexp.level === 4;
  unexp.isAvailable = fractalTerm.level > 1 && terms.level === 2;
  sterm.isAvailable = unexp.level === 4;
  qexp.isAvailable = sterm.level === 1;
};

var tick = (elapsedTime, multiplier) => {
  let dt = BigNumber.from(elapsedTime * multiplier);
  let bonus = theory.publicationMultiplier;
  adBoost = BigNumber.from(multiplier);

  if (c1.level === 0) return;
  if (updateN_flag && n < 20000) {
    prevN = n;
    //n is clamped at 20000 because of computation reasons. takes ~40k days to reach
    n = Math.min(20000, 1 + getN1(n1.level) + (terms.level > 0 ? getN2(n2.level) : 0) + (terms.level > 1 ? getN3(n3.level) : 0));
    updateN();
    updateN_flag = false;
    theory.invalidateTertiaryEquation();
  }
  t_cumulative += getTdot(tvar.level) * dt;

  A = fractalTerm.level > 0 ? t2pk(q2.level) : 1;

  qdot = (getQ1(q1.level) * A * T_n * U_n.pow(getUnexp(unexp.level) + (sterm.level > 0 ? getS(s.level).toNumber() : 0))) / BigNumber.THOUSAND;
  q += fractalTerm.level > 0 ? qdot * dt : 0;

  if (qexp.level === 0) rdot = getR1(r1.level) * (T_n * U_n).pow(BigNumber.from(Math.log10(n))) * S_n;
  else rdot = getR1(r1.level) * (T_n * U_n).pow(Math.log10(U_n * 2) / 2) * S_n;
  r += fractalTerm.level > 1 ? rdot * dt : 0;

  rhodot = bonus * getC1(c1.level) * getC2(c2.level) * T_n.pow(getTnexp(tnexp.level) + (sterm.level > 0 ? getS(s.level).toNumber() - 2 : 0)) * t_cumulative;
  rhodot *= fractalTerm.level > 0 ? q : 1;
  rhodot *= fractalTerm.level > 1 ? r : 1;

  currency.value += rhodot * dt;

  theory.invalidateTertiaryEquation();
  theory.invalidateQuaternaryValues();
};

var postPublish = () => {
  q = BigNumber.ONE;
  r = BigNumber.ONE;
  rhodot = BigNumber.ZERO;
  qdot = BigNumber.ZERO;
  rdot = BigNumber.ZERO;
  t_cumulative = BigNumber.ZERO;
  prevN = 1;
  n = 1;
  U_n = BigNumber.ONE;
  maxUDN = BigNumber.ONE;
  updateN_flag = true;
  A = BigNumber.ONE;
  theory.invalidateTertiaryEquation();
  theory.invalidateQuaternaryValues();
};
var getInternalState = () => `${q} ${r} ${t_cumulative}`;

var setInternalState = (state) => {
  let values = state.split(" ");
  if (values.length > 0) q = parseBigNumber(values[0]);
  if (values.length > 1) r = parseBigNumber(values[1]);
  if (values.length > 2) t_cumulative = parseBigNumber(values[2]);

  updateN_flag = true;
};

var getPrimaryEquation = () => {
  if (stage === 0) {
    theory.primaryEquationHeight = 150;
    theory.primaryEquationScale = 0.65;
    let result = "T_{2^k+i}=\\begin{cases}\\frac{2^{2k+1}+1}{3},  & \\text{if } i = 0,  \\\\ T_{2^k}+2T_i + T_{i+1}-1, & \\text{if } 1 < i \\leq 2^k \\end{cases}\\\\";
    if (fractalTerm.level > 0) {
      result += "u_0 = 0,\\ u_1 = 1,\\ \\dots,\\ u_n=4(3^{w_{n-1}-1})\\\\";
      result += "w_n = n-\\sum_{k=1}^{\\infty}\\left\\lfloor\\frac{n}{2^k}\\right\\rfloor \\\\";
      result += "U_n = \\sum_{i=0}^n u_i";
    }
    if (fractalTerm.level > 1) result += ", \\qquad S_n = 3^n";
    return result;
  } else {
    theory.primaryEquationHeight = fractalTerm.level === 0 ? 60 : 110;
    theory.primaryEquationScale = fractalTerm.level === 0 ? 1 : 0.9;
    let result = `\\dot{\\rho} = c_1c_2`;
    if (fractalTerm.level > 0) result += "q" + (fractalTerm.level > 1 ? "r" : "");
    result += "t";
    let TnexpIsInt = (getTnexp(tnexp.level) - (sterm.level > 0 ? 3 : 0)).toNumber() % 1 < 0.0001;
    result += `T_n^{${(getTnexp(tnexp.level) - (sterm.level > 0 ? 3 : 0)).toString(TnexpIsInt ? 0 : 1) + (sterm.level > 0 ? "+s" : "")}}`;
    if (fractalTerm.level > 0) result += `\\\\\\\\ \\dot{q} = q_1AT_nU_n^{${getUnexp(unexp.level).toString(0) + (sterm.level > 0 ? "+s" : "")}}/1000`;
    if (fractalTerm.level > 1) {
      if (qexp.level === 0) result += `\\\\\\\\ \\dot{r} = r_1(T_nU_n)^{\\log(n)}S_{\\lfloor \\sqrt{n} \\rfloor}`;
      // else result += `\\\\\\\\ \\dot{r} = r_1(T_nU_n)^{\\frac{\\log(2T_n)}{2}}S_{\\lfloor \\sqrt{n} \\rfloor}`;
      else result += `\\\\\\\\ \\dot{r} = r_1(T_nU_n)^{\\log(\\sqrt{2T_n})}S_{\\lfloor \\sqrt{n} \\rfloor}`;
    }
    return result;
  }
};

var getSecondaryEquation = () => {
  if (stage === 0) return "";
  theory.secondaryEquationHeight = 60;
  theory.secondaryEquationScale = 0.85;
  let result = "\\begin{matrix}";
  result += "n = 1+n_1";
  if (terms.level > 0) {
    result += "+n_2";
    theory.secondaryEquationScale = 0.93;
  }
  if (terms.level > 1) {
    result += "+n_3";
    theory.secondaryEquationScale = 0.83;
  }
  if (fractalTerm.level > 0) result += `,& A = (2-U_{q_2}/T_{q_2})^{-1}`;
  result += "\\\\ {}\\end{matrix}";
  return result;
};
var getTertiaryEquation = () => {
  let result = "\\begin{matrix}";
  if (stage === 0) {
    result += "T_n=" + T_n.toString(0);
    if (fractalTerm.level > 0) result += ",&U_n=" + U_n.toString(0);
    if (fractalTerm.level > 1) result += "\\\\\\\\ S_{\\lfloor \\sqrt{n} \\rfloor}=" + S_n.toString(0);
  } else {
    result += theory.latexSymbol + "=\\max\\rho^{0.075}";
  }
  result += "\\\\ {}\\end{matrix}";
  return result;
};
var getQuaternaryEntries = () => {
  // log(JSON.stringify(quaternaryEntries))
  if (quaternaryEntries.length == 0) {
    quaternaryEntries.push(new QuaternaryEntry("n", null));
    if (stage === 0) {
      if (fractalTerm.level > 0) quaternaryEntries.push(new QuaternaryEntry("\\dot{q}", null));
      if (fractalTerm.level > 1) quaternaryEntries.push(new QuaternaryEntry("\\dot{r}", null));
      quaternaryEntries.push(new QuaternaryEntry("\\dot{\\rho}", null));
    } else {
      quaternaryEntries.push(new QuaternaryEntry("t", null));
      if (fractalTerm.level > 0) quaternaryEntries.push(new QuaternaryEntry("q", null));
      if (fractalTerm.level > 1) quaternaryEntries.push(new QuaternaryEntry("r", null));
      if (fractalTerm.level > 0) quaternaryEntries.push(new QuaternaryEntry("A", null));
    }
  }

  quaternaryEntries[0].value = BigNumber.from(n).toString(0);
  if (stage === 0) {
    if (fractalTerm.level > 0) quaternaryEntries[1].value = (adBoost * qdot).toString(2);
    if (fractalTerm.level > 1) quaternaryEntries[2].value = (adBoost * rdot).toString(2);
    quaternaryEntries[fractalTerm.level + 1].value = (adBoost * rhodot).toString(2);
  } else {
    quaternaryEntries[1].value = t_cumulative.toString(2);
    if (fractalTerm.level > 0) quaternaryEntries[2].value = q.toString(2);
    if (fractalTerm.level > 1) quaternaryEntries[3].value = r.toString(2);
    if (fractalTerm.level > 0) quaternaryEntries[fractalTerm.level > 1 ? 4 : 3].value = A.toString(2);
  }

  return quaternaryEntries;
};
var canGoToPreviousStage = () => stage === 1;
var goToPreviousStage = () => {
  stage--;
  theory.invalidatePrimaryEquation();
  theory.invalidateSecondaryEquation();
  theory.invalidateTertiaryEquation();
  quaternaryEntries = [];
  theory.invalidateQuaternaryValues();
};
var canGoToNextStage = () => stage === 0;
var goToNextStage = () => {
  stage++;
  theory.invalidatePrimaryEquation();
  theory.invalidateSecondaryEquation();
  theory.invalidateTertiaryEquation();
  quaternaryEntries = [];
  theory.invalidateQuaternaryValues();
};

var getPublicationMultiplier = (tau) => tau.pow(1.324) * BigNumber.FIVE;
var getPublicationMultiplierFormula = (symbol) => "5" + symbol + "^{1.324}";
var getTau = () => currency.value.pow(0.075);
var getCurrencyFromTau = (tau) => [tau.max(BigNumber.ONE).pow(1 / 0.075), currency.symbol];
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();

let getStepP1Sum = (lvl, stepLength) => (((lvl - (lvl % stepLength)) / stepLength - 1) / 2 + 1) * (lvl - (lvl % stepLength)) + (lvl % stepLength) * Math.ceil(lvl / stepLength);

var getTdot = (level) => BigNumber.from(0.2 + level / 5);
var getC1 = (level) => Utils.getStepwisePowerSum(level, 150, 100, 0);
var getC2 = (level) => BigNumber.TWO.pow(level);
var getQ1 = (level) => Utils.getStepwisePowerSum(level, 10, 10, 0);
var getQ2 = (level) => BigNumber.TWO.pow(level);
var getR1 = (level) => (level === 0 ? BigNumber.ZERO : Utils.getStepwisePowerSum(level, 2, 4, 0) / BigNumber.from(1 + 1000 / level ** 2));
var getN1 = (level) => BigNumber.from(getStepP1Sum(level, 40));
var getN2 = (level) => BigNumber.from(getStepP1Sum(level, 35));
var getN3 = (level) => BigNumber.from(getStepP1Sum(level, 30));
var getS = (level) => {
  if (level < 28) return BigNumber.from(1 + level * 0.15);
  if (level < 36) return BigNumber.from(getS(27).toNumber() + 0.15 + (level - 28) * 0.2);
  return BigNumber.from(getS(35).toNumber() + 0.2 + (level - 36) * 0.15);
};
var getUnexp = (level) => BigNumber.from(5 + level / 4);
var getTnexp = (level) => BigNumber.from(3 + level);

init();
