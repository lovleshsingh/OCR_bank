const { replaceAll } = require("./helper")
const fs = require('fs');
const moment = require("moment");


/*
********************************************************************************
    HELPER FUNCTIONS STARTS.....
********************************************************************************
*/
function isValidDate(dateString, charToSplit) {
    const dateComponents = dateString ? dateString?.split(charToSplit) : [];
  
    const day = parseInt(dateComponents[0], 10);
    const month = parseInt(dateComponents[1], 10) - 1;
    const year = parseInt(dateComponents[2], 10);
    const date = new Date(year, month, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
    );
}

function isNumeric(str) {
    return !isNaN(parseFloat(str)) && isFinite(str);
}

function sarvanaIsDebitIsCredit(obj, amount) {
    const newObj = obj.find(o => o.text === amount);
    const left = newObj.left;
    if (left > 560)
        return ("Credit");
    else
        return ("Debit");
}
/*
********************************************************************************
    HELPER FUNCTIONS ENDS.
********************************************************************************
*/



/*
********************************************************************************
    YASSHARM ...... 
********************************************************************************
*/

const odishaGramyaBank = (accountRawData, transactionRawData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    
    let accountDetails = {
        bankName : 'Odisha Gramya Bank',
        accBranch : null,
        accHolderName : null,
        date : null,
        accNumber : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }

    let noOfPages = accountRawData.length;
    let nextCounter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("ODISHA GRAMYA BANK")) {
                nextCounter = 1;
            } else if (nextCounter == 1) {
                accountDetails.accBranch = line.trim();
                nextCounter = 0;
            } else if (line.includes("TO:")) {
                nextCounter = 2;
            } else if (nextCounter == 2) {
                accountDetails.accHolderName = line.trim();
                nextCounter = 0;
            } else if (line.includes("STATEMENT OF ACCOUNT FOR THE PERIOD OF")) {
                line = line.split("STATEMENT OF ACCOUNT FOR THE PERIOD OF")?.[1]?.split("to");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            } else if (line.includes("A/C NO:")){
                line = line.split("A/C NO:")?.[1]?.trim();
                accountDetails.accNumber = line.split(" ")?.[0];
            } else if (line.includes("TYPE:")){
                line = line.split(" ").filter(s => s.length > 0)
                accountDetails.date = line[line.length - 1] ? line[line.length - 1].trim() : "";
            }
        });
    }

    //Transaction table data
    //Balance of last entry of page is missing. Can be fixed with simple logic in the end if needed
    let counter = 0;
    let transactionData = [];

    noOfPages = transactionRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);

            let tempTransaction = {
                date : null,
                particulars : null,
                chequeNo : null,
                withdrawAmt : null,
                depositAmt : null,
                balance : null
            }
            let temp = line[0]?.split(" ");
            tempDate = temp.shift();
            const date = moment(tempDate, "DD-MMM-YYYY", true);

            if (counter == 1 && !(date.isValid())) {
                transactionData[transactionData.length - 1].balance = line[0];
                counter = 0
            } else if (counter == 1 && date.isValid()) {
                transactionData[transactionData.length - 1].balance = "N/A";
                counter = 2;
            } else if (counter == 0 && date.isValid()) {
                let len = line.length;
                tempTransaction.date = tempDate;
                tempTransaction.particulars = temp.join(" ");
                tempTransaction.balance = "N/A";
                if (len == 3) {
                    tempTransaction.chequeNo = "";
                    tempTransaction.withdrawAmt = line[1];
                    tempTransaction.depositAmt = line[2];
                    if (tempTransaction.withdrawAmt.length > 0) {
                        tempTransaction.chequeNo = tempTransaction.particulars.substring(tempTransaction.particulars.length - 6);
                        tempTransaction.particulars = tempTransaction.particulars.substring(0, tempTransaction.particulars.length - 6);
                    }
                } else if (len == 4) {
                    tempTransaction.chequeNo = line[1];
                    tempTransaction.withdrawAmt = line[2];
                    tempTransaction.depositAmt = line[3];
                }
                transactionData.push(tempTransaction);
                counter = 1;
            }
            if (counter == 2){
                // console.log("found the missing transaction - ", line);
                let len = line.length;
                tempTransaction.date = tempDate;
                tempTransaction.particulars = temp.join(" ");
                tempTransaction.balance = "N/A";
                if (len == 3) {
                    tempTransaction.chequeNo = "";
                    tempTransaction.withdrawAmt = line[1];
                    tempTransaction.depositAmt = line[2];
                    if (tempTransaction.withdrawAmt.length > 0) {
                        tempTransaction.chequeNo = tempTransaction.particulars.substring(tempTransaction.particulars.length - 6);
                        tempTransaction.particulars = tempTransaction.particulars.substring(0, tempTransaction.particulars.length - 6);
                    }
                } else if (len == 4) {
                    tempTransaction.chequeNo = line[1];
                    tempTransaction.withdrawAmt = line[2];
                    tempTransaction.depositAmt = line[3];
                }
                transactionData.push(tempTransaction);
                counter = 1;
            }
        });
    }

    accountDetails.transactionData = transactionData;
    return(accountDetails);
}

const aryavartBank = (accountRawData, transactionRawData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    let accountDetails = {
        bankName : 'Aryavart Bank',
        accBranch : null,
        accNumber : null,
        date : null,
        accHolderName : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }
    
    //Account General Information
    let noOfPages = accountRawData.length;
    let nextCounter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("ARYAVART BANK")) {
                nextCounter = 1;
            } else if (nextCounter == 1) {
                accountDetails.accBranch = line.trim();
                nextCounter = 0;
            } else if (line.includes("TO:")) {
                nextCounter = 2;
            } else if (nextCounter == 2) {
                accountDetails.accHolderName = line.trim();
                nextCounter = 0;
            } else if (line.includes("STATEMENT OF ACCOUNT FOR THE PERIOD OF")) {
                line = line.split("STATEMENT OF ACCOUNT FOR THE PERIOD OF")?.[1]?.split("to");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            } else if (line.includes("A/C NO:")){
                line = line.split("A/C NO:")?.[1]?.trim();
                accountDetails.accNumber = line.split(" ")?.[0];
            } else if (line.includes("TYPE:")){
                line = line.split(" ").filter(s => s.length > 0)
                accountDetails.date = line[line.length - 1] ? line[line.length - 1].trim() : "";
            }
        });
    }

    //Transaction Data
    let transactionData = [];
    noOfPages = transactionRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            let i = 0;
            let transaction = {
                date : null,
                particulars : null,
                chequeNo : null,
                withdrawAmt : null,
                depositAmt : null,
                balance : null
            }
            let temp = line[i++]?.split(" ");
            transaction.date = temp.shift();
            const date = moment(transaction.date, "DD-MMM-YYYY", true);
            if (date.isValid() && line.length >= 5) {
                transaction.particulars = temp.join(" ");
                transaction.chequeNo = line[i++];
                transaction.withdrawAmt = line[i++];
                transaction.depositAmt = line[i++];
                transaction.balance = line[i];
                transactionData.push(transaction);
            }
        });
    }

    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const bangiyaGraminVikashBank = (accountRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []
    

    let accountDetails = {
        bankName : 'BANGIYA GRAMIN VIKASH BANK MAHENDRA',
        accBranch : '',
        accNumber : '',
        accHolderName : '',
        openingBalance : '',
        currency : '',
        transactionFrom : '',
        transactionTo : '',
        transactionData : null
    }
    let transactionData = [];

    //Account Details
    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Currency Code:")){
                accountDetails.currency = line.split("Currency Code:")?.[1]?.trim();
            } else if (line.includes("Period:")) {
                accountDetails.transactionFrom = line.split("Period:")?.[1]?.split("to")?.[0]?.trim();
                accountDetails.transactionTo = line.split("Period:")?.[1]?.split("to")?.[1]?.trim();
            } else if (line.includes("Service OutLet:")) {
                accountDetails.accBranch = line.split("Service OutLet:")?.[1]?.trim();
            } else if (line.includes("Opening Balance  :")) {
                accountDetails.openingBalance = line.split("Opening Balance  :")?.[1]?.trim();
            } else if (line.includes("Acct Range:")) {
                let temp = line.split("Acct Range:")?.[1]
                accountDetails.accNumber = temp.split(" ").filter(s => s.length > 0)?.[0];
            } else if (line.includes("Account No:")) {
                let temp = line.split("Account No:")?.[1];
                temp = temp.split(" ").filter(s => s.length > 0);
                if (temp.length > 1) {
                    accountDetails.accHolderName = temp.slice(1, temp.length).join(" ");
                }
            }
        });
    }

    noOfPages = pyPdfData.length;
    //Transaction Data
    for (let i = 0; i < noOfPages; i++) {
        let page = pyPdfData?.[i]?.data;
        page?.forEach( object => {
            let allLines = object.map(obj => obj.text);                             //Gives all text of a page in single line
            allLines = allLines[0].split("\r").filter(s => s.length > 0);           //Split the content of page line by line (using \r). Array of lines now
            for (let j = 0; j < allLines.length; j++) {
                let line = allLines[j].split(" ");
                let notEmpty = line.filter(s => s.length > 0);

                if (notEmpty.length > 6 && isValidDate(notEmpty[0], "-") && isValidDate(notEmpty[1], "-")) {
                    let transaction = {
                        date : null,
                        valueDate : null,
                        particulars : null,
                        debitAmt : null,
                        creditAmt : null,
                        balance : null,
                        entryBy : null,
                        verifiedBy : null
                    }
                    let isCredit = line.length < 100 ? 1 : 0;                       //Checking if debit or credit based on line length 
                    transaction.date = notEmpty[0];
                    transaction.valueDate = notEmpty[1];
                    transaction.particulars = notEmpty.slice(2, notEmpty.length - 4).join(" ");
                    transaction.verifiedBy = notEmpty[notEmpty.length - 1];
                    transaction.entryBy = notEmpty[notEmpty.length - 2];
                    transaction.balance = notEmpty[notEmpty.length - 3];
                    if (isCredit) {
                        transaction.creditAmt = notEmpty[notEmpty.length - 4];
                        transaction.debitAmt = "";

                    } else {
                        transaction.creditAmt = "";
                        transaction.debitAmt = notEmpty[notEmpty.length - 4];
                    }
                    transactionData.push(transaction);
                }
            }
        });
    }


    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const barodaRajasthanKshetriyaGraminBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName : 'BARODA RAJASTHAN KSHETRIYA GRAMIN BANK, PAPURANA',
        accBranch : '',
        accNumber : '',
        accHolderName : '',
        openingBalance : '',
        currency : '',
        transactionFrom : '',
        transactionTo : '',
        transactionData : null
    }
    let transactionData = [];

    //Account Details
    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Currency Code:")){
                accountDetails.currency = line.split("Currency Code:")?.[1]?.trim();
            } else if (line.includes("Period:")) {
                accountDetails.transactionFrom = line.split("Period:")?.[1]?.split("to")?.[0]?.trim();
                accountDetails.transactionTo = line.split("Period:")?.[1]?.split("to")?.[1]?.trim();
            } else if (line.includes("Service OutLet:")) {
                accountDetails.accBranch = line.split("Service OutLet:")?.[1]?.trim();
            } else if (line.includes("Opening Balance  :")) {
                accountDetails.openingBalance = line.split("Opening Balance  :")?.[1]?.trim();
            } else if (line.includes("Acct Range:")) {
                let temp = line.split("Acct Range:")?.[1]
                accountDetails.accNumber = temp.split(" ").filter(s => s.length > 0)?.[0];
            } else if (line.includes("Account No:")) {
                let temp = line.split("Account No:")?.[1];
                temp = temp.split(" ").filter(s => s.length > 0);
                if (temp.length > 1) {
                    accountDetails.accHolderName = temp.slice(1, temp.length).join(" ");
                }
            }
        });
    }

    // Transaction Data
    noOfPages = transactionRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            let dates = line[0].split(" ");
            if (line.length == 5 && dates.length >= 2 && isValidDate(dates[0], "-"), isValidDate(dates[1], "-")) {
                let transaction = {
                    date : null,
                    valueDate : null,
                    instrNumber : null,
                    particulars : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null,
                    entryBy : null,
                    verifiedBy : null
                }
                transaction.date = dates[0];
                transaction.valueDate = dates[1];
                transaction.instrNumber = dates.length > 2 ? dates[2] : "";
                transaction.particulars = line[1];
                transaction.debitAmt = line[2];
                transaction.creditAmt = line[3];
                transaction.balance = line[4].split(" ")?.[0]?.trim();
                let tempLine = line[4].split(" ").filter(s => s.length > 0);
                transaction.entryBy = tempLine[1] ? tempLine[1] : "";
                transaction.verifiedBy = tempLine[2] ? tempLine[2] : "";
                transactionData.push(transaction);
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const dhanlaxmiBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName : 'Dhanlaxmi Bank',
        accBranch : null,
        accHolderName : null,
        accHolderAddr : null,
        accHolderEmail : null,
        panNo : null,
        ifcsCode : null,
        customerId : null,
        currency : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }
    let transactionData = [];

    //Account Details 
    let noOfPages = accountRawData.length;
    let tempLine = "";
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Branch :")) {
                tempLine = line.split("Branch :")?.[1]?.split("IFSC Code :");
                accountDetails.accBranch = tempLine[0] ? tempLine[0].trim() : "";
                accountDetails.ifcsCode = tempLine[1] ? tempLine[1].trim() : "";
            } else if (line.includes("Customer Id   :")) {
                tempLine = line.split("Customer Id   :");
                accountDetails.customerId = tempLine[1] ? tempLine[1].trim() : "";
                tempLine = tempLine[0].split("Name");
                accountDetails.accHolderName = tempLine[1] ? tempLine[1] : "";
            } else if (line.includes("Address :")) {
                accountDetails.accHolderAddr = line.split("Address :")?.[1].trim();
            } else if (line.includes("Currency   :")) {
                tempLine = line.split("Currency   :");
                accountDetails.accHolderAddr += " " + tempLine[0].trim();
                accountDetails.currency = tempLine[1] ? tempLine[1].trim() : ""; 
            } else if (line.includes("PAN No   :")) {
                tempLine = line.split("PAN No   :");
                accountDetails.accHolderAddr += " " + tempLine[0].trim();
                accountDetails.panNo = tempLine[1] ? tempLine[1].trim() : "";
            } else if (line.includes("Email :")) {
                accountDetails.accHolderEmail = line.split("Email :")?.[1];
            } else if (line.includes ("Statement Period   :")){
                tempLine = line.split("Statement Period   :")?.[1]?.split("to");
                accountDetails.transactionFrom = tempLine[0] ? tempLine[0].trim() : "";
                accountDetails.transactionTo = tempLine[1] ? tempLine[1].trim() : "";
            }
        });
    }

    //Transaction Data
    noOfPages = pyPdfData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = pyPdfData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            if (isValidDate(line[0], "/") && (line.length === 7 || line.length === 6)){
                let transaction = {
                    date : null,
                    chequeNo : null,
                    particulars : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null
                }
                
                transaction.date = line[0].trim();
                transaction.chequeNo = line[1].trim();
                transaction.particulars = line[2].trim();
                transaction.debitAmt = line[3].trim();
                transaction.creditAmt = line[4].trim();
                transaction.balance = line[5].trim();
                transactionData.push(transaction);
                counter++;
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const rajasthanMarudharaGraminBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')) : [];
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')) : [];
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')) : [];
        
        let accountDetails = {
          bankName: 'RMGB M-Banking',
          accNo: null,
          clientCode : null,
          transactionFrom: null,
          transactionTo: null,
          branch: null,
          ifscCode: null,
          phoneNo: null,
          email : null,
          transactionData: null,
        };
      
        let transactionData = [];

        let noOfPages = accountRawData.length;
        let tempLine = "";
        let counter = 0;
        for (let i = 0; i < noOfPages; i++) {
            let page = accountRawData?.[i]?.data;
            page?.forEach( object => {
                let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
                if (line.includes('Statement for account number')) {
                    tempLine = line.split("Statement for account number")?.[1]?.split("Between");
                    accountDetails.accNo = tempLine[0] ? tempLine[0].trim() : "";
                    tempLine = tempLine[1]?.split("and");
                    accountDetails.transactionFrom = tempLine[0] ? tempLine[0].trim() : "";
                    if(tempLine[1]?.trim().length > 0)
                        accountDetails.transactionTo = tempLine[1] ? tempLine[1].trim() : "";
                    else
                        counter = 1;
                } else if (counter === 1) {
                    accountDetails.transactionTo = line.trim();
                    counter = 0;
                } else if (line.includes("Client Code")) {
                    tempLine = line.split("Client Code")?.[1]?.split("Branch");
                    accountDetails.clientCode = tempLine[0] ? tempLine[0].trim() : "";
                    accountDetails.branch = tempLine[1] ? tempLine[1].trim() : "";
                } else if (line.includes("Phone")) {
                    tempLine = line.split("Phone")?.[1];
                    accountDetails.phoneNo = tempLine.split(" ").filter(s => s.length > 0)?.[0];
                } else if (line.includes("Branch IFSC")) {
                    tempLine = line.split("Branch IFSC")?.[0]?.split("Email");
                    accountDetails.email = tempLine[0] ? tempLine[0].trim() : "";
                    accountDetails.ifscCode = tempLine[1] ? tempLine[1].trim() : "";
                }
            });
        }

        counter = 0;
        noOfPages = transactionRawData.length;
        for (let i = 0; i < noOfPages; i++) {
            let page = transactionRawData?.[i]?.data;
            page?.forEach( object => {
                let line = object.map(obj => obj.text);
                const date = moment(line[0], "DD-MMM-YYYY", true);
                if (date.isValid() && line.length === 5) {
                    let transaction = {
                        date : null,
                        particulars : null,
                        withdrawAmt : null,
                        depositAmt : null,
                        balance : null
                    }
                    transaction.date = line[0];
                    transaction.particulars = line[1];
                    transaction.withdrawAmt = line[2];
                    transaction.depositAmt = line[3];
                    transaction.balance = line[4];
                    transactionData.push(transaction)
                    counter++;
                }
            });
        }
        accountDetails.transactionData = transactionData;
        // console.log("Total - ", counter, "Expected 48");
        return (accountDetails);
      
}

