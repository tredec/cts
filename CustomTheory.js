import { ExponentialCost, FreeCost, LinearCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber } from "./api/BigNumber";
import { theory } from "./api/Theory";
import { Utils } from "./api/Utils";

var id = "my_custom_theory_id";
var name = "Toothpick Theory";
var description = "A basic theory.";
var authors = "Gilles-Philippe Paillé";
var version = 1;

var currency;
var q = BigNumber.ONE;
var q1, q2, q3, c1, c2, c3;
var q1exp, c2term, c3term, q3term, diffterm, qexp;
var sum = BigNumber.ZERO;
var maxDiff = 0;

var rhoBoost = BigNumber.ONE;
var qdot = BigNumber.ZERO;

var updateT_flag = false;

var achievement1, achievement2;
var chapter1, chapter2;

var init = () => {
  currency = theory.createCurrency();
  currency.value = BigNumber.from(1.01e50)

  ///////////////////
  // Regular Upgrades

  // q1
  {
    let getDesc = (level) => "q_1=" + getQ1(level).toString(0);
    q1 = theory.createUpgrade(0, currency, new FirstFreeCost(new ExponentialCost(5, Math.log2(1.5))));
    q1.getDescription = (_) => Utils.getMath(getDesc(q1.level));
    q1.getInfo = (amount) => Utils.getMathTo(getDesc(q1.level), getDesc(q1.level + amount));
  }

  // q2
  {
    let getDesc = (level) => "q_2=2^{" + level + "}";
    let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
    q2 = theory.createUpgrade(1, currency, new ExponentialCost(75, Math.log2(3.15)));
    q2.getDescription = (_) => Utils.getMath(getDesc(q2.level));
    q2.getInfo = (amount) => Utils.getMathTo(getInfo(q2.level), getInfo(q2.level + amount));
  }
  // q3
  {
    let getDesc = (level) => "q_3=" + getQ3(level).toString(0);
    let getInfo = (level) => "q_3=" + getQ3(level).toString(0);
    q3 = theory.createUpgrade(2, currency, new ExponentialCost(1e190, Math.log2(275)));
    q3.getDescription = (_) => Utils.getMath(getDesc(q3.level));
    q3.getInfo = (amount) => Utils.getMathTo(getInfo(q3.level), getInfo(q3.level + amount));
  }

  // c1
  {
    let getDesc = (level) => "c_1=" + getC1(level).toString(0);
    let getInfo = (level) => "c_1=" + getC1(level).toString(0);
    c1 = theory.createUpgrade(3, currency, new FirstFreeCost(new ExponentialCost(1e-2, Math.log2(3e7))));
    c1.getDescription = (_) => Utils.getMath(getDesc(c1.level));
    c1.getInfo = (amount) => Utils.getMathTo(getInfo(c1.level), getInfo(c1.level + amount));
    c1.maxLevel = 40;
    c1.bought = (_) => (updateT_flag = true);
  }

  // c2
  {
    let getDesc = (level) => "c_2=" + getC2(level).toString(0);
    let getInfo = (level) => "c_2=" + getC2(level).toString(0);
    c2 = theory.createUpgrade(4, currency, new ExponentialCost(1e90, Math.log2(1e6)));
    c2.getDescription = (_) => Utils.getMath(getDesc(c2.level));
    c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level), getInfo(c2.level + amount));
    c2.bought = (_) => (updateT_flag = true);
  }
  // c3
  {
    let getDesc = (level) => "c_3=" + level.toString();
    let getInfo = (level) => "c_3=" + level.toString();
    c3 = theory.createUpgrade(5, currency, new ExponentialCost(1e65, Math.log2(700)));
    c3.getDescription = (_) => Utils.getMath(getDesc(c3.level));
    c3.getInfo = (amount) => Utils.getMathTo(getInfo(c3.level), getInfo(c3.level + amount));
    c3.bought = (_) => (updateT_flag = true);
  }

  /////////////////////
  // Permanent Upgrades
  theory.createPublicationUpgrade(0, currency, 1e11);
  theory.createBuyAllUpgrade(1, currency, 1e15);
  theory.createAutoBuyerUpgrade(2, currency, 1e20);

  ///////////////////////
  //// Milestone Upgrades
  theory.setMilestoneCost(new CustomCost((total) => BigNumber.from(getMilCustomCost(total))));

  {
    q1exp = theory.createMilestoneUpgrade(0, 3);
    q1exp.description = Localization.getUpgradeIncCustomExpDesc("q_1", "0.02");
    q1exp.info = Localization.getUpgradeIncCustomExpInfo("q_1", "0.02");
    q1exp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
  }
  {
    c2term = theory.createMilestoneUpgrade(1, 1);
    c2term.description = Localization.getUpgradeAddTermDesc("c_2");
    c2term.info = Localization.getUpgradeAddTermInfo("c_2");
    c2term.boughtOrRefunded = (_) => updateAvailability();
  }
  {
    c3term = theory.createMilestoneUpgrade(2, 1);
    c3term.description = Localization.getUpgradeAddTermDesc("c_3");
    c3term.info = Localization.getUpgradeAddTermInfo("c_3");
    c3term.boughtOrRefunded = (_) => updateAvailability();
  }
  {
    q3term = theory.createMilestoneUpgrade(3, 1);
    q3term.description = Localization.getUpgradeAddTermDesc("q_3");
    q3term.info = Localization.getUpgradeAddTermInfo("q_3");
    q3term.boughtOrRefunded = (_) => updateAvailability();
  }
  {
    diffterm = theory.createMilestoneUpgrade(4, 2);
    diffterm.getDescription = (_) => (diffterm.level < 1 ? "$\\text{Multiply A by T_n - T_{n-1}}$" : "$\\text{T_n-T_{n-1}} \\rightarrow \\max \\text{(T_n-T_{n-1})}$");
    diffterm.getInfo = (_) => (diffterm.level < 1 ? "$\\text{Multiply A by T_n - T_{n-1}}$" : "$\\text{T_n-T_{n-1}} \\rightarrow \\max \\text{(T_n-T_{n-1})}$");
    diffterm.boughtOrRefunded = (_) => {
      updateAvailability();
      theory.invalidatePrimaryEquation();
    };
  }
  {
    qexp = theory.createMilestoneUpgrade(5, 4);
    qexp.description = Localization.getUpgradeIncCustomExpDesc("q", "0.01");
    qexp.info = Localization.getUpgradeIncCustomExpInfo("q", "0.01");
    qexp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
  }

  function getMilCustomCost(lvl) {
    switch (lvl) {
      case 0:
        return 50 * 0.1;
      case 1:
        return 140 * 0.1;
      case 2:
        return 175 * 0.1;
      case 3:
        return 190 * 0.1;
      case 4:
        return 250 * 0.1;
      case 5:
        return 325 * 0.1;
      case 6:
        return 375 * 0.1;
      case 7:
        return 425 * 0.1;
      case 8:
        return 1000 * 0.1;
      case 9:
        return 1125 * 0.1;
      case 10:
        return 1200 * 0.1;
      default:
        return 1400 * 0.1;
    }
  }

  //   /////////////////
  //   //// Achievements
  //   achievement1 = theory.createAchievement(0, "Achievement 1", "Description 1", () => q1.level > 1);
  //   achievement2 = theory.createSecretAchievement(1, "Achievement 2", "Description 2", "Maybe you should buy two levels of q2?", () => q2.level > 1);

  //   ///////////////////
  //   //// Story chapters
  //   chapter1 = theory.createStoryChapter(0, "My First Chapter", "This is line 1,\nand this is line 2.\n\nNice.", () => q1.level > 0);
  //   chapter2 = theory.createStoryChapter(1, "My Second Chapter", "This is line 1 again,\nand this is line 2... again.\n\nNice again.", () => q2.level > 0);

  updateAvailability();
};

