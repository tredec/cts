import { ExponentialCost, FreeCost, LinearCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber } from "./api/BigNumber";
import { theory } from "./api/Theory";
import { Utils } from "./api/Utils";

var id = "my_custom_theory_id";
var name = "Fractal Patterns";
var description = "A basic theory.";
var authors = "Gilles-Philippe Paillé";
var version = 1;

var currency = BigNumber.ZERO;
var rhodot = BigNumber.ZERO;
var q = BigNumber.ONE;
var c1, c2, q1, n1;
var c1Exp, rTnExp, fractalTerm;

var sum = 1;
var T_n = BigNumber.ONE;
var S_n = BigNumber.ONE;

var updateN_flag = true;

var init = () => {
  currency = theory.createCurrency();

  ///////////////////
  // Regular Upgrades

  // c1
  {
    let getDesc = (level) => "c_1=" + getC1(level).toString(0);
    c1 = theory.createUpgrade(0, currency, new FirstFreeCost(new ExponentialCost(15, Math.log2(1.4))));
    c1.getDescription = (_) => Utils.getMath(getDesc(c1.level));
    c1.getInfo = (amount) => Utils.getMathTo(getDesc(c1.level), getDesc(c1.level + amount));
  }

  // c2
  {
    let getDesc = (level) => "c_2=2^{" + level + "}";
    let getInfo = (level) => "c_2=" + getC2(level).toString(0);
    c2 = theory.createUpgrade(1, currency, new ExponentialCost(5, Math.log2(8)));
    c2.getDescription = (_) => Utils.getMath(getDesc(c2.level));
    c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level), getInfo(c2.level + amount));
  }
  // q1
  {
    let getDesc = (level) => "q_1=" + getQ1(level).toString(0);
    let getInfo = (level) => "q_1=" + getQ1(level).toString(0);
    q1 = theory.createUpgrade(2, currency, new ExponentialCost(1e30, Math.log2(50)));
    q1.getDescription = (_) => Utils.getMath(getDesc(q1.level));
    q1.getInfo = (amount) => Utils.getMathTo(getInfo(q1.level), getInfo(q1.level + amount));
  }
  // n1
  {
    let getDesc = (level) => "n_1=" + getN1(level).toString(0);
    let getInfo = (level) => "n_1=" + getN1(level).toString(0);
    n1 = theory.createUpgrade(3, currency, new ExponentialCost(200, Math.log2(50000)));
    n1.getDescription = (_) => Utils.getMath(getDesc(n1.level));
    n1.getInfo = (amount) => Utils.getMathTo(getInfo(n1.level), getInfo(n1.level + amount));
    n1.bought = (_) => (updateN_flag = true);
  }

  /////////////////////
  // Permanent Upgrades
  theory.createPublicationUpgrade(0, currency, 1e10);
  theory.createBuyAllUpgrade(1, currency, 1);
  theory.createAutoBuyerUpgrade(2, currency, 1);

  ///////////////////////
  //// Milestone Upgrades
  theory.setMilestoneCost(new LinearCost(2.5, 2.5));

  {
    c1Exp = theory.createMilestoneUpgrade(0, 3);
    c1Exp.description = Localization.getUpgradeIncCustomExpDesc("c_1", "0.05");
    c1Exp.info = Localization.getUpgradeIncCustomExpInfo("c_1", "0.05");
    c1Exp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
  }

  {
    rTnExp = theory.createMilestoneUpgrade(1, 2);
    rTnExp.description = Localization.getUpgradeIncCustomExpDesc("T_n", "0.5");
    rTnExp.info = Localization.getUpgradeIncCustomExpInfo("T_n", "0.5");
    rTnExp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
  }
  {
    fractalTerm = theory.createMilestoneUpgrade(2, 2);
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
    };
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
function u(n) {
  if (n < 2) return n;
  return 4 * 3 ** (wt(n - 1) - 1);
}
function wt(n) {
  let sum = 0;
  for (let k = 1; ; k++) {
    if (2 ** k > n) break;
    sum += Math.floor(n / 2 ** k);
  }
  return n - sum;
}
function U(n) {
  let sum = 0;
  for (let i = 0; i <= n; i++) sum += u(i);
  return sum;
}
function S(n) {
  return 3 ** n;
}