//missing transactions
const vidharbhaKonkanGraminBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName : 'VIDHARBHA KONKAN GRAMIN BANK',
        accHolderName : null,
        accNumber : null,
        accType : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }
    let transactionData = [];

    let noOfPages = accountRawData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + "  ", ' ');
            if (line.includes("TYPE:")){
                let temp =  line.split("TYPE:")?.[1];
                accountDetails.accType = temp?.split(" ").filter(s => s.length > 0)?.[0];
            } else if (line.includes("A/C NO:") && accountDetails.accNumber === null){
                let temp =  line.split("A/C NO:")?.[1]
                accountDetails.accNumber = temp.split(" ").filter(s => s.length > 0)?.[0];
            } else if (line.includes("TO:")) {
                counter = 1;
            } else if (counter === 1) {
                accountDetails.accHolderName = line.trim();
                counter = 0;
            } else if (line.includes("OF") && line.includes("to")) {
                let temp = line.split("OF")?.[2].split("to");
                accountDetails.transactionFrom = temp[0] ? temp[0].trim() : "";
                accountDetails.transactionTo = temp[1] ? temp[1].trim() : "";
            }
        });
    }

    noOfPages = transactionRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + "  ", ' ');
            let lineArr = object.map(obj => obj.text);

            line = line.split(" ").filter(s => s.length > 0)
            const date = moment(line[0], "DD-MMM-YYYY", true);
            
            if (date.isValid() && lineArr.length == 5) {
                let transaction = {
                    date : null,
                    particulars : null,
                    chequeNo : null,
                    withdrawAmt : null,
                    depositAmt : null,
                    balance : null
                }
                transaction.date = lineArr[0].split(" ");
                transaction.particulars = transaction.date.slice(1, transaction.date.length)?.join(" ");
                transaction.date = transaction.date[0];
                transaction.chequeNo = lineArr[1];
                transaction.withdrawAmt = lineArr[2];
                transaction.depositAmt = lineArr[3];
                transaction.balance = lineArr[4];
                transactionData.push(transaction);
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

//missing transactions
const barodaUttarPradeshGraminBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName : 'BARODA U.P. Bank',
        accBranch : null,
        accHolderName : null,
        accNumber : null,
        openingBalance : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }
    let transactionData = [];

    //Account Details 
    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Service OutLet:")) {
                accountDetails.accBranch = line.split("Service OutLet:")?.[1]?.trim();
            } else if (line.includes("Account No:")) {
                let tempLine = line.split("Account No:")?.[1]?.split(" ").filter(s => s.length > 0);
                accountDetails.accNumber = tempLine[0].substring(0, tempLine[0].length - 3);
                accountDetails.accHolderName = tempLine.slice(1, -1).join(" ");
            } else if (line.includes("Opening Balance  :")) {
                accountDetails.openingBalance = line.split("Opening Balance  :")?.[1]?.trim();
            } else if (line.includes("from") && line.includes("to")){
                let tempLine = line.split("from")?.[1]?.split("to");
                accountDetails.transactionFrom = tempLine[0] ? tempLine[0].trim() : "";
                accountDetails.transactionTo = tempLine[1] ? tempLine[1].trim() : "";
            }
        });
    }

    //Transaction Details
    noOfPages = transactionRawData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            let tempDate = line[0].split(" ")?.[0].trim();
            if (isValidDate(tempDate, "-") && line.length === 5) {
                let transaction = {
                    trnDate : null,
                    valueDate : null,
                    instrNumber : null,
                    particulars : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null
                }
                // console.log(line, line.length);
                let temp = line[0].split(" ");
                transaction.trnDate = temp[0] ? temp[0].trim() : "";
                transaction.valueDate = temp[1] ? temp[1].trim() : "";
                transaction.instrNumber = temp[2] ? temp[2].trim() : "";
                transaction.particulars = line[1].trim();
                transaction.debitAmt = line[2].trim();
                transaction.creditAmt = line[3].trim();
                transaction.balance = line[4].trim();
                transactionData.push(transaction);
                counter++;

            }
        });
    }
    // console.log("counter - ", counter, "ecpected - 40");
    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const sarvaHaryanaGraminBank = (data) => {
    console.log("Inside the parser of sarvana haryana bank");
    data = data ? JSON.parse(data.replace(/'/g, '"')): []

    let accountDetails = {
        bankName : 'Sarva Haryana Gramin Bank',
        accId : null,
        accStatus : null,
        accStatusDate : null,
        accOpenDate : null,
        accCloseDate : null,
        glSubhead : null,
        accType : null,
        openingBalance : null,
        availableAmount : null,
        closingBalance : null,
        effectiveAvailAmt : null,
        fundsInClg : null,
        floatBal : null,
        transactionData : null
    }
    let transactionData = [];
    const noOfPages = data.length;    

    for (let i = 0; i < noOfPages; i++) {
        let page = data?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("A/c. ID")) {
                accountDetails.accId = line.split("A/c. ID")[1].trim();
            } else if (line.includes("A/c. Status")) {
                line = line.split(" ").filter(s => s.trim().length > 0);
                accountDetails.accStatus = line[2].includes("A/c.") ? "" : line[2];
                accountDetails.accStatusDate = isValidDate(line[line.length - 1], "-") ? line[line.length - 1] : "";
            } else if (line.includes("A/c. Open Date")) {
                line = line.split("A/c. Open Date")[1]?.split("A/c. Close Date");
                accountDetails.accOpenDate = isValidDate(line[0]?.trim(), "-") ? line[0].trim() : "";
                accountDetails.accCloseDate = isValidDate(line[1]?.trim(), "-") ? line[1].trim() : "";
            } else if (line.includes("GL Subhead")) {
                line = line.split("GL Subhead")[1]?.split("A/c. Type");
                accountDetails.glSubhead = line[0] ? line[0].trim() : "";
                accountDetails.accType= line[1] ? line[1].trim() : "";
            } else if (line.includes("Opening Bal.")) {
                line = line.split("Opening Bal.")[1]?.split("Available Amt.");
                accountDetails.openingBalance = line[0] ? line[0].trim() : "";
                accountDetails.availableAmount = line[1] ? line[1].trim() : "";
            } else if (line.includes("Closing Bal.")) {
                line = line.split("Closing Bal.")[1]?.split("Effective Available Amt.");
                accountDetails.closingBalance = line[0] ? line[0].trim() : "";
                accountDetails.effectiveAvailAmt = line[1] ? line[1].trim() : "";
            } else if (line.includes("Funds in Clg.")) {
                line = line.split("Funds in Clg.")[1]?.split("Float Bal.");
                accountDetails.fundsInClg = line[0] ? line[0].trim() : "";
                accountDetails.floatBal = line[1] ? line[1].trim() : "";
            } else {
                let transaction = {
                    transactionDate : null,
                    valueDate : null,
                    instrNumber : null,
                    particulars : null,
                    currency : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null,
                }
                let i = 0;
                line = line.split(" ").filter(s => s.length > 0);
                if (isValidDate(line[i], "-") && isValidDate(line[i + 1], "-"))
                {
                    transaction.transactionDate = line[i] ? line[i] : "";
                    i++;
                    transaction.valueDate = line[i] ? line[i] : "";
                    i++;
                    if (isNumeric(line[i])) {
                        transaction.instrNumber =  line[i];
                        i++;
                    } else {
                        transaction.instrNumber = "";
                    }
                    let index = line.indexOf('INR');
                    transaction.particulars = line.slice(i, index).join(" ");
                    transaction.currency = line[index];
                    i = index + 1;
                    if (sarvanaIsDebitIsCredit(object, line[i]) === "Debit"){
                        transaction.debitAmt = line[i++];
                        transaction.creditAmt = "";
                    } else {
                        transaction.creditAmt = line[i++];
                        transaction.debitAmt = "";
                    }
                    transaction.balance = line[i];
                    transactionData.push(transaction);
                }
            }
        });
    }
    accountDetails.transactionData = transactionData;
    // console.log(accountDetails);
    return (accountDetails);
}