var updateAvailability = () => {
  c2.isAvailable = c2term.level > 0;
  c3.isAvailable = c3term.level > 0;
  q3.isAvailable = q3term.level > 0;
};

var tick = (elapsedTime, multiplier) => {
  let dt = BigNumber.from(elapsedTime * multiplier);
  let bonus = theory.publicationMultiplier;

  if (updateT_flag) {
    //put failsafe for milestone
    sum = getC1(c1.level) + getC2(c2.level) + getC3(c3.level);
    updateT();
    updateT_flag = false;
  }

  let vq1 = getQ1(q1.level);

  q += dt * qdot;

  currency.value += dt * bonus * vq1.pow(getQ1Exp(q1exp.level)) * getQ2(q2.level) * rhoBoost * q.pow(getQExp(qexp.level));
  theory.invalidateTertiaryEquation();
};

var getPrimaryEquation = () => {
  theory.primaryEquationHeight = 90;
  let result = "\\dot{\\rho} = q_1";

  if (q1exp.level == 1) result += "^{1.02}";
  if (q1exp.level == 2) result += "^{1.04}";
  if (q1exp.level == 3) result += "^{1.06}";

  result += "q_2";

  result += "10^{\\lfloor log_2(n-1) \\rfloor}T_n \\\\\\ ";

  if (diffterm.level > 0) {
    result += "\\dot{q} = ";
    if (diffterm.level === 1) result += "frac{T_n - T_{n-1}}{10}";
    if (diffterm.level === 2) result += "frac{\\max(T_n - T_{n-1})}{10}";
    if (q3term.level > 0) result += "\\min(5000, sum)^{q_3}";
  }

  // result += "A\\\\\\\\";
  // if (diffterm.level === 0) result += "A = \\frac{500^{\\lfloor log_2(n-1) \\rfloor}T_n^{2.5}}{10}";
  // else if (diffterm.level === 1) result += "A = \\frac{500^{\\lfloor log_2(n-1) \\rfloor}T_n^{2.5}(T_n-T_{n-1})}{10}";
  // else if (diffterm.level === 2) result += "A = \\frac{500^{\\lfloor log_2(n-1) \\rfloor}T_n^{2.5}\\max(T_n-T_{n-1})}{10}";

  return result;
};
var getSecondaryEquation = () => {
  let result = "\\begin{matrix}";

  result += theory.latexSymbol + "= \\max\\rho^{0.1}";

  result += "\\end{matrix}";
  return result;
};
var getTertiaryEquation = () => {
  let result = "\\begin{matrix}";

  result += `n = \\sum_{i=1}^{${c3term.level > 0 ? 3 : 2}} c_i ,& `;
  result += "n = ";
  result += sum.toString(0);

  result += ",&10^{\\lfloor log_2(n-1) \\rfloor}T_n = ";
  result += rhoBoost.toString();

  result += "\\\\ {}\\end{matrix}";
  return result;
};
function updateT() {
  if (sum < BigNumber.TWO) {
    rhoBoost = sum;
    return;
  }
  let t_n = T(sum);
  let t_nm1 = T(sum - 1);
  maxDiff = Math.max(t_n - t_nm1, maxDiff);

  rhoBoost = BigNumber.TEN.pow(BigNumber.from(Math.floor(Math.log2(sum - 1)))) * BigNumber.from(t_n);

  if (diffterm === 1) qdot = BigNumber.from(t_n - t_nm1) / BigNumber.TEN;
  else if (diffterm === 2) qdot = BigNumber.from(maxDiff) / BigNumber.TEN;
  else qdot = BigNumber.ZERO;

  qdot *= BigNumber.from(Math.min(5000, sum)).pow(BigNumber.from(q3term > 0 ? q3.level * 0.05 : 0));
}
function T(n) {
  if (n === 1) return 0;
  let log2N = Math.log2(n);
  if (log2N % 1 === 0) return (2 ** (2 * log2N + 1) + 1) / 3;
  let i = n - 2 ** Math.floor(log2N);
  return T(2 ** Math.floor(log2N)) + 2 * T(i) + T(i + 1) - 1;
}

var getPublicationMultiplier = (tau) => tau.pow(1.245) / BigNumber.from(20);
var getPublicationMultiplierFormula = (symbol) => "\\frac{{" + symbol + "}^{1.245}}{20}";
var getTau = () => currency.value.pow(0.1);
var getCurrencyFromTau = (tau) => [tau.max(BigNumber.ONE).pow(10), currency.symbol];
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();

let getVarVal = (lvl, stepLength) => (((lvl - (lvl % stepLength)) / stepLength - 1) / 2 + 1) * (lvl - (lvl % stepLength)) + (lvl % stepLength) * Math.ceil(lvl / stepLength);

var getQ1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getQ2 = (level) => BigNumber.TWO.pow(level);
var getQ3 = (level) => level * BigNumber.from(0.05);
var getC1 = (level) => Utils.getStepwisePowerSum(level, 5, 10, 0);
var getC2 = (level) => BigNumber.from(getVarVal(level, 15));
var getC3 = (level) => BigNumber.from(getVarVal(level, 20));
var getQ1Exp = (level) => BigNumber.from(1 + 0.02 * level);
var getQExp = (level) => BigNumber.from(1 + 0.01 * level);

init();