function updateN() {
  T_n = BigNumber.from(T(sum));
  S_n = BigNumber.from(S(sum));
}

var updateAvailability = () => {
  q1.isAvailable = fractalTerm.level > 0;
};

var tick = (elapsedTime, multiplier) => {
  let dt = BigNumber.from(elapsedTime * multiplier);
  let bonus = theory.publicationMultiplier;

  if (updateN_flag) {
    sum = 1 + getN1(n1.level);
    updateN();
    updateN_flag = false;
    theory.invalidateTertiaryEquation();
  }
  q += fractalTerm.level > 0 ? getQ1(q1.level) * (S_n / T_n) * currency.value.pow(0.05) : 0;

  rhodot = dt * bonus * getC1(c1.level).pow(getC1Exponent(c1Exp.level)) * getC2(c2.level) * T_n.pow(2 + rTnExp.level / 2) * BigNumber.FIVE.pow(BigNumber.from(sum).log2().floor());
  rhodot *= fractalTerm.level > 0 ? q : 1;

  currency.value += rhodot;

  theory.invalidateTertiaryEquation();
};

var postPublish = () => {
  updateN_flag = true;
  q = BigNumber.ONE;
};
var getInternalState = () => `${q} `;

var setInternalState = (state) => {
  let values = state.split(" ");
  if (values.length > 0) q = parseBigNumber(values[0]);
  updateN_flag = true;
};

var getPrimaryEquation = () => {
  theory.primaryEquationHeight = 70;
  let result = `\\dot{\\rho} = c_1^{${c1Exp.level === 0 ? "" : getC1Exponent(c1Exp.level).toString(2)}}c_2`;
  result += `5^{\\lfloor log_2(n) \\rfloor}T_n^{${(2 + rTnExp.level / 2).toString()}}`;
  if (fractalTerm.level === 1) result += "q\\\\\\";
  if (fractalTerm.level === 1) result += " \\qquad \\dot{q} = q_1\\frac{S_n}{T_n}\\rho^{0.05}";
  return result;
};

var getSecondaryEquation = () => {
  let result = "\\begin{matrix}";
  result += "n = 1+n_1 ,&";
  result += theory.latexSymbol + "=\\max\\rho^{0.1}";
  result += "\\\\ {}\\end{matrix}";
  return result;
};
var getTertiaryEquation = () => {
  let result = "\\begin{matrix}";
  result += "n =" + sum.toString(0) + ",& ";

  if (fractalTerm.level > 0) result += "q=" + q.toString(2) + ",& ";
  result += "\\dot{\\rho} =" + rhodot.toString(2) + ",&";

  result += "\\\\ {}\\end{matrix}";
  return result;
};
var getPublicationMultiplier = (tau) => tau.pow(0.9) / BigNumber.TEN;
var getPublicationMultiplierFormula = (symbol) => "\\frac{{" + symbol + "}^{0.9}}{10}";
var getTau = () => currency.value.pow(0.1);
var getCurrencyFromTau = (tau) => [tau.max(BigNumber.ONE).pow(10), currency.symbol];
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();

let getStepP1Sum = (lvl, stepLength) => (((lvl - (lvl % stepLength)) / stepLength - 1) / 2 + 1) * (lvl - (lvl % stepLength)) + (lvl % stepLength) * Math.ceil(lvl / stepLength);

var getC1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC2 = (level) => BigNumber.TWO.pow(level);
var getQ1 = (level) => Utils.getStepwisePowerSum(level, 4, 10, 1);
var getN1 = (level) => BigNumber.from(getStepP1Sum(level, 10));
var getC1Exponent = (level) => BigNumber.from(1 + 0.05 * level);

init();