const idbiBank = (data) => {
    data = data ? JSON.parse(data.replace(/'/g, '"')): []
    let accountDetails = {
        bankName : 'IDBI Bank',
        accHolderName : null,
        address : null,
        accNumber : null,
        customerId : null,
        accBranch : null,
        nomineeRegistered : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }
    let transactionData = [];
    const noOfPages = data.length;
    let tempFlag = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = data?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Primary Account Holder Name :")){
                accountDetails.accHolderName = line.split("Primary Account Holder Name :")?.[1]?.trim();
            } else if (line.includes("Address :")) {
                tempFlag++;
                accountDetails.address = line.split("Address :")?.[1]?.trim();
            } else if (tempFlag != 0 && !(line.includes("Account No"))){
                accountDetails.address += " " + line.trim();
            } else if (line.includes("Account No :")) {
                tempFlag = 0;
                accountDetails.accNumber = line.split("Account No :")?.[1]?.trim();
            } else if (line.includes("Customer ID :")) {
                accountDetails.customerId = line.split("Customer ID :")?.[1]?.trim();
            } else if (line.includes("Account Branch :")) {
                accountDetails.accBranch = line.split("Account Branch :")?.[1]?.trim();
            } else if (line.includes("Nominee Registered : :")) {
                accountDetails.nomineeRegistered = line.split("Nominee Registered : :")?.[1]?.trim();
            } else if (line.includes("Transaction Date From :")) {
                line = line.split("Transaction Date From :")?.[1];
                line = line.split("to:");
                accountDetails.transactionFrom = line?.[0]?.trim();
                accountDetails.transactionTo = line?.[1]?.split("A/C NO:")?.[0]?.trim();
            } else {
                let transaction = {
                    srNo : null,
                    txnDate : null,
                    valueDate : null,
                    description : null,
                    chequeNo : null,
                    creditAmt : null,
                    debitAmt : null,
                    balance : null
                };
                line = line.split(" ").filter(s => s.length > 0);
                let i = 0;
                if (line.length > 6 && isValidDate(line[1], "/")){
                    //Sr No
                    transaction.srNo = line[i++];
                    //Transaction Date with time ("23/11/2022 10:30 Am")
                    transaction.txnDate = line[i++] + " " + line[i++] + " " + line[i++];
                    //Value date ("23/11/2022")
                    transaction.valueDate = isValidDate(line[i], "/") ? line[i++] : "" ;
                    //Description Cheque number and Debit/Credit
                    let dbIndex  = line.indexOf("Dr.");
                    let crIndex  = line.indexOf("Cr.");
                    if (dbIndex > 0){
                        transaction.description = line.slice(i, dbIndex - 1).join(" ");
                        transaction.chequeNo = line[dbIndex - 1];
                        i = dbIndex + 1;
                        transaction.debitAmt = line[i + 1] ? line[i + 1] : "";
                        transaction.creditAmt = ""
                    } else if (crIndex > 0) {
                        transaction.description = line.slice(i, crIndex).join(" ");
                        transaction.chequeNo = "";
                        i = crIndex + 1;
                        transaction.creditAmt = line[i + 1] ? line[i + 1] : "";
                        transaction.debitAmt = "";
                    }
                    //Currency
                    transaction.currency = line[i];
                    i += 2;
                    //Balance
                    transaction.balance = line[i] ? line[i] : "";
                    transactionData.push(transaction);
                }
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const karnatakaGraminBank = (data) => {
    data = data ? JSON.parse(data.replace(/'/g, '"')): []
    let accountDetails = {
        bankName : 'Karnataka Gramin Bank',
        referenceNo : null,
        date : null,
        accHolder : "",
        accNo : null,
        openDate : null,
        balance : null,
        branch : null,
        ifcsCode : null,
        transactionData : null
    }

    let transactionData = [];
    const noOfPages = data.length;    

    for (let i = 0; i < noOfPages; i++) {
        let page = data?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Ref No :")) {
                line = line.split("Ref No :")[1].split("Dated :");
                accountDetails.referenceNo = line[0] ? line[0].trim() : "";
                accountDetails.date = line[1] ? line[1].trim() : "";
            } else if (line.includes("A/c No :")) {
                line = line.split("A/c No :");
                accountDetails.accHolder += line[0] ? line[0].trim() : accountDetails.accHolder
                accountDetails.accNo = line[1] ? line[1].trim() : "";
            } else if (line.includes("Open Date :")) {
                line = line.split("Open Date :");
                accountDetails.accHolder += line[0] ? " " + line[0].trim() : accountDetails.accHolder
                accountDetails.openDate = line[1] ? line[1].trim() : "";
            } else if (line.includes("Balance :")) {
                line = line.split("Balance :");
                accountDetails.accHolder += line[0] ? " " + line[0].trim() : accountDetails.accHolder
                accountDetails.balance = line[1] ? line[1].trim() : "";
            } else if (line.includes("Branch :")) {
                line = line.split("Branch :");
                accountDetails.accHolder += line[0] ? " " + line[0].trim() : accountDetails.accHolder
                accountDetails.branch = line[1] ? line[1].trim() : "";
            } else if (line.includes("IFSC Code :")) {
                line = line.split("IFSC Code :");
                accountDetails.ifcsCode = line[1] ? line[1].trim() : "";
            } else {
                let transaction = {
                    date : null,
                    particulars : null,
                    instrNumber : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null,
                }
                let i = 0;
                line = line.split(" ").filter(s => s.length > 0);
                if (isValidDate(line[i], "-"))
                {
                    //Date
                    transaction.date = line[i] ? line[i] : "";
                    //Particulars
                    let tempObj = object.find(obj => obj.text.includes(transaction.date))
                    transaction.particulars = tempObj.text.split(transaction.date)?.[1]?.trim();
                    
                    //Instrument Number
                    i += transaction.particulars?.split(' ').length + 1;
                    transaction.instrNumber = isNumeric(line[i]) ? line[i++] : "";

                    //Debit and Credit Amount
                    if (line[i]) {
                        tempObj = object.find(obj => obj.text.includes(line[i]));
                        if (tempObj.left > 570){
                            transaction.creditAmt = line[i++];
                            transaction.debitAmt = ""
                        } else {
                            transaction.debitAmt = line[i++];
                            transaction.creditAmt = "";
                        }
                    }
                    
                    //Balance
                    transaction.balance = line[i] ? line[i] : "";
                    transactionData.push(transaction);
                }
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const kanaraDistrictBank = (accountRawData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName : 'The Kanara District Central Co Operative Bank Limited',
        accBranch : null,
        accBranchNo : null,
        accHolderName : null,
        accNumber : null,
        transactionData : null
    }
    let transactionData = [];
    let noOfPages = accountRawData.length;
    let counter = 0;
    let transCounter = 0;

    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');

            if (line.includes("Branch :")) {
                accountDetails.accBranch = line.split("Branch :")?.[1]?.trim();
            } else if (line.includes("Brancn No :")) {
                accountDetails.accBranchNo = line.split("Brancn No :")?.[1]?.trim();
            } else if (line.trim().length == 2 && line.includes("To")){
                counter = 1;
            } else if (counter == 1) {
                accountDetails.accHolderName = line.trim();
                counter = 0;
            } else if (line.includes("ACCOUNT NUMBER :")) {
                accountDetails.accNumber = line.split("ACCOUNT NUMBER :")?.[1]?.trim();
            } else {
                let lineArr = line.split(" ").filter(s => s.length > 0);
                let date = lineArr[0]?.split("|")?.[0];
                let transaction = {
                    date : null,
                    particulars : null,
                    withdrawAmt : null,
                    depositAmt : null,
                    balance : null
                }
                if (isValidDate(date, '-')) {
                    transaction.date = date;
                    transaction.particulars = line.split("|")?.[1]?.trim();
                    transactionData.push(transaction);
                    transCounter = 1;
                } else if (transCounter == 1) {
                    let index = transactionData.length - 1;
                    let particulars = lineArr.slice(0, -4);
                    let amountData = lineArr.slice(-4);

                    transactionData[index].particulars += " " + particulars.join(" ");
                    if (amountData.length == 4) {
                        transactionData[index].withdrawAmt = amountData[0];
                        transactionData[index].depositAmt = amountData[1];
                        transactionData[index].balance = amountData[2] + " " + amountData[3];
                    }
                    transCounter = 0;
                }
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const theVaidyanathUrbanCoOpBankLtd = (accountRawData, transactionRawData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    
    let accountDetails = {
        bankName : 'THE VAIDYANATH URBAN CO-OP BANK LTD.',
        accNumber : '',
        accHolderName : '',
        ifcsCode : null,
        customerId : null,
        kycNo : null,
        panNo : null,
        accStatus : null,
        accOpenDate : null,
        accHolderAddr : null,
        transactionFrom : '',
        transactionTo : '',
        transactionData : null
    }
    let transactionData = [];

    //Account Details
    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            // console.log(line);
            if (line.includes("A/c No:")){
                line = line.split("A/c No:")?.[1]?.split("A/c Name:");
                accountDetails.accNumber = line[0] ? line[0].trim() : "";
                accountDetails.accHolderName = line[1] ? line[1].trim() : "";
            } else if (line.includes("Customer Id:")) {
                line = line.split("Customer Id:")?.[1]?.split("Address:");
                accountDetails.customerId = line[0] ? line[0].trim() : "";
                accountDetails.accHolderAddr = line[1] ? line[1].trim() : "";
            } else if (line.includes("KYC No:")) {
                accountDetails.kycNo = line.split("KYC No:")?.[1]?.trim();
            } else if (line.includes("PAN:")) {
                accountDetails.panNo = line.split("PAN:")?.[1]?.trim();
            }  else if (line.includes("A/c Status :")) {
                accountDetails.accStatus = line.split("A/c Status :")?.[1]?.trim();
            } else if (line.includes("Open Date  :")) {
                accountDetails.accOpenDate = line.split("Open Date  :")?.[1]?.trim();
            } else if (line.includes("IFSC:-")) {
                line = line.split("IFSC:-");
                accountDetails.ifcsCode = line[1]?.split(" ")?.[0];
            } else if (line.includes("From") && line.includes("To")) {
                line = line.split("From")?.[1]?.split("To");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            }
        });
    }

    //Transaction Details
    noOfPages = transactionRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            if (isValidDate(line[0], "/") && line.length == 6){
                let transaction = {
                    date : null,
                    particulars : null,
                    chequeNo : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null
                }
                transaction.date = line[0];
                transaction.particulars = line[1];
                transaction.chequeNo = line[2];
                transaction.debitAmt = line[3];
                transaction.creditAmt = line[4];
                transaction.balance = line[5];
                transactionData.push(transaction);
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const auSmallFinanceBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName : 'AU SMALL FINANCE BANK',
        accHolderName : null,
        statementDate : null,
        customerId : null,
        customerType : null,
        accNumber : null,
        ifcsCode : null,        
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            // console.log(line);
            if (line.includes("Account Name :")){
                line = line.split("Account Name :")?.[1]?.split("Statement Date : ");
                accountDetails.accHolderName = line[0] ? line[0].trim() : "";
                accountDetails.statementDate = line[1] ? line[1].trim() : "";
            } else if (line.includes("Primary Customer ID :")) {
                line = line.split("Primary Customer ID :")?.[1]?.split("Customer Type : ");
                accountDetails.customerId = line[0] ? line[0].trim() : "";
                accountDetails.customerType = line[1] ? line[1].trim() : "";
            } else if (line.includes("Account Number  - ")) {
                line = line.split("Account Number  - ")?.[1]?.split(" - AU Current Account-Maximum ; IFSC Code -");
                accountDetails.accNumber = line[0] ? line[0].trim() : "";
                line = line[1] ? line[1].trim() : "";
                accountDetails.ifcsCode = line?.split(" Statement From")?.[0].trim();
                line = line?.split(" Statement From")?.[1]?.split("To");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            }
        });
    }

    let transactionData = [];


    noOfPages = transactionRawData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            line[0] = line[0].replace(/ /g, '/');
            const date = moment(line[0].trim(), "DD/MMM/YYYY", true);
            if (date.isValid() && line.length == 7) {
                let transaction = {
                    date : null,
                    description : null,
                    valueDate : null,
                    chequeNo : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null,
                }
                transaction.date = line[0].trim(); 
                transaction.description = line[1].trim(); 
                transaction.valueDate = line[2].trim();
                transaction.chequeNo = line[3].trim();
                transaction.debitAmt = line[4].trim();
                transaction.creditAmt = line[5].trim();
                transaction.balance = line[6].trim();
                transactionData.push(transaction);
                counter++; 
            }
        });
    }
   accountDetails.transactionData = transactionData;

    return (accountDetails);
}

const karurVasyaBank = (accountRawData, transactionRawData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []


    let accountDetails = {
        bankName : 'KARUR VYSYA BANK',
        accHolderName : null,
        accNumber : null,
        branch : null,
        customerId : null,
        accCurrency : null,
        openingBalance : null,
        closingBalance : null,  
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Account Name ")){
                accountDetails.accHolderName = line.split("Account Name ")?.[1]?.trim();
            } else if (line.includes("Account Number")){
                accountDetails.accNumber = line.split("Account Number")?.[1]?.trim();
            } else if (line.includes("Branch")){
                accountDetails.branch = line.split("Branch")?.[1]?.trim();
            } else if (line.includes("Customer Id")){
                accountDetails.customerId = line.split("Customer Id")?.[1]?.trim();
            } else if (line.includes("Account Currency ")){
                accountDetails.accCurrency = line.split("Account Currency ")?.[1]?.trim();
            } else if (line.includes("Opening Balance ( Balance B/F )")){
                accountDetails.openingBalance = line.split("Opening Balance ( Balance B/F )")?.[1]?.trim();
            } else if (line.includes("Closing Balance")){
                accountDetails.closingBalance = line.split("Closing Balance")?.[1]?.trim();
            } else if (line.includes("From Date ")){
                accountDetails.transactionFrom = line.split("From Date ")?.[1]?.trim();
            } else if (line.includes("To Date")){
                accountDetails.transactionTo = line.split("To Date")?.[1]?.trim();
            }
        });
    }

    let transactionData = [];


    noOfPages = transactionRawData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            const date = moment(line[0].split(" ")?.[0].trim(), "DD-MM-YYYY", true);
            if (date.isValid() && line.length == 8) {
                let transaction = {
                    date : null,
                    valueDate : null,
                    branch : null,
                    chequeNo : null,
                    description : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null,
                }
                transaction.date = line[0].trim(); 
                transaction.valueDate = line[1].trim();
                transaction.branch = line[2].trim();
                transaction.chequeNo = line[3].trim();
                transaction.description = line[4].trim(); 
                transaction.debitAmt = line[5].trim();
                transaction.creditAmt = line[6].trim();
                transaction.balance = line[7].trim();
                transactionData.push(transaction);
                counter++; 
            }
        });
    }
   accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const theSabarknathaDistrictBank = (accountRawData, transactionRawData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    

    let accountDetails = {
        bankName : 'THE SABARKANTHA DCCB BANK LTD',
        cifNo : null,
        branchCode : null,
        email : null,
        accNo : null,
        date : null,
        clearedBalance : null,
        limit : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("CIF No :")){
                line = line.split("CIF No :")?.[1]?.split("Branch Code :");
                accountDetails.cifNo = line[0] ? line[0].trim() : "";
                accountDetails.branchCode = line[1] ? line[1].trim() : "";
            } else if (line.includes("Email :")){
                accountDetails.email = line.split("Email :")?.[1]?.trim();
            } else if (line.includes("Account No:")){
                line = line.split("Account No:")?.[1]?.split("Date : ");
                accountDetails.accNo = line[0] ? line[0].trim() : "";
                accountDetails.date = line[1] ? line[1].trim() : "";
            } else if (line.includes("Cleared Balance :")){
            line = line.split("Cleared Balance :")?.[1]?.split("Limit :");
            accountDetails.clearedBalance = line[0] ? line[0].trim() : "";
            accountDetails.limit = line[1] ? line[1].trim() : "";
            } else if (line.includes("Statement of Account  From :")){
                line = line.split("Statement of Account  From :")?.[1]?.split("To :");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            }
        });
    }

    let transactionData = [];


    noOfPages = transactionRawData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            const date = moment(line[0].trim(), "DD/MM/YY", true);
            if (date.isValid() && line.length == 7) {
                let transaction = {
                    date : null,
                    valueDate : null,
                    description : null,
                    chequeNo : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null,
                }
                transaction.date = line[0].trim(); 
                transaction.valueDate = line[1].trim();
                transaction.description = line[2].trim(); 
                transaction.chequeNo = line[3].trim();
                transaction.debitAmt = line[4].trim();
                transaction.creditAmt = line[5].trim();
                transaction.balance = line[6].trim();
                transactionData.push(transaction);
                counter++; 
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return(accountDetails);
}

const yesBank = (accountRawData, transactionRawData) => {
    accountRawData = accountRawData ? accountRawData.replace(/Holder's/g, ' '): []
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? transactionRawData.replace(/Holder's/g, ' '): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName : 'YES BANK',
        accNo : null,
        mobileNo : null,
        email: null,
        ifscCode : null,
        micrCode : null,
        customerId : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Period:")){
                line = line.split("Period:")?.[1]?.split("-");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            } else if (line.includes("Statement of account:")){
                accountDetails.accNo = line.split("Statement of account:")?.[1]?.trim();
            } else if (line.includes("Email:")){
                line = line.split("Email:")?.[1]?.split("IFSC Code: ");
                accountDetails.email = line[0] ? line[0].trim() : "";
                line = line[1] ? line[1].trim() : "";
                line = line.split("MICR Code:")
                accountDetails.ifscCode = line[0] ? line[0].trim() : "";
                accountDetails.micrCode = line[1] ? line[1].trim() : "";
            } else if (line.includes("Mobile No:")){
                accountDetails.mobileNo = line.split("Mobile No:")?.[1]?.trim();
            } else if (line.includes("Cust ID:")){
                accountDetails.customerId = line.split("Cust ID:")?.[1]?.trim();
            }

        });
    }

    let transactionData = [];


    noOfPages = transactionRawData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            line[0] = line[0].replace(/ /g, '/');
            const date = moment(line[0].trim(), "DD/MMM/YYYY", true);
            if (date.isValid() && line.length == 7) {
                let transaction = {
                    date : null,
                    valueDate : null,
                    chequeNo : null,
                    description : null,
                    withdrawAmt : null,
                    depositAmt : null,
                    balance : null,
                }
                transaction.date = line[0].trim(); 
                transaction.valueDate = line[1].trim();
                transaction.chequeNo = line[2].trim();
                transaction.description = line[3].trim(); 
                transaction.withdrawAmt = line[4].trim();
                transaction.depositAmt = line[5].trim();
                transaction.balance = line[6].trim();
                transactionData.push(transaction);
                counter++; 
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return (accountDetails);
} 

