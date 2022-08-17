import { CompositeCost, CustomCost, ExponentialCost, FirstFreeCost, LinearCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { parseBigNumber, BigNumber } from "./api/BigNumber";
import { theory } from "./api/Theory";
import { Utils } from "./api/Utils";

var id = "permutations_and_derangements";
var name = "Permutations & Derangements";
var description = "A theory about the possible arrangements and derangments of objects";
var authors = "Gen (Gen#3006)";
var version = 1.0;
var releaseOrder = "1";

var rho_dot;
var q1 = BigNumber.ZERO;
var q2 = BigNumber.ZERO;
var n = BigNumber.ZERO;
var updateObject_flag = false;

var c1, A, B, C, D;
var c1Exp;

//TODO
//More milestones ??
//Balance


//n = sum of objects

var init = () => {
    currency = theory.createCurrency();

    ///////////////////
    // Regular Upgrades
    
    // c1
    {
        let getDesc = (level) => "c_1=" + getC1(level).toString(0);
        let getInfo = (level) => "c_1=" + getC1(level).toString(0);
        c1 = theory.createUpgrade(0, currency, new FirstFreeCost(new ExponentialCost(1, Math.log2(1.2))));
        c1.getDescription = (amount) => Utils.getMath(getDesc(c1.level));
        c1.getInfo = (amount) => Utils.getMathTo(getInfo(c1.level), getInfo(c1.level + amount));
    }
    
    // A
    {
        let getDesc = (level) => "A=" + getA(level).toString(0);
        let getInfo = (level) => "A=" + getA(level).toString(0);
        A = theory.createUpgrade(1, currency, new ExponentialCost(1000, Math.log2(1.1)));
        A.getDescription = (amount) => Utils.getMath(getDesc(A.level));
        A.getInfo = (amount) => Utils.getMathTo(getInfo(A.level), getInfo(A.level + amount));
        A.bought = (_) => updateObject_flag = true;
    }
    
    // B
    {
        let getDesc = (level) => "B=" + getB(level).toString(0);
        let getInfo = (level) => "B=" + getB(level).toString(0);
        B = theory.createUpgrade(2, currency, new ExponentialCost(10000, Math.log2(1.1)));
        B.getDescription = (amount) => Utils.getMath(getDesc(B.level));
        B.getInfo = (amount) => Utils.getMathTo(getInfo(B.level), getInfo(B.level + amount));
        B.bought = (_) => updateObject_flag = true;
    }
    
    // C
    {
        let getDesc = (level) => "C=" + getC(level).toString(0);
        let getInfo = (level) => "C=" + getC(level).toString(0);
        C = theory.createUpgrade(3, currency, new ExponentialCost(1e10, Math.log2(1.1)));
        C.getDescription = (amount) => Utils.getMath(getDesc(C.level));
        C.getInfo = (amount) => Utils.getMathTo(getInfo(C.level), getInfo(C.level + amount));
        C.bought = (_) => updateObject_flag = true;
    }

    // D
    {
        let getDesc = (level) => "D=" + getD(level).toString(0)
        let getInfo = (level) => "D=" + getD(level).toString(0);
        D = theory.createUpgrade(4, currency, new ExponentialCost(1e50, Math.log2(1.1)));
        D.getDescription = (amount) => Utils.getMath(getDesc(D.level));
        D.getInfo = (amount) => Utils.getMathTo(getInfo(D.level), getInfo(D.level + amount));
        D.bought = (_) => updateObject_flag = true;
    }

    //c2
    {
        let getDesc = (level) => "c_2=2^{" + level+"}";
        let getInfo = (level) => "c_2=" + getC2(level).toString(0);
        c2 = theory.createUpgrade(5, currency, new ExponentialCost(1e100, 10*Math.log2(10)));
        c2.getDescription = (amount) => Utils.getMath(getDesc(c2.level));
        c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level), getInfo(c2.level + amount));
    }

    /////////////////////
    // Permanent Upgrades
    theory.createPublicationUpgrade(0, currency, 1e8);
    theory.createBuyAllUpgrade(1, currency, 1e15);
    theory.createAutoBuyerUpgrade(2, currency, 1e25);

    /////////////////////
    // Checkpoint Upgrades
    theory.setMilestoneCost(new LinearCost(1,5));

    {
        c1Exp = theory.createMilestoneUpgrade(0, 4);
        c1Exp.description = Localization.getUpgradeIncCustomExpDesc("c_1", "0.1");
        c1Exp.info = Localization.getUpgradeIncCustomExpInfo("c_1", "0.1");
        c1Exp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
    }

    {
        CTerm = theory.createMilestoneUpgrade(1, 1);
        CTerm.description = Localization.getUpgradeAddTermDesc("C");
        CTerm.info = Localization.getUpgradeAddTermInfo("C");
        CTerm.canBeRefunded = (_) => (DTerm.level == 0);
        CTerm.boughtOrRefunded = (_) => {theory.invalidateSecondaryEquation(); updateAvailability(); };
    }

    {
        DTerm = theory.createMilestoneUpgrade(2, 1);
        DTerm.description = Localization.getUpgradeAddTermDesc("D");
        DTerm.info = Localization.getUpgradeAddTermInfo("D");
        DTerm.canBeRefunded = (_) => (c2Term.level == 0);
        DTerm.boughtOrRefunded = (_) => {theory.invalidateSecondaryEquation(); updateAvailability(); };
        DTerm.isAvailable = false;
    }

    {
        c2Term = theory.createMilestoneUpgrade(3, 1);
        c2Term.description = Localization.getUpgradeAddTermDesc("c_2");
        c2Term.info = Localization.getUpgradeAddTermInfo("c_2");
        c2Term.boughtOrRefunded = (_) => {theory.invalidateSecondaryEquation(); updateAvailability(); };
        c2Term.isAvailable = false;

    }

    updateAvailability();
}