const hdfcBank = (accountRawData, transactionRawData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []


    let accountDetails = {
        bankName : 'HDFC BANK',
        accBranch : null,
        currency : null,
        email: null,
        customerId : null,
        accNo : null,
        accOpenDate : null,
        ifscCode : null,
        micrCode : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Account Branch :")){
                accountDetails.accBranch = line.split("Account Branch :")?.[1]?.trim();
            } else if (line.includes("State :")){
                accountDetails.accBranch = line.split("State :")?.[1]?.trim();
            } else if (line.includes("Currency :")){
                accountDetails.currency = line.split("Currency :")?.[1]?.trim();
            } else if (line.includes("Email :")){
                accountDetails.email = line.split("Email :")?.[1]?.trim();
            } else if (line.includes("Cust ID :")){
                accountDetails.customerId = line.split("Cust ID :")?.[1]?.trim();
            } else if (line.includes("Account No :")){
                accountDetails.accNo = line.split("Account No :")?.[1]?.split(" ")?.[1]?.trim();
            } else if (line.includes("A/C Open Date :")){
                accountDetails.accOpenDate = line.split("A/C Open Date :")?.[1]?.trim();
            } else if (line.includes("RTGS/NEFT IFSC:")){
                line = line.split("RTGS/NEFT IFSC:")?.[1]?.split("MICR :");
                accountDetails.ifscCode = line[0] ? line[0].trim() : "";
                accountDetails.micrCode = line[1] ? line[1].trim() : "";
            } else if (line.includes("From :")){
                line = line.split("From :")?.[1]?.split("To :");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1]?.split(" ")?.[1]?.trim() : "";
            } 
        });
    }

    let transactionData = [];

    noOfPages = transactionRawData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            const date = moment(line[0].trim(), "DD/MM/YY", true);
            if (date.isValid() && line.length == 7) {
                let transaction = {
                    date : null,
                    description : null,
                    chequeNo : null,
                    valueDate : null,
                    withdrawAmt : null,
                    depositAmt : null,
                    balance : null,
                }
                transaction.date = line[0].trim(); 
                transaction.description = line[1].trim(); 
                transaction.chequeNo = line[2].trim();
                transaction.valueDate = line[3].trim();
                transaction.withdrawAmt = line[4].trim();
                transaction.depositAmt = line[5].trim();
                transaction.balance = line[6].trim();
                transactionData.push(transaction);
                counter++; 
            }
        });
    }
    accountDetails.transactionData = transactionData;
    console.log(counter);
    return (accountDetails);
}

const federalBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName : 'FEDERAL BANK',
        name : null,
        branchName : null,
        branchSolId : null,
        accNo : null,
        customerId : null,
        mobileNo : null,
        accOpenDate : null,
        accStatus : null,
        ifscCode : null,
        micrCode : null,
        swiftCode : null,
        nomination : null,
        effectiveAvailAmt : null,
        currency : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Name:") && line.includes("Branch Name :")){
                    line = line.split("Name:")?.[1]?.split("Branch Name :");
                    accountDetails.name = line[0] ? line[0].trim() : "";
                    accountDetails.branchName = line[1] ? line[1]?.split(" ")?.[1]?.trim() : "";
            } else if (line.includes("Branch Sol Id :")){
                accountDetails.branchSolId = line.split("Branch Sol Id :")?.[1]?.trim();
            } else if (line.includes("Account Number :")){
                accountDetails.accNo = line.split("Account Number :")?.[1]?.trim();
            } else if (line.includes("Customer Id :")){
                accountDetails.customerId = line.split("Customer Id :")?.[1]?.trim();
            } else if (line.includes("Regd. Mobile Number:")){
                accountDetails.mobileNo = line.split("Regd. Mobile Number:")?.[1]?.trim();
            } else if (line.includes("Account Open Date :")){
                accountDetails.accOpenDate = line.split("Account Open Date :")?.[1]?.trim();
            } else if (line.includes("Account Status :")){
                accountDetails.accStatus = line.split("Account Status :")?.[1]?.split(" ")?.[1]?.trim();
            } else if (line.includes("IFSC:")){
                accountDetails.ifscCode = line.split("IFSC:")?.[1]?.trim();
            } else if (line.includes("MICR Code:")){
                accountDetails.micrCode = line.split("MICR Code:")?.[1]?.trim();
            } else if (line.includes("SWIFT Code:")){
                line = line.split("SWIFT Code:")?.[1]?.split("Nomination :");
                accountDetails.swiftCode = line[0] ? line[0].trim() : "";
                accountDetails.nomination = line[1] ? line[1].trim() : "";
            } else if (line.includes("Effective Available Balance :")){
                line = line.split("Effective Available Balance :")?.[1]?.split("Currency :");
                accountDetails.effectiveAvailAmt = line[0] ? line[0].trim() : "";
                accountDetails.currency = line[1] ? line[1].trim() : "";
            } else if (line.includes("Statement of Account for the period")){
                line = line.split("Statement of Account for the period")?.[1]?.split("to");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            }
        });
    }

    let transactionData = [];

    noOfPages = pyPdfData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = pyPdfData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            const date = moment(line[0].trim(), "DD/MM/YYYY", true);
            if (date.isValid() && line.length == 10) {
                let transaction = {
                    date : null,
                    valueDate : null,
                    description : null,
                    transType : null,
                    tranId : null,
                    chequeNo : null,
                    withdrawAmt : null,
                    depositAmt : null,
                    balance : null,
                    dbOrCr : null
                }
                transaction.date = line[0].trim(); 
                transaction.valueDate = line[1].trim();
                transaction.description = line[2].trim(); 
                transaction.transType = line[3].trim(); 
                transaction.tranId = line[4].trim(); 
                transaction.chequeNo = line[5].trim();
                transaction.withdrawAmt = line[6].trim();
                transaction.depositAmt = line[7].trim();
                transaction.balance = line[8].trim();
                transaction.dbOrCr = line[9].trim(); 
                transactionData.push(transaction);
                counter++; 
            }
        });
    }
    accountDetails.transactionData = transactionData;
    console.log(counter);
    return (accountDetails);
}

const bandhanBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []
    
    let accountDetails = {
        bankName : 'BANDHAN BANK',
        branchCode : null,
        branchName : null,
        branchPhoneNo : null,
        branchEmail : null,
        ifscCode : null,
        micrCode : null,
        branchGSTIN : null,
        customerId : null,
        accNo : null,
        openingBalance : null,
        closingBalance : null,
        transactionData : null
    }

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
           if (line.includes("Branch Code :")){
                accountDetails.branchCode = line.split("Branch Code :")?.[1]?.trim();
            } else if (line.includes("Branch Name :")){
                accountDetails.branchName = line.split("Branch Name :")?.[1]?.trim();
            } else if (line.includes("Branch Phone No. :")){
                accountDetails.branchPhoneNo = line.split("Branch Phone No. :")?.[1]?.trim();
            } else if (line.includes("Branch Email ID :")){
                accountDetails.branchEmail = line.split("Branch Email ID :")?.[1]?.trim();
            } else if (line.includes("IFSC :")){
                accountDetails.ifscCode = line.split("IFSC :")?.[1]?.trim();
            } else if (line.includes("MICR Code :")){
                accountDetails.micrCode = line.split("MICR Code :")?.[1]?.trim();
            } else if (line.includes("Branch GSTIN :")){
                accountDetails.branchGSTIN = line.split("Branch GSTIN :")?.[1]?.trim();
            } else if (line.includes("Customer Number :")){
                accountDetails.customerId = line.split("Customer Number :")?.[1]?.trim();
            } else if (line.includes("Account Number :")){
                accountDetails.accNo = line.split("Account Number :")?.[1]?.trim();
            } else if (line.includes("Opening Balance :")){
                line = line.split("Opening Balance :")?.[1]?.split("Closing Balance :");
                accountDetails.openingBalance = line[0] ? line[0].trim() : "";
                accountDetails.closingBalance = line[1] ? line[1].trim() : "";
            }
        });
    }

    let transactionData = [];

    noOfPages = pyPdfData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = pyPdfData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            const date = moment(line[0].trim(), "DD/MM/YYYY", true);
            if (date.isValid() && line.length == 5) {
                let transaction = {
                    date : null,
                    description : null,
                    dbOrCr : null,
                    amount : null,
                    balance : null,
                }
                transaction.date = line[0].trim(); 
                transaction.description = line[1].trim();
                transaction.dbOrCr = line[2].trim(); 
                transaction.amount = line[3].trim(); 
                transaction.balance = line[4].trim(); 
                transactionData.push(transaction);
                counter++; 
            }
        });
    }
    accountDetails.transactionData = transactionData;
    console.log(counter);
    return (accountDetails);
}

const equitasBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []
    
    let accountDetails = {
        bankName : 'EQUITAS BANK',
        accHolderName : null,
        branchName : null,
        mobileNo : null,
        email : null,
        productName : null,
        accType : null,
        ifscCode : null,
        accNo : null,
        ucic : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Customer Name :")){
                line = line.split("Customer Name :")?.[1]?.split("Branch Name :");
                accountDetails.accHolderName = line[0] ? line[0].trim() : "";
                accountDetails.branchName = line[1] ? line[1].trim() : "";
            } else if (line.includes("Mobile :")){
                accountDetails.mobileNo = line.split("Mobile :")?.[1]?.split(" ")?.[1]?.trim();
            } else if (line.includes("Email :")){
                line = line.split("Email :")?.[1]?.split("Product Name :");
                accountDetails.email = line[0] ? line[0].trim() : "";
                accountDetails.productName = line[1] ? line[1].trim() : "";
            } else if (line.includes("Account Type :")){
                accountDetails.accType = line.split("Account Type :")?.[1]?.trim();
            } else if (line.includes("IFSC Code :")){
                accountDetails.ifscCode = line.split("IFSC Code :")?.[1]?.trim();
            } else if (line.includes("UCIC :")){
                accountDetails.ucic = line.split("UCIC :")?.[1]?.trim();
            } else if (line.includes("Acount Number :")){
                accountDetails.accNo = line.split("Acount Number :")?.[1]?.trim();
            } else if (line.includes("Statement Period :")){
                    line = line.split("Statement Period :")?.[1]?.split("to");
                    accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                    accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            }
        });
    }

    let transactionData = [];

    noOfPages = pyPdfData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = pyPdfData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            // console.log(line, line.length);
            const date = moment(line[0].trim(), "DD-MM-YYYY", true);
            if (date.isValid() && line.length == 6) {
                let transaction = {
                    date : null,
                    referenceNo : null,
                    description : null,
                    withdrawAmt : null,
                    depositAmt : null,
                    balance : null,
                }
                transaction.date = line[0].trim(); 
                transaction.referenceNo = line[1].trim();
                transaction.description = line[2].trim(); 
                transaction.withdrawAmt = line[3].trim(); 
                transaction.depositAmt = line[4].trim(); 
                transaction.balance = line[5].trim(); 
                transactionData.push(transaction);
                counter++; 
            }
        });
    }
    accountDetails.transactionData = transactionData;
    console.log(counter);
    return (accountDetails);
}

const stateBankOfIndia = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

   
    let accountDetails = {
        bankName : 'STATE BANK OF INDIA',
        accHolderName : null,
        accNo : null,
        branchName : null,
        cifNo : null,
        ifscCode : null,
        micrCode : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData : null
    }

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            // console.log(line);
          
            if (line.includes("Account Name:")){
                accountDetails.accHolderName = line.split("Account Name:")?.[1]?.trim();
            } else if (line.includes("Account Number:")){
                accountDetails.accNo = line.split("Account Number:")?.[1]?.trim();
            } else if (line.includes("Branch:")){
                accountDetails.branchName = line.split("Branch:")?.[1]?.trim();
            } else if (line.includes("CIF No.:")){
                accountDetails.cifNo = line.split("CIF No.:")?.[1]?.trim();
            } else if (line.includes("IFS Code:")){
                accountDetails.ifscCode = line.split("IFS Code:")?.[1]?.trim();
            } else if (line.includes("MICR Code")){
                accountDetails.micrCode = line.split("MICR Code")?.[1]?.trim();
            } else if (line.includes("Account Statement from ")){
                line = line.split("Account Statement from ")?.[1]?.split("to");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            }
        });
    }

    let transactionData = [];

    noOfPages = pyPdfData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = pyPdfData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            line[0] = line[0].replace(/\r/g, ' ');
            line[0] = line[0].replace(/ /g, '/');
            const date = moment(line[0].trim(), "DD/MMM/YYYY", true);
            if (date.isValid() && line.length == 8) {
                let transaction = {
                    date : null,
                    valueDate : null,
                    description : null,
                    chequeNo : null,
                    branchCode : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null,
                }
                transaction.date = line[0].trim(); 
                transaction.valueDate = line[1].trim(); 
                transaction.description = line[2].trim();
                transaction.chequeNo = line[3].trim(); 
                transaction.branchCode = line[4].trim(); 
                transaction.debitAmt = line[5].trim(); 
                transaction.creditAmt = line[6].trim(); 
                transaction.balance = line[7].trim(); 
                transactionData.push(transaction);
                counter++; 
            }
        });
    }
    accountDetails.transactionData = transactionData;
    console.log(counter);
    return (accountDetails);
}

const idfcBank = (accountData, transactionRawData, pyPdfData) => {
    accountData = accountData ? JSON.parse(accountData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName: 'IDFC First Bank',
        customerId : null,
        accNo: null,
        transactionFrom: null,
        transactionTo: null,
        accHolderName : null,
        branch: null,
        email : null,
        ifscCode: null,
        phoneNo: null,
        micr : null,
        nomination : null,
        accOpenDate : null,
        accStatus : null,
        accType : null,
        currency : null,
        transactionData: null,
    };
    
    let transactionData = [];

    //Account Details
    let noOfPages = accountData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("CUSTOMER ID :")) {
                accountDetails.customerId = line.split("CUSTOMER ID :")?.[1]?.trim();
            } else if(line.includes("ACCOUNT NO :")) {
                accountDetails.accNo = line.split("ACCOUNT NO :")?.[1]?.trim();
            } else if(line.includes("STATEMENT PERIOD :")) {
                line = line.split("STATEMENT PERIOD :")?.[1]?.split("TO");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            } else if(line.includes("CUSTOMER NAME :")) {
                line = line.split("CUSTOMER NAME :")?.[1]?.split("ACCOUNT BRANCH :");
                accountDetails.accHolderName = line[0] ? line[0].trim() : "";
                accountDetails.branch = line[1] ? line[1].trim() : "";
            } else if(line.includes("EMAIL ID :")) {
                line = line.split("EMAIL ID :")?.[1]?.split("IFSC  :");
                accountDetails.email = line[0] ? line[0].trim() : "";
                accountDetails.ifscCode = line[1] ? line[1].trim() : "";
            } else if(line.includes("PHONE NO :")) {
                line = line.split("PHONE NO :")?.[1]?.split("MICR  :");
                accountDetails.phoneNo = line[0] ? line[0].trim() : "";
                accountDetails.micr = line[1] ? line[1].trim() : "";
            } else if(line.includes("NOMINATION :")) {
                line = line.split("NOMINATION :")?.[1]?.split("ACCOUNT OPENING DATE  :");
                accountDetails.nomination = line[0] ? line[0].trim() : "";
                accountDetails.accOpenDate = line[1] ? line[1].trim() : "";
            } else if(line.includes("ACCOUNT STATUS  :")) {
                accountDetails.accStatus = line.split("ACCOUNT STATUS  :")?.[1]?.trim();
            } else if(line.includes("ACCOUNT TYPE  :")) {
                accountDetails.accType = line.split("ACCOUNT TYPE  :")?.[1]?.trim();
            } else if(line.includes("CURRENCY  :")) {
                accountDetails.currency = line.split("CURRENCY  :")?.[1]?.trim();
            }
        });
    }

    //Transaction Data
    counter = 0;
    noOfPages = transactionRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = transactionRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            const date = moment(line[0], "DD-MMM-YYYY", true);
            if (date.isValid() && line.length === 7) {
                let transaction = {
                    date : null,
                    valueDate : null,
                    particulars : null,
                    chequeNo : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null
                }
                transaction.date = line[0];
                transaction.valueDate = line[1];
                transaction.particulars = line[2];
                transaction.chequeNo = line[3];
                transaction.debitAmt = line[4];
                transaction.creditAmt = line[5];
                transaction.balance = line[6];
                transactionData.push(transaction)
                counter++;
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return(accountDetails);

}

const canaraBank = (accountData, transactionRawData, pyPdfData) => {
    accountData = accountData ? JSON.parse(accountData.replace(/\b(Holder's|Person's)\b/g, "").replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

 let accountDetails = {
        bankName: 'CANARA BANK',
        branch: null,
        ifscCode: null,
        micr : null,
        accNo: null,
        productName : null,
        customerId : null,
        customerName : null,
        nomineeRefNum : null,
        nomineeName : null,
        accountTitle : null,
        transactionData: null,
    };
    
    let transactionData = [];
    let noOfPages = accountData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Account Branch :")) {
                accountDetails.branch = line.split("Account Branch :")?.[1]?.trim();
            } else if(line.includes("IFSC :")) {
                accountDetails.ifscCode = line.split("IFSC :")?.[1]?.trim();
            } else if(line.includes("MICR :")) {
                accountDetails.micr = line.split("MICR :")?.[1]?.trim();
            } else if(line.includes("Account No :")) {
                accountDetails.accNo = line.split("Account No :")?.[1]?.trim();
            } else if(line.includes("Product Name :")) {
                accountDetails.productName = line.split("Product Name :")?.[1]?.trim();
            } else if(line.includes("Customer ID :")) {
                accountDetails.customerId = line.split("Customer ID :")?.[1]?.trim();
            } else if(line.includes("Customer Name :")) {
                accountDetails.customerName = line.split("Customer Name :")?.[1]?.trim();
            } else if(line.includes("Nominee Reference num:")) {
                accountDetails.nomineeRefNum = line.split("Nominee Reference num:")?.[1]?.trim();
            } else if(line.includes("Nominee Name :")) {
                accountDetails.nomineeName = line.split("Nominee Name :")?.[1]?.trim();
            } else if(line.includes("Account Title :")) {
                accountDetails.accountTitle = line.split("Account Title :")?.[1]?.trim();
            }
        });
    }

    counter = 0;
    noOfPages = pyPdfData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = pyPdfData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            const date = moment(line[0].trim(), "DD-MMM-YY", true);
            if (date.isValid()) {
                let transaction = {
                    transDate : null,
                    valueDate : null,
                    branch : null,
                    chequeNo : null,
                    description : null,
                    withdrawAmt : null,
                    depositAmt : null,
                    balance : null
                }
                transaction.transDate = line[0];
                transaction.valueDate = line[1];
                transaction.branch = line[2];
                transaction.chequeNo = line[3];
                transaction.description = line[4].replace(/\r/g, ' ');
                transaction.withdrawAmt = line[5];
                transaction.depositAmt = line[6];
                transaction.balance = line[7];
                transactionData.push(transaction)
                counter++;
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const chattisgarhRajyaGraminBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName: 'CHHATTISGARH RAJYA GRAMIN BANK',
        accHolderName : null,
        cifNo : null,
        email : null,
        accNo : null,
        secondHolderName : null,
        ifscCode : null,
        micrCode : null,
        transactionFrom: null,
        transactionTo: null,
        date : null,
        time : null,
        branchCode : null,
        transactionData: null,
    };

    let transactionData = [];

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("CHHATTISGARH RAJYA GRAMIN BANK")) {
                line = line.split("CHHATTISGARH RAJYA GRAMIN BANK");
                accountDetails.accHolderName = line[0] ? line[0].trim() : "";
            } else if (line.includes("CIF No. :")) {
                line = line.split("CIF No. : ")?.[0]?.split(" ");
                accountDetails.cifNo = line[1] ? line[1].trim() : "";
            } else if (line.includes("Email :")) {
                line = line.split("Email :")?.[1]?.split("Branch Code :")
                accountDetails.email = line[0] ? line[0].trim() : "";
                accountDetails.branchCode = line[1] ? line[1].trim() : "";
            } else if (line.includes("Account No. :")) {
                line = line.split("Account No. :")?.[1]?.split("Date :")
                accountDetails.accNo = line[0] ? line[0].trim() : "";
                accountDetails.date = line[1] ? line[1].trim() : "";
            } else if (line.includes("Second Holder Name :")) {
                line = line.split("Second Holder Name :")?.[1]?.split("Time :")
                accountDetails.secondHolderName = line[0] ? line[0].trim() : "";
                accountDetails.time = line[1] ? line[1].trim() : "";
            } else if (line.includes("IFSC code :")) {
                line = line.split("IFSC code :")?.[1]?.split("MICR Code :")
                accountDetails.ifscCode = line[0] ? line[0].trim() : "";
                accountDetails.micrCode = line[1] ? line[1].trim() : "";
            } else if (line.includes("Statement of Account  From : :") && line.includes("To :")) {
                line = line.split("Statement of Account  From : :")?.[1]?.split("To :");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            }
        });
    }

    
    
     //Transaction Details
     noOfPages = pyPdfData.length;
     let counter = 0;
     for (let i = 0; i < noOfPages; i++) {
         let page = pyPdfData?.[i]?.data;
         page?.forEach( object => {
             let line = object.map(obj => obj.text);
             const date = moment(line[0].trim(), "DD-MM-YYYY", true);
             if (date.isValid() && line.length === 7) {
                // console.log(line, line.length);
                 let transaction = {
                     date : null,
                     valueDate : null,
                     narration : null,
                     chequeNo : null,
                     debitAmt : null,
                     creditAmt : null,
                     balance : null
                 }
                 transaction.date = line[0].trim(); 
                 transaction.valueDate = line[1].trim(); 
                 transaction.narration = line[2].trim(); 
                 transaction.chequeNo = line[3].trim();
                 transaction.debitAmt = line[4].trim();
                 transaction.creditAmt = line[5].trim();
                 transaction.balance = line[6].trim();
                 transactionData.push(transaction);
                 counter++; 
             }
         });
     }
    //  console.log("counter - ", counter, "expected - 26");
     accountDetails.transactionData = transactionData;
    
    // console.log(accountDetails);


    return (accountDetails);
}

const indusindBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? accountRawData.replace(/\\r/g, ' '): []
    accountRawData = accountRawData ? accountRawData.replace(/\"reachus@indusind.com\"/g, ''): []
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    // transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    
    pyPdfData = pyPdfData ? pyPdfData.replace(/\\r/g, ' '): []
    pyPdfData = pyPdfData ? pyPdfData.replace(/\"reachus@indusind.com\"/g, ''): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []


    let accountDetails = {
        bankName: 'Induslnd Bank',
        accHolderName : null,
        date : null,
        transactionFrom: null,
        transactionTo: null,
        customerId : null,
        accNo: null,
        accType : null,
        currency : null,
        effectiveAvailBal : null,
        transactionData: null,
    };
    
    let transactionData = [];
    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Generation Date:")) {
                line = line.split("Generation Date:");
                accountDetails.date = line[1] ? line[1].trim() : "";
                accountDetails.accHolderName = line[0] ? line[0].trim() : "";
            } else if (line.includes("Period:") && line.includes("To")) {
                line = line.split("Period:")?.[1]?.split("To");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            }  else if (line.includes("Customer Id:")) {
                accountDetails.customerId = line.split("Customer Id:")?.[1]?.trim();
            } else if (line.includes("Account No:")) {
                accountDetails.accNo = line.split("Account No:")?.[1]?.trim();
            } else if (line.includes("Account Type:")) {
                accountDetails.accType = line.split("Account Type:")?.[1]?.trim();
            } else if (line.includes("Currency:")) {
                accountDetails.currency = line.split("Currency:")?.[1]?.trim();
            } else if (line.includes("Effective Available Balance :")) {
                accountDetails.effectiveAvailBal = line.split("Effective Available Balance :")?.[1]?.trim();
            }
        });
    }


     //Transaction Details
     noOfPages = pyPdfData.length;
     let counter = 0;
     for (let i = 0; i < noOfPages; i++) {
         let page = pyPdfData?.[i]?.data;
         page?.forEach( object => {
             let line = object.map(obj => obj.text);
             const date = moment(line[0].trim(), "DD-MMM-YYYY", true);
             if (date.isValid()) {
                 let transaction = {
                     date : null,
                     particulars : null,
                     chequeNo : null,
                     withdrawAmt : null,
                     depositAmt : null,
                     balance : null
                 }
                 transaction.date = line[0].trim(); 
                 transaction.particulars = line[1].trim(); 
                 transaction.chequeNo = line[2].trim(); 
                 transaction.withdrawAmt = line[3].trim();
                 transaction.depositAmt = line[4].trim();
                 transaction.balance = line[5].trim();
                 transactionData.push(transaction);
                 counter++; 
             }
         });
     }
    //  console.log("counter - ", counter, "expected - 70+2");
     accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const barodaGujaratGraminBank = (accountRawData, transactionRawData, pyPdfData) => {
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []


    let accountDetails = {
        bankName: 'Baroda Gujarat Gramin Bank',
        accHolderName : null,
        accNo : null,
        currencyCode : null,
        branchName : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData: null,
    };

    let transactionData = [];

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("Account Title")) {
                accountDetails.accHolderName = line.split("Account Title ")?.[1]?.trim();
            } else if (line.includes("Account Number")) {
                accountDetails.accNo = line.split("Account Number")?.[1]?.trim();
            } else if (line.includes("Currency Code")) {
                accountDetails.currencyCode = line.split("Currency Code")?.[1]?.trim();
            } else if (line.includes("Branch Name")) {
                accountDetails.branchName = line.split("Branch Name")?.[1]?.trim();
            } else if (line.includes("From") && line.includes("to")) {
                line = line.split("From")?.[1]?.split("to");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            } 
        });
    }

     //Transaction Details
     noOfPages = pyPdfData.length;
     let counter = 0;
     for (let i = 0; i < noOfPages; i++) {
         let page = pyPdfData?.[i]?.data;
         page?.forEach( object => {
             let line = object.map(obj => obj.text);
             const date = moment(line[1].trim(), "DD/MM/YY", true);
             if (date.isValid() && line.length === 8) {
                 let transaction = {
                     srNo : null,
                     date : null,
                     description : null,
                     chequeNo : null,
                     debitAmt : null,
                     creditAmt : null,
                     balance : null,
                     valueDate : null,
                 }
                 transaction.srNo = line[0].trim(); 
                 transaction.date = line[1].trim(); 
                 transaction.description = line[2].trim(); 
                 transaction.chequeNo = line[3].trim();
                 transaction.debitAmt = line[4].trim();
                 transaction.creditAmt = line[5].trim();
                 transaction.balance = line[6].trim();
                 transaction.valueDate = line[7].trim();
                 transactionData.push(transaction);
                 counter++; 
             }
         });
     }
    accountDetails.transactionData = transactionData;
    return (accountDetails)
}

const bankOfMaharashtra = (accountRawData, transactionRawData, pyPdfData) => {
    
    accountRawData = accountRawData ? accountRawData.replace(/Maharashtra's/g, ''): []
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    // transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []



    let accountDetails = {
        bankName: 'Bank of Maharashtra',
        accHolderName : null,
        branchNo : null,
        branchIFSC : null,
        branchName : null,
        branchGSTIN : null,
        accNo : null,
        mobileNo : null,
        email : null,
        totalBalance : null,
        clearBalance : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData: null,
    };

    let transactionData = [];

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            // console.log(line);
            if (line.includes("Branch No :")) {
                accountDetails.accHolderName = line.split("Branch No : ")?.[0]?.trim();
                accountDetails.branchNo = line.split("Branch No : ")?.[1]?.trim();
            } else if (line.includes("Branch IFSC :")) {
                accountDetails.branchIFSC = line.split("Branch IFSC :")?.[1]?.trim();
            } else if (line.includes("Branch Name :")) {
                accountDetails.branchName = line.split("Branch Name :")?.[1]?.trim();
            } else if (line.includes("Mobile :") && line.includes("Branch GSTIN :")) {
                    line = line.split("Mobile :")?.[1]?.split("Branch GSTIN :");
                    accountDetails.mobileNo = line[0] ? line[0].trim() : "";
                    accountDetails.branchGSTIN = line[1] ? line[1].trim() : "";
            } else if (line.includes("Email :") && line.includes("Account No :")) {
                line = line.split("Email :")?.[1]?.split("Account No :");
                accountDetails.email = line[0] ? line[0].trim() : "";
                accountDetails.accNo = line[1] ? line[1].trim() : "";
            } else if (line.includes("Total Balance :")) {
                accountDetails.totalBalance = line.split("Total Balance :")?.[1]?.trim();
            } else if (line.includes("Clear Balance :")) {
                accountDetails.clearBalance = line.split("Clear Balance :")?.[1]?.trim();
            } else if (line.includes("from") && line.includes("to")) {
                line = line.split("from")?.[1]?.split("to");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            }
        });
    }

    //Transaction Details
    noOfPages = pyPdfData.length;
    let counter = 0;
    for (let i = 0; i < noOfPages; i++) {
        let page = pyPdfData?.[i]?.data;
        page?.forEach( object => {
            let line = object.map(obj => obj.text);
            const date = moment(line[0].trim(), "DD/MM/YYYY", true);
            if (date.isValid() && line.length === 8) {
                let transaction = {
                    date : null,
                    type : null,
                    particulars : null,
                    chequeNo : null,
                    debitAmt : null,
                    creditAmt : null,
                    balance : null,
                    channel : null,
                }
                transaction.date = line[0].trim(); 
                transaction.type = line[1].trim(); 
                transaction.particulars = line[2].trim(); 
                transaction.chequeNo = line[3].trim();
                transaction.debitAmt = line[4].trim();
                transaction.creditAmt = line[5].trim();
                transaction.balance = line[6].trim();
                transaction.channel = line[7].trim();
                transactionData.push(transaction);
                counter++; 
            }
        });
    }
    accountDetails.transactionData = transactionData;
    return (accountDetails);
}