var updateAvailability = () => {
    DTerm.isAvailable = CTerm.level > 0;
    c2Term.isAvailable = DTerm.level > 0;
    C.isAvailable = CTerm.level > 0
    D.isAvailable = DTerm.level > 0;
    c2.isAvailable = c2Term.level > 0;
}

var tick = (elapsedTime, multiplier) => {
    let dt = BigNumber.from(elapsedTime*multiplier); 
    let bonus = theory.publicationMultiplier; 
    let vc1 = getC1(c1.level).pow(getC1Exp(c1Exp.level));
    let vc2 = getC2(c2.level);
    
    if (updateObject_flag) {        
        let vA = getA(A.level);
        let vB = getB(B.level);
        let vC = getC(C.level);
        let vD = getD(D.level);
        n = vA+vB+vC+vD;

        q1 = getQ1(n);
        q2 = getQ2(vA,vB,vC,vD);

        updateObject_flag = false;
    }
    
    rho_dot = vc1 * vc2 * (BigNumber.ONE + q1) / (BigNumber.ONE + q2) * dt

    currency.value += bonus * vc1 * vc2 * (BigNumber.ONE + q1) / (BigNumber.ONE + q2).pow(BigNumber.TWO) * dt;

    theory.invalidateTertiaryEquation();
}

var getInternalState = () => `${q1} ${q2}`;

var setInternalState = (state) => {
    let values = state.split(" ");
    if (values.length > 0) q1 = parseBigNumber(values[0]);
    if (values.length > 1) q2 = parseBigNumber(values[1]);
    updateObject_flag = true;
}

var postPublish = () => {
    q1 = BigNumber.ZERO;
    q2 = BigNumber.ZERO;
    updateObject_flag = true;
}

var getPrimaryEquation = () => {
    theory.primaryEquationHeight = 90;
    let result = "\\begin{matrix}";
    result += "\\dot{\\rho}=c_1";
    if (c1Exp.level > 0) result += `^{${1+c1Exp.level*0.1}}`;
    result += "\\frac{1+q1}{(1+q2)^2}";
    result += "\\end{matrix}";
    return result;
}

var getSecondaryEquation = () => {
    theory.secondaryEquationHeight = 90;
    let result = "q_1 = n! \\sum_{k=0}^{n}(-1)^k {\\frac{1}{k!}}";
    result += "\\\\q_2 = n!/(A!B!";
    if(C.isAvailable) result +="C!"
    if(D.isAvailable) result +="D!"
    result +=")";
    result+= "\\\\" + theory.latexSymbol + "=\\max\\rho^{0.1}"
    return result;
}

var getTertiaryEquation = () => {
    let result = "";
    result += "\\begin{matrix}q_1=";
    result += q1.toString();
    result += ",&q_2 ="
    result += q2.toString();
    result += ",&n ="
    result += n.toString();
    result += ",&\\dot{\\rho} ="
    result += rho_dot.toString();
    result += "\\end{matrix}";

    return result;
}

//for small num normal factorial
//for big num use of Stirlings approximation
var factorial = (num) => {
    if(num < BigNumber.HUNDRED){
        let temp = BigNumber.ONE;
        for(let a = BigNumber.ONE; a<=num; a++){
            temp *= a;
        }
        return temp;
    }
    return (BigNumber.TWO * BigNumber.PI * num).sqrt() * (num/BigNumber.E).pow(num);
}

//Maclaurin expansion of e^-x up to itr terems
var mac_e_x = (itr) => {
    let num = BigNumber.ZERO;
    for (let a = BigNumber.ZERO; a <= itr; a++) {
        let sign = BigNumber.from(-1);
        if(a%2==0) sign = BigNumber.from(1);
        num += sign/factorial(a);
    } 
    return num;
}

//Derangment = n!*M(e^(-n))
//for large n n!/e^n
//part 2 either *Maclaurin expansion or /e^x 
var getQ1 = (num_Obj) => {
    if (num_Obj.isZero || num_Obj == BigNumber.ONE) return BigNumber.ZERO;

    let part1 = factorial(num_Obj);
    if(num_Obj < 50) {
        let part2 = mac_e_x(num_Obj);
        return part1 * part2
    }
    let part2 = BigNumber.E.pow(num_Obj)
    return part1/part2; 
}

//Permutations
//n!/(A!*B!*C!*D!)
var getQ2 = (vA,vB,vC,vD) => factorial(vA + vB + vC + vD)/(factorial(vA)*factorial(vB)*factorial(vC)*factorial(vD));


var getPublicationMultiplier = (tau) => tau.isZero ? BigNumber.ONE : tau.pow(BigNumber.from(2));
var getPublicationMultiplierFormula = (symbol) => "{" + symbol + "}^{2}";
var getTau = () => currency.value.pow(BigNumber.from(0.1));
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();

var getC1 = (level) => Utils.getStepwisePowerSum(level, 4, 10, 0);
var getA = (level) => BigNumber.from(level);
var getB = (level) => BigNumber.from(level*2);
var getC = (level) => BigNumber.from(level*3);
var getD = (level) => BigNumber.from(level*5);
var getC2 = (level) => BigNumber.TWO.pow(level);
var getC1Exp = (level) => BigNumber.from(1 + level * 0.1);

init();