const jilaSahakariKendriyaBank = (accountRawData, transactionRawData, pyPdfData) => {
    //No transaction data or pypdf data
    accountRawData = accountRawData ? JSON.parse(accountRawData.replace(/'/g, '"')): []
    transactionRawData = transactionRawData ? JSON.parse(transactionRawData.replace(/'/g, '"')): []
    pyPdfData = pyPdfData ? JSON.parse(pyPdfData.replace(/'/g, '"')): []

    let accountDetails = {
        bankName: 'Jila Sahakari Kendriya Bank',
        cifNo : null,
        branchCode : null,
        email : null,
        accNo : null,
        date : null,
        clearBalance : null,
        transactionFrom : null,
        transactionTo : null,
        transactionData: null,
    };

    let transactionData = [];

    let noOfPages = accountRawData.length;
    for (let i = 0; i < noOfPages; i++) {
        let page = accountRawData?.[i]?.data;
        page?.forEach( object => {
            let line = object.reduce((acc, obj) => acc + obj.text + " ", '');
            if (line.includes("CIF No :") && line.includes("Branch Code :")) {
                line = line.split("CIF No :")?.[1]?.split("Branch Code :");
                accountDetails.cifNo = line[0] ? line[0].trim() : "";
                accountDetails.branchCode = line[1] ? line[1].trim() : "";
            } else if (line.includes("Account No:") && line.includes("Date :")) {
                line = line.split("Account No:")?.[1]?.split("Date :");
                accountDetails.accNo = line[0] ? line[0].trim() : "";
                accountDetails.date = line[1] ? line[1].trim() : "";
            } else if (line.includes("Email :")) {
                accountDetails.email = line.split("Email :")?.[1]?.trim();
            } else if (line.includes("Cleared Balance :")) {
                accountDetails.clearBalance = line.split("Cleared Balance :")?.[1]?.split(" ").filter(s => s.length > 0)?.[0]?.trim();
            } else if (line.includes("From :") && line.includes("To :")) {
                line = line.split("From :")?.[1]?.split("To :");
                accountDetails.transactionFrom = line[0] ? line[0].trim() : "";
                accountDetails.transactionTo = line[1] ? line[1].trim() : "";
            }
        });
    }
      //Transaction Details
      noOfPages = pyPdfData.length;
      let counter = 0;
      for (let i = 0; i < noOfPages; i++) {
          let page = pyPdfData?.[i]?.data;
          page?.forEach( object => {
              let line = object.map(obj => obj.text);
              const date = moment(line[0].trim(), "DD/MM/YY", true);
              if (date.isValid() && line.length === 7) {
                  let transaction = {
                      date : null,
                      valueDate : null,
                      details : null,
                      chequeNo : null,
                      debitAmt : null,
                      creditAmt : null,
                      balance : null,
                  }
                  transaction.date = line[0].trim(); 
                  transaction.valueDate = line[1].trim(); 
                  transaction.details = line[2].trim(); 
                  transaction.chequeNo = line[3].trim();
                  transaction.debitAmt = line[4].trim();
                  transaction.creditAmt = line[5].trim();
                  transaction.balance = line[6].trim();
                  transactionData.push(transaction);
                  counter++; 
              }
          });
      }
    accountDetails.transactionData = transactionData;
    // console.log("Expected - 50 Total -", counter);
    // console.log(accountDetails);
    return (accountDetails);
}



//SID

const bankOfIndia = (accountData, transactionData) => {

    accountData = JSON.parse(accountData.replace(/'/g, '"'))
    //data sorting with account details
    let BankStatement = {
        AIM_ID: null,
        Email: null,
        Franchaisee_Name: null,
        Master_Franchisee_Name: null,
        Mobile_No: null,
        Pan_No: null,
        Site_Address: null,
        Account_Name: null,
        Account_Type: null,
        Customer_ID: null,
        Account_Number: null,
        Customer_Address: null,
        Customer_Pincode: null,
        Customer_City: null,
        Bank_Address: '',
        Bank_City: '',
        Bank_Pincode: '',
        IFSC_Code: null,
        Bank_Name: 'Bank Of India',
        Bank_Branch: null,
        Proprietor_Name: null,
        Opening_Balance: null,
        Closing_Balance: null,
        MICR_CODE: null,
        Branch_Code: null,
        Client_Code: null,
        Currency_Code : '',
        Branch_Of_OwnerShip: '',
    }
    // return accountData
    accountData?.forEach( page => {
        page.data?.forEach(row => {
            if(row[0]?.text.includes('Customer ID')) {
                BankStatement.Customer_ID = row[0].text.split(' ')[2]
            }
            if(row[0]?.text.includes('Account No')) {
                BankStatement.Account_Number = row[0].text.split(' ')[2]
            }
        })
    })
    data = JSON.parse(transactionData.replace(/'/g, '"'))

    //transactions sorting
    let sortedData = data.map((item, index) => {

        let pageData = item.data.map(row => {
            return row.map(item => ({text: item.text ? replaceAll(item.text, '\r', ' ')  : item.text }))
        })

        return pageData
    }).slice(1)
    sortedData = sortedData.flat(1)
    let bankStatementTransactions = sortedData.map((item, index) => {
        if(index == 0) {
            return undefined
        } 

        return {
            [`${sortedData[0][0].text.replace(' ', '_')}`] : item[0].text,
            [`${sortedData[0][1].text.replace(' ', '_')}`] : item[1].text,
            [`${sortedData[0][2].text.replace(' ', '_')}`] : item[2].text,
            [`${sortedData[0][3].text.replace(' ', '_')}`] : item[3].text,
            [`${sortedData[0][4].text.replace(' ', '_')}`] : item[4].text,
            [`${sortedData[0][5].text.replace(' ', '_')}`] : item[5].text,

        }

    }).filter(v => v !== undefined)

    return {BankStatement, bankStatementTransactions}
}

const punjabNationalBank = (accountData, transactionData) => {
    // console.log(data)
    accountData = JSON.parse(accountData.replace(/'/g, '"'))

//data sorting with account details
    let BankStatement = {
        AIM_ID: null,
        Email: null,
        Franchaisee_Name: null,
        Master_Franchisee_Name: null,
        Mobile_No: null,
        Pan_No: null,
        Site_Address: null,
        Account_Name: null,
        Account_Type: null,
        Account_Number: null,
        Customer_Address: null,
        Customer_Pincode: null,
        Customer_City: null,
        Bank_Address: '',
        Bank_City: '',
        Bank_Pincode: '',
        IFSC_Code: null,
        Bank_Name: 'Punjab National Bank',
        Bank_Branch: null,
        Proprietor_Name: null,
        Opening_Balance: null,
        Closing_Balance: null,
        MICR_CODE: null,
        Branch_Code: null,
        Client_Code: null
    }
    // return accountData
    let onCustomerDetails = false;
    accountData?.forEach( page => {
        page.data?.forEach(row => {
            if(row[1]?.text.includes('Account Statement for the Account')) {
                BankStatement.Account_Number = row[1].text.split(':')[1]
            }
            if(row[0]?.text.includes('Branch Name')) {
                BankStatement.Bank_Branch = row[1].text
            }
            if(row[0]?.text.includes('Branch Address')) {
                BankStatement.Bank_Address = row[1].text
            }
            if(row[0]?.text.includes('City:' && !onCustomerDetails)) {
                BankStatement.Bank_City = row[1].text
            }
            if(row[0]?.text.includes('Pin:') && !onCustomerDetails) {
                BankStatement.Bank_Pincode = row[1].text
            }
            if(row[0]?.text.includes('IFSC Code:')) {
                BankStatement.IFSC_Code = row[1].text
            }
            if(row[0]?.text.includes('Customer Details:')){
                onCustomerDetails = true
            }
            if(row[0]?.text.includes('Customer Name:')) {
                BankStatement.Account_Name = row[1].text
            }
            if(row[0]?.text.includes('Customer Address:')) {
                BankStatement.Customer_Address = row[1].text
            }
            if(row[0]?.text.includes('City:') && onCustomerDetails) {
                BankStatement.Customer_City = row[1].text
            }
            if(row[0]?.text.includes('Pin:') && onCustomerDetails) {
                BankStatement.Customer_Pincode = row[1].text
                onCustomerDetails = false
            }
        })
    })

    //transactions sorting
    data = JSON.parse(transactionData.replace(/'/g, '"'))
    let sortedData = [];
    // console.log(Array.isArray(data))
    if (Array.isArray(data) && data.length > 0) {
        for (let p = 0; p < data.length; p++) {
            let page = data[p].data;

            if (p != 0) {
                page = page.slice(1);
                // console.log(pageData.slice(1))
            }
            // console.log("page", page)
            for (let r = 0; r < page.length; r++) {
                let row = page[r];
                let text = row[0].text;
                // console.log("row")
                if (text == '' || text == 'Date') {
                    let lastElementPosition = sortedData.length > 0 ? sortedData.length - 1 : sortedData.length;

                    sortedData[lastElementPosition][0].text = sortedData[lastElementPosition][0].text + (row[0].text ? ' ' + row[0].text : row[0].text);
                    sortedData[lastElementPosition][1].text = sortedData[lastElementPosition][1].text + (row[1].text ? ' ' + row[1].text : row[1].text);
                    sortedData[lastElementPosition][2].text = sortedData[lastElementPosition][2].text + (row[2].text ? ' ' + row[2].text : row[2].text);
                    sortedData[lastElementPosition][3].text = sortedData[lastElementPosition][3].text + (row[3].text ? ' ' + row[3].text : row[3].text);
                    sortedData[lastElementPosition][4].text = sortedData[lastElementPosition][4].text + (row[4].text ? ' ' + row[4].text : row[4].text);
                    sortedData[lastElementPosition][5].text = sortedData[lastElementPosition][5].text + (row[5].text ? ' ' + row[5].text : row[5].text);
                    
                } else {
                    row = row.map(item => {
                        return {
                            text: item.text ? replaceAll(item.text, '\r', ' ') : item.text
                        }
                    })
                    sortedData.push(row)
                }
            }
        }
    }
    let bankStatementTransactions = sortedData.map((item, index) => {
        if(index == 0) {
            return undefined
        } 

        return {
            [`${sortedData[0][0].text.replace(' ', '_')}`] : item[0].text,
            [`${sortedData[0][1].text.replace(' ', '_')}`] : item[1].text,
            [`${sortedData[0][2].text.replace(' ', '_')}`] : item[2].text,
            [`${sortedData[0][3].text.replace(' ', '_')}`] : item[3].text,
            [`${sortedData[0][4].text.replace(' ', '_')}`] : item[4].text,
            [`${sortedData[0][5].text.replace(' ', '_')}`] : item[5].text,
        }

    }).filter(v => v !== undefined)

    return {BankStatement, bankStatementTransactions}
}

const ucoBank = (accountData, transactionData) => {
    accountData = JSON.parse(accountData.replace(/'/g, '"'))
    //data sorting with account details
    let BankStatement = {
        AIM_ID: null,
        Email: null,
        Franchaisee_Name: null,
        Master_Franchisee_Name: null,
        Mobile_No: null,
        Pan_No: null,
        Site_Address: null,
        Account_Name: null,
        Account_Type: null,
        Account_Number: null,
        Bank_Address: '',
        IFSC_Code: null,
        Bank_Name: 'UCO Bank',
        Bank_Branch: null,
        Proprietor_Name: null,
        Opening_Balance: null,
        Closing_Balance: null,
        MICR_CODE: null,
        Branch_Code: null,
        Client_Code: null
    }
    // return accountData
    let addresOn = false
    accountData?.forEach( page => {
        page.data?.forEach(row => {
            if(row[0]?.text.includes('Statement for A/c')) {
                BankStatement.Account_Number = row[0].text.split(' ')[3]
            }
            if(row[0]?.text.includes('Client Code')) {
                BankStatement.Client_Code = row[0].text.split(' ')[2]
            }
            if(row[0]?.text.includes('Branch Code')) {
                BankStatement.Branch_Code = row[0].text.split('Branch Code')[1]
            }
            if(row[0]?.text.includes('Name') && !row[0]?.text.includes('Branch Name')) {
                let name = row[0].text.split('IFSC Code')[0]
                BankStatement.Account_Name = name.split('Name')[1]
            }
            if(row[0]?.text.includes('IFSC Code')) {
                BankStatement.IFSC_Code = row[0].text.split('IFSC Code')[1]
            }
            if(row[0]?.text.includes('Branch Name')) {
                BankStatement.Bank_Branch = row[0].text.split('Branch Name')[1]
            }
            // if(addresOn){
            //     if(row[0].text.includes('Phone')) {
            //         BankStatement.Branch_Code = row[2].text.split(':')[1]
            //         addresOn = false
            //     } else { 
            //         BankStatement.Bank_Address = BankStatement.Bank_Address + ' ' + row[2].text
            //     }
            // }
            // if(row[0]?.text.includes('Address')) {
            //     addresOn = true
            // }
            if(row[0]?.text.includes('Phone')) {
                BankStatement.Mobile_No = row[0].text.split('Phone')[1]
            }
            // if(row[0]?.text.includes('Email')) {
            //     BankStatement.Email = row[0].text.split(':')[1]
            // }
        })
    })

    //transactions sorting
    data = JSON.parse(transactionData.replace(/'/g, '"'))
    let sortedData = [];
    // console.log(Array.isArray(data))
    if (Array.isArray(data) && data.length > 0) {
        for (let p = 0; p < data.length; p++) {
            let page = data[p].data;

            if (p != 0) {
                page = page.slice(1);
                // console.log(pageData.slice(1))
            }
            // console.log("page", page)
            for (let r = 0; r < page.length; r++) {
                let row = page[r];
                let text = row[0].text;
                // console.log("row")
                if (text == '') {
                    let lastElementPosition = sortedData.length > 0 ? sortedData.length - 1 : sortedData.length;

                    sortedData[lastElementPosition][0].text = sortedData[lastElementPosition][0].text + (row[0].text ? ' ' + row[0].text : row[0].text);
                    sortedData[lastElementPosition][1].text = sortedData[lastElementPosition][1].text + (row[1].text ? ' ' + row[1].text : row[1].text);
                    sortedData[lastElementPosition][2].text = sortedData[lastElementPosition][2].text + (row[2].text ? ' ' + row[2].text : row[2].text);
                    sortedData[lastElementPosition][3].text = sortedData[lastElementPosition][3].text + (row[3].text ? ' ' + row[3].text : row[3].text);
                    sortedData[lastElementPosition][4].text = sortedData[lastElementPosition][4].text + (row[4].text ? ' ' + row[4].text : row[4].text);
                    sortedData[lastElementPosition][5].text = sortedData[lastElementPosition][5].text + (row[5].text ? ' ' + row[5].text : row[5].text);
                    
                } else {
                    row = row.map(item => {
                        return {
                            text: item.text ? replaceAll(item.text, '\r', ' ') : item.text
                        }
                    })
                    sortedData.push(row)
                }
            }
        }
    }

    let bankStatementTransactions = sortedData.map((item, index) => {
        if(index == 0) {
            return undefined
        } 

        return {
            [`${sortedData[0][0].text.replace(' ', '_')}`] : item[0].text,
            [`${sortedData[0][1].text.replace(' ', '_')}`] : item[1].text,
            [`${sortedData[0][2].text.replace(' ', '_')}`] : item[2].text,
            [`${sortedData[0][3].text.replace(' ', '_')}`] : item[3].text,
            [`${sortedData[0][4].text.replace(' ', '_')}`] : item[4].text,
            [`${sortedData[0][5].text.replace(' ', '_')}`] : item[5].text,
        }

    }).filter(v => v !== undefined)

    return {BankStatement, bankStatementTransactions}
}
 
const indianOverseasBank = (accountData, transactionData) => {
    accountData = JSON.parse(accountData.replace(/'/g, '"'))
    //data sorting with account details
    let BankStatement = {
        AIM_ID: null,
        Email: null,
        Franchaisee_Name: null,
        Master_Franchisee_Name: null,
        Mobile_No: null,
        Pan_No: null,
        Site_Address: null,
        Account_Name: null,
        Account_Type: null,
        Account_Number: null,
        Bank_Address: '',
        IFSC_Code: null,
        Bank_Name: 'Indian Overseas Bank',
        Bank_Branch: null,
        Proprietor_Name: null,
        Opening_Balance: null,
        Closing_Balance: null,
        MICR_CODE: null,
    }
    // return accountData
    let addresOn = false
    accountData?.forEach( page => {
        page.data?.forEach(row => {
            if(row[0]?.text.includes('Account Number')) {
                BankStatement.Account_Number = row[0].text.split(' ')[3]
            }
            if(row[1]?.text.includes('IFSC CODE')) {
                BankStatement.IFSC_Code = row[1].text.split(' ')[3]
            }
            if(addresOn){
                if(row[0].text != '') {
                    BankStatement.Bank_Address = BankStatement.Bank_Address + ' ' + row[0].text
                } else { 
                    addresOn = false
                }
            }
            if(row[0]?.text.includes('Address')) {
                addresOn = true
            }
            if(row[1]?.text.includes('EMAIL ID')) {
                BankStatement.Email = row[1].text.split(' ')[3]
            }
            if(row[1]?.text.includes('MICR CODE')) {
                BankStatement.MICR_CODE = row[1].text.split(' ')[3]
            }
        })
    })

    
    // transaction data sorting
    transactionData = JSON.parse(transactionData.replace(/'/g, '"'))

    let sortedData = transactionData.map((item, index) => {

        let pageData = item.data.map(row => {
            return row.map(item => ({text: item.text ? item.text.replace('\r', ' ') : item.text }))
        })

        return pageData
    })
    sortedData = sortedData.flat(1)

    let bankStatementTransactions = sortedData.map((item, index) => {
        if(index == 0) {
            return undefined
        } 

        return {
            [`${sortedData[0][0].text.replace(' ', '_')}`] : item[0].text,
            [`${sortedData[0][1].text.replace(' ', '_')}`] : item[1].text,
            [`${sortedData[0][2].text.replace(' ', '_')}`] : item[2].text,
            [`${sortedData[0][3].text.replace(' ', '_')}`] : item[3].text,
            [`${sortedData[0][4].text.replace(' ', '_')}`] : item[4].text,
            [`${sortedData[0][5].text.replace(' ', '_')}`] : item[5].text,
            [`${sortedData[0][6].text.replace(' ', '_')}`] : item[6].text,
        }

    }).filter(v => v !== undefined)

    return {BankStatement, bankStatementTransactions}

}

const centralBank = (accountData, transactionData) => {
    accountData = JSON.parse(accountData.replace(/'/g, '"'))
    //data sorting with account details
    let BankStatement = {
        AIM_ID: null,
        Email: null,
        Franchaisee_Name: null,
        Master_Franchisee_Name: null,
        Mobile_No: null,
        Pan_No: null,
        Site_Address: null,
        Account_Name: null,
        Account_Type: null,
        Account_Number: null,
        Bank_Address: '',
        IFSC_Code: null,
        Bank_Name: 'Central Bank of India',
        Bank_Branch: null,
        Proprietor_Name: null,
        Opening_Balance: null,
        Closing_Balance: null,
        MICR_CODE: null,
        Branch_Code:null,
    }
    // return accountData
    let addresOn = false
    accountData?.forEach( page => {
        page.data?.forEach(row => {
            if(row[2]?.text.includes('Account Number')) {
                BankStatement.Account_Number = row[2].text.split(' ')[3]
            }
            if(addresOn){
                if(row[2].text.includes('Branch Code')) {
                    BankStatement.Branch_Code = row[2].text.split(':')[1]
                    addresOn = false
                } else { 
                    BankStatement.Bank_Address = BankStatement.Bank_Address + ' ' + row[2].text
                }
            }
            if(row[2]?.text.includes('Central Bank of India')) {
                addresOn = true
            }
            if(row[0]?.text.includes('Email')) {
                BankStatement.Email = row[0].text.split(':')[1]
            }
        })
    })
    //trasactions sorting
    data = JSON.parse(transactionData.replace(/'/g, '"'))
    let sortedData = [];
    // console.log(Array.isArray(data))
    if (Array.isArray(data) && data.length > 0) {
        for (let p = 0; p < data.length; p++) {
            let page = data[p].data;

            if (p != 0) {
                page = page.slice(1);
                // console.log(pageData.slice(1))
            }
            // console.log("page", page)
            for (let r = 0; r < page.length; r++) {
                let row = page[r];
                let text = row[0].text;
                // console.log("row")
                if (text == '') {
                    let lastElementPosition = sortedData.length > 0 ? sortedData.length - 1 : sortedData.length;

                    sortedData[lastElementPosition][0].text = sortedData[lastElementPosition][0].text + (row[0].text ? ' ' + row[0].text : row[0].text);
                    sortedData[lastElementPosition][1].text = sortedData[lastElementPosition][1].text + (row[1].text ? ' ' + row[1].text : row[1].text);
                    sortedData[lastElementPosition][2].text = sortedData[lastElementPosition][2].text + (row[2].text ? ' ' + row[2].text : row[2].text);
                    sortedData[lastElementPosition][3].text = sortedData[lastElementPosition][3].text + (row[3].text ? ' ' + row[3].text : row[3].text);
                    sortedData[lastElementPosition][4].text = sortedData[lastElementPosition][4].text + (row[4].text ? ' ' + row[4].text : row[4].text);
                    sortedData[lastElementPosition][5].text = sortedData[lastElementPosition][5].text + (row[5].text ? ' ' + row[5].text : row[5].text);
                    sortedData[lastElementPosition][6].text = sortedData[lastElementPosition][6].text + (row[6].text ? ' ' + row[6].text : row[6].text);
                    sortedData[lastElementPosition][7].text = sortedData[lastElementPosition][7].text + (row[7].text ? ' ' + row[7].text : row[7].text);

                } else {
                    row = row.map(item => {
                        return {
                            text: item.text ? replaceAll(item.text, '\r', ' ') : item.text
                        }
                    })
                    sortedData.push(row)
                }
            }
        }
    }
    let bankStatementTransactions = sortedData.map((item, index) => {
        if(index == 0) {
            return undefined
        } 

        return {
            [`${sortedData[0][0].text.replace(' ', '_')}`] : item[0].text,
            [`${sortedData[0][1].text.replace(' ', '_')}`] : item[1].text,
            [`${sortedData[0][2].text.replace(' ', '_')}`] : item[2].text,
            [`${sortedData[0][3].text.replace(' ', '_')}`] : item[3].text,
            [`${sortedData[0][4].text.replace(' ', '_')}`] : item[4].text,
            [`${sortedData[0][5].text.replace(' ', '_')}`] : item[5].text,
            [`${sortedData[0][6].text.replace(' ', '_')}`] : item[6].text,
            [`${sortedData[0][7].text.replace(' ', '_')}`] : item[7].text,
        }

    }).filter(v => v !== undefined)

    return {BankStatement, bankStatementTransactions}
}

const cityUnionBank = (data) => {
    data = data ? JSON.parse(data.replace(/'/g, '"')): []
    // console.log(data)
    
    //data sorting with account details
    let BankStatement = {
        AIM_ID: null,
        Email: null,
        Franchaisee_Name: null,
        Master_Franchisee_Name: null,
        Mobile_No: null,
        Pan_No: null,
        Site_Address: null,
        Account_Name: null,
        Account_Type: null,
        Account_Number: null,
        Bank_Address: null,
        IFSC_Code: null,
        Bank_Name: 'CITY UNION BANK',
        Bank_Branch: null,
        Proprietor_Name: null,
        Opening_Balance: null,
        Closing_Balance: null,
    }
    let onAccDetails = true
    let onExtraData = false
    let sortedData = data.map((item, index) => {
        let pageData = item.data.map(row => {

                // if(row.map(x => x.text).filter(x => x).length === 0) return undefined
                if(row[0].text == '' && row[1].text == '' && row[2].text == '' && row[3].text == '' && row[4].text == '' && row[5]?.text == '') {
                    return undefined
                }
                if(row[2]?.text.includes('BRANCH')) {
                    // console.log('BRANCH', row[2].text.split(' ')[2])
                    BankStatement.Bank_Branch = row[2].text.split(' ')[2]
                }
                if(row[1]?.text == 'ACCOUNT NO') {
                    BankStatement.Account_Number = row[2].text
                }

                if(row[1]?.text == 'IFSC') {
                    BankStatement.IFSC_Code = row[2].text
                }

                if(row[1]?.text == 'ACCOUNT TYPE') {
                    BankStatement.Account_Type = row[2].text
                }

                
                if(row[1]?.text.includes('STATEMENT OF ACCOUNT')) {
                    // console.log('onAccDetials')
                    onAccDetails = false
                    return undefined
                }
                if(onAccDetails) {
                    return undefined
                }
                if(row[1].text.includes('* Statement Downloaded') || onExtraData) {
                    onExtraData = true
                    return undefined
                }
                if(row[1].text == 'Website: www.cityunionbank.com') {
                    onExtraData = false
                    return undefined
                }
                let thirdRow = row[2].text.split(' ')
                row[2].text = thirdRow[0]
                if(row[0].text == 'DATE') {
                    // console.log(row)
                    row[3].text = 'DEBIT'
                } else {
                    row[3].text = thirdRow[1] ? thirdRow[1] : ''
                }
                return row

            }).filter(v => v !== undefined)
            // console.log(pageData[0])
        return pageData
        })
    
    sortedData = sortedData.flat(1)
    // console.log(sortedData)
    let bankStatementTransactions = sortedData.map((item, index) => {
        if(index == 0) {
            // console.log({ item })
            return undefined
        } 
        // console.log("sixth col: ",`${sortedData[0][5].text.replace(' ', '_')}`, item[5]?.text)
        return {
            [`${sortedData[0][0].text.replace(' ', '_')}`] : item[0].text,
            [`${sortedData[0][1].text.replace(' ', '_')}`] : item[1].text,
            [`${sortedData[0][2].text.replace(' ', '_')}`] : item[2].text,
            [`${sortedData[0][3].text.replace(' ', '_')}`] : item[3].text,
            [`${sortedData[0][4].text.replace(' ', '_')}`] : item[4].text,
            [`${sortedData[0][5].text.replace(' ', '_')}`] : item[5]?.text,
        }

    }).filter(v => v !== undefined)

    return {BankStatement, bankStatementTransactions}    
    // //data sorting
    // let sortedData = data.map((item, index) => {

    //     // let pageData = item.data
    //     let pageData = item.data.map(row => {
    //         return row.map(item => ({text: item.text ? replaceAll(item.text, '\r', ' ') : item.text }))
    //     })

    //     if (index != 0) {
    //         pageData = pageData.slice(1);
    //         // console.log(pageData.slice(1))
    //     }

    //     return pageData
    // })
    // sortedData = sortedData.flat(1)
    // let BankStatement = {}
    // let bankStatementTransactions = sortedData.map((item, index) => {
    //     if(index == 0) {
    //         return undefined
    //     } 

    //     return {
    //         [`${sortedData[0][0].text.replace(' ', '_')}`] : item[0].text,
    //         [`${sortedData[0][1].text.replace(' ', '_')}`] : item[1].text,
    //         [`${sortedData[0][2].text.replace(' ', '_')}`] : item[2].text,
    //         [`${sortedData[0][3].text.replace(' ', '_')}`] : item[3].text,
    //         [`${sortedData[0][4].text.replace(' ', '_')}`] : item[4].text,
    //         [`${sortedData[0][5].text.replace(' ', '_')}`] : item[5].text,
    //     }

    // }).filter(v => v !== undefined)

    // return {BankStatement, bankStatementTransactions}
}

const esafBank = (accountData, transactionData) => {

    // console.log(data)
accountData = JSON.parse(accountData.replace(/'/g, '"'))
//data sorting with account details
let BankStatement = {
    AIM_ID: null,
    Email: null,
    Franchaisee_Name: null,
    Master_Franchisee_Name: null,
    Mobile_No: null,
    Pan_No: null,
    Site_Address: null,
    Account_Name: null,
    Account_Type: null,
    Account_Number: null,
    Customer_Address: null,
    Customer_Pincode: null,
    Customer_City: null,
    Bank_Address: '',
    Bank_City: '',
    Bank_Pincode: '',
    IFSC_Code: null,
    Bank_Name: 'ESAF Bank',
    Bank_Branch: null,
    Proprietor_Name: null,
    Opening_Balance: null,
    Closing_Balance: null,
    MICR_CODE: null,
    Branch_Code: null,
    Client_Code: null,
    Currency_Code : '',
    Branch_Of_OwnerShip: '',
}
// return accountData
accountData?.forEach( page => {
    page.data?.forEach(row => {
        if(row[0]?.text.includes('Branch :')) {
            BankStatement.Bank_Address = row[0].text.split(':')[1]
        }
        if(row[0]?.text.includes('Name:')) {
            let name = row[0].text.split('Branch IFSC Code')[0]
            BankStatement.Account_Name = name.split('Name:')[1]
        }
        if(row[0]?.text.includes('Branch IFSC Code')) {
            BankStatement.IFSC_Code = row[2].text
        }
        if(row[0]?.text.includes('Account Number')) {
            BankStatement.Account_Number = row[2].text
        }
        if(row[0]?.text.includes('Branch of Ownership')) {
            BankStatement.Branch_Of_OwnerShip = row[2].text
        }
        if(row[0]?.text.includes('MICR Code')) {
            BankStatement.MICR_CODE = row[2].text
        }
        if(row[0]?.text.includes('Currency Code')) {
            BankStatement.Currency_Code = row[2].text
        }
    })
})


//transactions sorting
data = JSON.parse(transactionData.replace(/'/g, '"'))
//data sorting
let sortedData = data.map((item, index) => {

    // let pageData = item.data
    if(index % 2 == 0){
        return undefined
    }
    let pageData = item.data.map(row => {
        return row.map(item => ({text: item.text ? replaceAll(item.text, '\r', ' ') : item.text }))
    })

    return pageData
}).filter(v => v !== undefined)
sortedData = sortedData.flat(1)
let bankStatementTransactions = sortedData.map((item, index) => {
    if(index == 0) {
        return undefined
    } 

    return {
        [`${sortedData[0][0].text.replace(' ', '_')}`] : item[0].text,
        [`${sortedData[0][1].text.replace(' ', '_')}`] : item[1].text,
        [`${sortedData[0][2].text.replace(' ', '_')}`] : item[2].text,
        [`${sortedData[0][3].text.replace(' ', '_')}`] : item[3].text,
        [`${sortedData[0][4].text.replace(' ', '_')}`] : item[4].text,
        [`${sortedData[0][5].text.replace(' ', '_')}`] : item[5].text,
        [`${sortedData[0][6].text.replace(' ', '_')}`] : item[6].text,

    }

}).filter(v => v !== undefined)

return {BankStatement, bankStatementTransactions}
}

const karnatakaBank = (accountData, transactionData) => {
    accountData = JSON.parse(accountData.replace(/'/g, '"'))
    //data sorting with account details
    let BankStatement = {
        AIM_ID: null,
        Email: null,
        Franchaisee_Name: null,
        Master_Franchisee_Name: null,
        Mobile_No: null,
        Pan_No: null,
        Site_Address: null,
        Account_Name: null,
        Account_Type: null,
        Customer_ID: null,
        Account_Number: null,
        Customer_Address: null,
        Customer_Pincode: null,
        Customer_City: null,
        Bank_Address: '',
        Bank_City: '',
        Bank_Pincode: '',
        IFSC_Code: null,
        Bank_Name: 'The Karnataka Bank Limited',
        Bank_Branch: null,
        Proprietor_Name: null,
        Opening_Balance: null,
        Closing_Balance: null,
        MICR_CODE: null,
        Branch_Code: null,
        Client_Code: null,
        Currency_Code : '',
        Branch_Of_OwnerShip: '',
    }
    // return accountData
    accountData?.forEach( page => {
        page.data?.forEach(row => {
            if(row[0]?.text.includes('Account no:')) {
                let accnum = row[0].text.split('Interest Rate')[0]
                BankStatement.Account_Number = accnum.split('Account no:')[1]
            }
            if(row[0]?.text.includes('MICR Code:')) {
                BankStatement.MICR_CODE = row[0].text.split('MICR Code:')[1]
            }
            if(row[0]?.text.includes('IFSC:')) {
                BankStatement.IFSC_Code = row[0].text.split('IFSC:')[1]
            }
            if(row[0]?.text.includes('Name:')) {
                BankStatement.Bank_Branch = row[0].text.split('Name:')[1]
            }
            if(row[0]?.text.includes('OPENING BALANCE')) {
                BankStatement.Opening_Balance = row[0].text.split('OPENING BALANCE')[1]
            }
            if(row[0]?.text.includes('CLOSING BALANCE')) {
                BankStatement.Closing_Balance = row[0].text.split('CLOSING BALANCE')[1]
            }
        })
    })


    data = JSON.parse(transactionData.replace(/'/g, '"'))
    //data sorting
    let sortedData = data.map((item, index) => {

        // let pageData = item.data
        let pageData = item.data.map(row => {

            let date = row[0].text.slice(0,10)
            let space = row[0].text.slice(10,11)

            // console.log("string 2", row)           
            if(space == ' ') {
                // console.log(replaceAll(row[3].text, ',', ''),replaceAll(row[2].text, ',', ''), replaceAll(row[4].text, ',', ''))
                var [str1, str2, str3, ...str4] = row[0].text.split(' ');
                str4 = str4.join(' ');
                row[0].text = str1
                row[1].text = str3
                row.push({text: row[4].text})
                row[4].text = row[3].text
                row[3].text = row[2].text
                row[2].text = str4
            } else {  
                row[1].text = ''
                let row3 = row[2].text
                row[2].text = row[0].text.slice(10)
                row[0].text = row[0].text.slice(0,10)
                if(parseInt(replaceAll(row[3].text, ',', '')) < parseInt(replaceAll(row[4].text, ',', ''))) {
                    row.push({text: row[4].text})
                    row[4].text = row[3].text
                    row[3].text = ''
                    // console.log('Credited')
                } else {
                    console.log(row)
                    row[3].text = row3
                    row.push({text: row[4].text})
                    row[4].text = ''
                    // console.log('Debited')
                }
            }
            
            return row.map(item => ({text: item.text ? replaceAll(item.text, '\r', ' ') : item.text }))
        })

        return pageData
    })
    sortedData = sortedData.flat(1)

    let bankStatementTransactions = sortedData.map((item, index) => {
        return {
            "date" : item[0].text,
            "cheque_no" : item[1].text,
            "description" : item[2].text,
            "debit" : item[3].text,
            "credit" : item[4].text,
            "balance" : item[5].text,
        }

    }).filter(v => v !== undefined)

return {BankStatement, bankStatementTransactions}
}

const unionBankOfIndia = (accountData, transactionData) => {
    // console.log(data)
    // accountData = JSON.parse(accountData.replace(/'/g, '"'))
    // return accountData
    // //data sorting with account details
    // let BankStatement = {
    //     AIM_ID: null,
    //     Email: null,
    //     Franchaisee_Name: null,
    //     Master_Franchisee_Name: null,
    //     Mobile_No: null,
    //     Pan_No: null,
    //     Site_Address: null,
    //     Account_Name: null,
    //     Account_Type: null,
    //     Account_Number: null,
    //     Bank_Address: '',
    //     IFSC_Code: null,
    //     Bank_Name: 'UCO Bank',
    //     Bank_Branch: null,
    //     Proprietor_Name: null,
    //     Opening_Balance: null,
    //     Closing_Balance: null,
    //     MICR_CODE: null,
    //     Branch_Code: null,
    //     Client_Code: null
    // }
    // // return accountData
    // let addresOn = false
    // accountData?.forEach( page => {
    //     page.data?.forEach(row => {
    //         if(row[0]?.text.includes('Statement for A/c')) {
    //             BankStatement.Account_Number = row[0].text.split(' ')[3]
    //         }
    //         if(row[0]?.text.includes('Client Code')) {
    //             BankStatement.Client_Code = row[0].text.split(' ')[2]
    //         }
    //         if(row[0]?.text.includes('Branch Code')) {
    //             BankStatement.Branch_Code = row[0].text.split('Branch Code')[1]
    //         }
    //         if(row[0]?.text.includes('Name') && !row[0]?.text.includes('Branch Name')) {
    //             let name = row[0].text.split('IFSC Code')[0]
    //             BankStatement.Account_Name = name.split('Name')[1]
    //         }
    //         if(row[0]?.text.includes('IFSC Code')) {
    //             BankStatement.IFSC_Code = row[0].text.split('IFSC Code')[1]
    //         }
    //         if(row[0]?.text.includes('Branch Name')) {
    //             BankStatement.Bank_Branch = row[0].text.split('Branch Name')[1]
    //         }
    //         // if(addresOn){
    //         //     if(row[0].text.includes('Phone')) {
    //         //         BankStatement.Branch_Code = row[2].text.split(':')[1]
    //         //         addresOn = false
    //         //     } else { 
    //         //         BankStatement.Bank_Address = BankStatement.Bank_Address + ' ' + row[2].text
    //         //     }
    //         // }
    //         // if(row[0]?.text.includes('Address')) {
    //         //     addresOn = true
    //         // }
    //         if(row[0]?.text.includes('Phone')) {
    //             BankStatement.Mobile_No = row[0].text.split('Phone')[1]
    //         }
    //         // if(row[0]?.text.includes('Email')) {
    //         //     BankStatement.Email = row[0].text.split(':')[1]
    //         // }
    //     })
    // })

    //transactions sorting
    data = JSON.parse(transactionData.replace(/'/g, '"'))
    //data sorting
    let sortedData = data.map((item, index) => {

        // let pageData = item.data
        let pageData = item.data.map(row => {
            return row.map(item => ({text: item.text ? replaceAll(item.text, '\r', ' ') : item.text }))
        })

        return pageData
    })
    const flatArr = sortedData.flat(1)

    const columns = flatArr[0];

    const resultArr = [];
    for(let i = 1; i < flatArr.length; i++){
        const obj = {}
        for(let col = 0; col < columns.length; col++){
            const column = columns[col].text
            obj[column] = flatArr[i][col].text;
        }
        resultArr.push(obj)
    }
    return resultArr
}

const thePunchmahalDistrictBank = (accountData, transactionData) => {
    accountData = JSON.parse(accountData.replace(/'/g, '"'))
    //data sorting with account details
    let BankStatement = {
        AIM_ID: null,
        Email: null,
        Franchaisee_Name: null,
        Master_Franchisee_Name: null,
        Mobile_No: null,
        Pan_No: null,
        Site_Address: null,
        Account_Name: null,
        Account_Type: null,
        Customer_ID: null,
        Account_Number: null,
        Customer_Address: null,
        Customer_Pincode: null,
        Customer_City: null,
        Bank_Address: '',
        Bank_City: '',
        Bank_Pincode: '',
        IFSC_Code: null,
        Bank_Name: 'The Panchmahal District Co-Op Bank',
        Bank_Branch: null,
        Proprietor_Name: null,
        Opening_Balance: null,
        Closing_Balance: null,
        MICR_CODE: null,
        Branch_Code: null,
        Client_Code: null,
        Currency_Code : '',
        Branch_Of_OwnerShip: '',
    }
    // return accountData
    accountData?.forEach( page => {
        page.data?.forEach(row => {
            if(row[0]?.text.includes('Account Title')) {
                BankStatement.Account_Name = row[1].text
            }
            if(row[0]?.text.includes('Account Number')) {
                BankStatement.Account_Number = row[1].text
            }
            if(row[0]?.text.includes('Currency Code')) {
                BankStatement.Currency_Code = row[1].text
            }
            if(row[0]?.text.includes('Branch Name')) {
                BankStatement.Bank_Branch = row[1].text
            }
        })
    })

    //transactions sorting
    data = JSON.parse(transactionData.replace(/'/g, '"'))
    let sortedData = data.map((item, index) => {

        let pageData = item.data.map(row => {
            return row.map(item => ({text: item.text ? replaceAll(item.text, '\r', ' ')  : item.text }))
        })

        return pageData
    }).slice(1)
    sortedData = sortedData.flat(1)
    let bankStatementTransactions = sortedData.map((item, index) => {
        if(index == 0) {
            return undefined
        } 

        return {
            [`${sortedData[0][0].text.replace(' ', '_')}`] : item[0].text,
            [`${sortedData[0][1].text.replace(' ', '_')}`] : item[1].text,
            [`${sortedData[0][2].text.replace(' ', '_')}`] : item[2].text,
            [`${sortedData[0][3].text.replace(' ', '_')}`] : item[3].text,
            [`${sortedData[0][4].text.replace(' ', '_')}`] : item[4].text,
            [`${sortedData[0][5].text.replace(' ', '_')}`] : item[5].text,
            [`${sortedData[0][6].text.replace(' ', '_')}`] : item[6].text,
            [`${sortedData[0][7].text.replace(' ', '_')}`] : item[7].text,


        }

    }).filter(v => v !== undefined)

    return {BankStatement, bankStatementTransactions}
}

const ahmedNagarMerchantBank = (data) => {
    // console.log(data)
    data = JSON.parse(data.replace(/'/g, '"'))
    // return data
    //data sorting
    let on = true
    let sortedData = data.map((item, i) => {

        // let pageData = item.data
        let pageData = item.data.map((row, index) => {
            if(row[0].text == 'Date' && i !== 0) {   
                return undefined
            }
            // console.log('Row structure: ', row)
            let prevRow = item.data[index-1] && item.data[index-1][0].text
            let nextRow = item.data[index+1] && item.data[index+1][0].text
            
            if(row[0].text == '') {
                return undefined
            } else {
                if(prevRow == '') {
                    row[1].text = item.data[index-1][1].text + ' ' + row[1].text
                    if(nextRow == '') {
                        row[1].text = row[1].text + ' ' + item.data[index+1][1].text
                    }
                }
            }
            return row.map(item => ({text: item.text ? replaceAll(item.text, '\r', ' ') : item.text }))
        }).filter(v => v !== undefined)

        return pageData
    })
    const flatArr = sortedData.flat(1)

    const columns = flatArr[0];

    const resultArr = [];
    for(let i = 1; i < flatArr.length; i++){
        const obj = {}
        for(let col = 0; col < columns.length; col++){
            const column = columns[col].text
            obj[column] = flatArr[i][col].text;
        }
        resultArr.push(obj)
    }
    return resultArr

}


/*
********************************************************************************
    END YASSHARM
********************************************************************************
*/


/*
********************************************************************************
    BANK PARSER - BLOCKED PDF's
********************************************************************************
*/


const shriChhatrapatiRajarshiShahuUrbanCoOpBankLtd = (accountRawData, transactionRawData) => {
    return ({
        "bankFuncName": "shriChhatrapatiRajarshiShahuUrbanCoOpBankLtd",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const theKairaDistrictCentralCoopBankLtd = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "theKairaDistrictCentralCoopBankLtd",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const prathmaUpGarminBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "prathmaUpGarminBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const jilaSahakariKendriyaBankMaryaditDurg = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "jilaSahakariKendriyaBankMaryaditDurg",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const theChikhliUrbanCooperativeBankLtd = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "theChikhliUrbanCooperativeBankLtd",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const theYavatmalUrbanCoopBankLtd = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "theYavatmalUrbanCoopBankLtd",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const osmanabadJanataSahakariBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "osmanabadJanataSahakariBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const buldanaUrbanCoopCreditSociety = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "buldanaUrbanCoopCreditSociety",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const himachalPradeshGraminBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "himachalPradeshGraminBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const rblRatnakarBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "rblRatnakarBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const indianBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "indianBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const theKeralaStateCooperativeBankLtd = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "theKeralaStateCooperativeBankLtd",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const theSantrampurUrbanCooperativeBankLtd = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "theSantrampurUrbanCooperativeBankLtd",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const lakshmiVilasBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "lakshmiVilasBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const assamGraminVikashBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "assamGraminVikashBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const abhinandanUrbanCoopBankLtd = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "abhinandanUrbanCoopBankLtd",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const maharashtraGraminBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "maharashtraGraminBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const bankOfBaroda = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "bankOfBaroda",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const tamilnadMercantileCoopBankLtd = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "tamilnadMercantileCoopBankLtd",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const theBanaskanthaMercantileCo = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "theBanaskanthaMercantileCo",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const kotakMahindraBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "kotakMahindraBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const theCosmosCoOpBankLtd = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "theCosmosCoOpBankLtd",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const southIndianBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "southIndianBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

const dbsBank = (accountRawData, transactionRawData, pyPdfData) => {
    return ({
        "bankFuncName": "dbsBank",
        "bankName": null,
        "cifNo": null,
        "branchCode": null,
        "email": null,
        "accNo": null,
        "date": null,
        "clearBalance": null,
        "transactionFrom": null,
        "transactionTo": null,
        "transactionData": null,
        "message": "Needs manual intervention"
      })
}

module.exports = {
    cityUnionBank,
    centralBank,
    indianOverseasBank,
    theSabarknathaDistrictBank,
    ucoBank,
    canaraBank,
    unionBankOfIndia,
    punjabNationalBank,
    yesBank,
    idbiBank,
    esafBank,
    bankOfIndia,
    thePunchmahalDistrictBank,
    idfcBank,
    auSmallFinanceBank,
    karurVasyaBank,
    equitasBank,
    hdfcBank,
    stateBankOfIndia,
    federalBank,
    karnatakaBank,
    ahmedNagarMerchantBank,
    bandhanBank,
    sarvaHaryanaGraminBank,
    karnatakaGraminBank,
    odishaGramyaBank,
    kotakMahindraBank,
    aryavartBank,
    kanaraDistrictBank,
    barodaUttarPradeshGraminBank,
    dbsBank,
    bangiyaGraminVikashBank,
    barodaRajasthanKshetriyaGraminBank,
    theVaidyanathUrbanCoOpBankLtd,
    shriChhatrapatiRajarshiShahuUrbanCoOpBankLtd,
    vidharbhaKonkanGraminBank,
    dhanlaxmiBank,
    rajasthanMarudharaGraminBank,
    chattisgarhRajyaGraminBank,
    indusindBank,
    barodaGujaratGraminBank,
    southIndianBank,
    bankOfMaharashtra,
    theCosmosCoOpBankLtd,
    jilaSahakariKendriyaBank,
    theKairaDistrictCentralCoopBankLtd,
    prathmaUpGarminBank,
    jilaSahakariKendriyaBankMaryaditDurg,
    theChikhliUrbanCooperativeBankLtd,
    theYavatmalUrbanCoopBankLtd,
    osmanabadJanataSahakariBank,
    buldanaUrbanCoopCreditSociety,
    himachalPradeshGraminBank,
    rblRatnakarBank,
    indianBank,
    theKeralaStateCooperativeBankLtd,
    theSantrampurUrbanCooperativeBankLtd,
    lakshmiVilasBank,
    assamGraminVikashBank,
    abhinandanUrbanCoopBankLtd,
    maharashtraGraminBank,
    bankOfBaroda,
    tamilnadMercantileCoopBankLtd,
    theBanaskanthaMercantileCo
}
