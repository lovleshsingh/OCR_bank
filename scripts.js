const { spawn } = require("child_process");
const fs = require("fs");
const {
  BANK_PDF_DIRECTORY,
  BANK_JSON_DIRECTORY,
  FALLBACK_MESSAGE,
  FILE_NAME_LIMITERS,
  BANK_NAME_LIMITERS,
  BANK_DOCX_DIRECTORY,
} = require("./config.json");
const { camelCase, getPlaceholderData, getStringAfterSplit } = require("./helper");
const helperFunctions = require("./helperFun");

const pdf_input = BANK_PDF_DIRECTORY;

const pdfParser = async () => {
  const pdfDirExists = fs.existsSync(BANK_PDF_DIRECTORY);
  if (!pdfDirExists)
    return console.log(
      "BANK STATEMENT FOLDER NOT FOUND. Rename folder name in config if folder exists with a different name."
    );
  const pdf_list = fs.readdirSync(pdf_input);


  const outputDirExists = fs.existsSync(BANK_JSON_DIRECTORY);
  if (!outputDirExists) fs.mkdirSync(BANK_JSON_DIRECTORY, { recursive: true });

  const docxDirExists = fs.existsSync(BANK_DOCX_DIRECTORY);
  if (!docxDirExists) fs.mkdirSync(BANK_DOCX_DIRECTORY, { recursive: true });

  for (let i = 0; i < pdf_list.length; i++) {
    let dataToSend;
    const file_name = pdf_list[i];
    try {
      console.log("filename :", file_name);
      const pdf_path = pdf_input + file_name;
      console.log("pdf_path :", pdf_path);
      const fileNameLimiter = getStringAfterSplit(FILE_NAME_LIMITERS, file_name);
      const bank_name = file_name.split(fileNameLimiter)[1];
      console.log("bank_name :", bank_name);

      const bankNameLimiter = getStringAfterSplit(BANK_NAME_LIMITERS, bank_name);
      const bankFuncName = camelCase(bank_name, bankNameLimiter);
      console.log("bankFuncName :", bankFuncName);

      dataToSend = {
        bankFuncName,
        ...getPlaceholderData(FALLBACK_MESSAGE),
      };
      const bankFunc = BANK_HELPER[bankFuncName];

      if (!bankFunc) {
        console.log("\nBank Function not found\n");
        throw "\nBank function not found\n";
      }

      const transactionData = await asyncPyScript("pdfscrap.py", pdf_path);
      const accountData = await asyncPyScript("pdfscrap2.py", pdf_path);
      const docScriptData = await asyncPyScript("pdfscrap3.py", file_name);
      const pyPdfData = await asyncPyScript("pdfScrapTest.py", pdf_path);

      console.log(transactionData.length, accountData.length, docScriptData.length, pyPdfData.length);

      console.log(BANK_HELPER[bankFuncName]);

      if (bankFunc) {
        const arg = { transactionData, accountData, docScriptData, pyPdfData }; // argument for bank helper function
        // fs.writeFileSync(`./txt/${bankFuncName}.txt`, (transactionData), "utf-8");
        // fs.writeFileSync(`./txt/${bankFuncName}.json`, (docScriptData.replace(/'/g, '"')));

        dataToSend = bankFunc(arg);
      }
      // console.log(dataToSend)
      fs.writeFileSync(`${BANK_JSON_DIRECTORY}/${file_name}.json`, JSON.stringify(dataToSend || "{}", null, 2));
    } catch (error) {
      console.error(`Error while parsing: ${file_name}`, error);
      fs.writeFileSync(
        `${BANK_JSON_DIRECTORY}${file_name}.json`,
        JSON.stringify({ ...dataToSend, error: error?.message } || "{}", null, 2)
      );
    }
  }
};

const asyncPyScript = async (script_name, path) => {
  return await new Promise((res, rej) => {
    let result = "";
    let python = spawn("python3", [`./${script_name}`, path]);

    python.stdout.on("data", function (data) {
      if (data.toString()) {
        result += data.toString();
        console.log(`Pipe data from ${script_name}...`, result.slice(0, 50), ` | length: ${data.length}`);
      }
    });
    python.on("close", async (code) => {
      console.log(`${script_name} closed with code : ${code} ...`);
      return res(result || "{}");
    });

    python.on("error", async (code) => {
      console.log(`${script_name} error ...`, error);
      return rej(code);
    });
  });
};

const BANK_HELPER = {

  


  /*All working bank*/
  odishaGramyaBank: ({ accountData, transactionData }) => helperFunctions.odishaGramyaBank(accountData, transactionData),
  aryavartBank: ({ accountData, transactionData }) => helperFunctions.aryavartBank(accountData, transactionData),
  bangiyaGraminVikashBank: ({ accountData, pyPdfData }) => helperFunctions.bangiyaGraminVikashBank(accountData, pyPdfData),
  barodaRajasthanKshetriyaGraminBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.barodaRajasthanKshetriyaGraminBank(accountData, transactionData, pyPdfData),
  dhanlaxmiBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.dhanlaxmiBank(accountData, transactionData, pyPdfData),
  rajasthanMarudharaGraminBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.rajasthanMarudharaGraminBank(accountData, transactionData, pyPdfData),
  vidharbhaKonkanGraminBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.vidharbhaKonkanGraminBank(accountData, transactionData, pyPdfData),
  barodaUttarPradeshGraminBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.barodaUttarPradeshGraminBank(accountData, transactionData, pyPdfData),
  sarvaHaryanaGraminBank: ({ transactionData }) => helperFunctions.sarvaHaryanaGraminBank(transactionData),
  iDBI: ({ accountData, transactionData }) => helperFunctions.idbiBank(accountData, transactionData),
  karnatakaGraminBank: ({ accountData }) => helperFunctions.karnatakaGraminBank(accountData),
  theKanaraDistrictCentralCoOperativeBankLtd: ({ accountData }) => helperFunctions.kanaraDistrictBank(accountData),
  theVaidyanathUrbanCoopBankLtd: ({ accountData, transactionData }) => helperFunctions.theVaidyanathUrbanCoOpBankLtd(accountData, transactionData),
  auSmallFinanceBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.auSmallFinanceBank(accountData, transactionData, pyPdfData),
  karurVysyaBank: ({ accountData, transactionData }) => helperFunctions.karurVasyaBank(accountData, transactionData),
  "theSabarkanthaDistrictCentralCoopBankLtd.": ({ accountData, transactionData }) => helperFunctions.theSabarknathaDistrictBank(accountData, transactionData),
  yesBank: ({ accountData, transactionData }) => helperFunctions.yesBank(accountData, transactionData),
  hdfcBank: ({ accountData, transactionData }) => helperFunctions.hdfcBank(accountData, transactionData),
  federalBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.federalBank(accountData, transactionData, pyPdfData),
  bandhanBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.bandhanBank(accountData, transactionData, pyPdfData),
  equitasBank: ({accountData, transactionData, pyPdfData }) => helperFunctions.equitasBank(accountData, transactionData, pyPdfData),
  stateBankOfIndia: ({accountData, transactionData, pyPdfData}) => helperFunctions.stateBankOfIndia(accountData, transactionData, pyPdfData),
  idfcBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.idfcBank(accountData, transactionData, pyPdfData),
  canaraBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.canaraBank(accountData, transactionData, pyPdfData),
  chattisgarhRajyaGraminBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.chattisgarhRajyaGraminBank(accountData, transactionData, pyPdfData),
  indusindBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.indusindBank(accountData, transactionData, pyPdfData),
  barodaGujaratGraminBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.barodaGujaratGraminBank(accountData, transactionData, pyPdfData),
  bankOfMaharashtra: ({ accountData, transactionData, pyPdfData }) => helperFunctions.bankOfMaharashtra(accountData, transactionData, pyPdfData),
  jilaSahakariKendriyaBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.jilaSahakariKendriyaBank(accountData, transactionData, pyPdfData),
  bankOfIndia: ({ accountData, transactionData }) => helperFunctions.bankOfIndia(accountData, transactionData),
  punjabNationalBank: ({ accountData, transactionData }) => helperFunctions.punjabNationalBank(accountData, transactionData),
  ucoBank: ({ accountData, transactionData }) => helperFunctions.ucoBank(accountData, transactionData),
  indianOverseasBank: ({ accountData, transactionData }) => helperFunctions.indianOverseasBank(accountData, transactionData),
  centralBankOfIndia: ({ accountData, transactionData }) => helperFunctions.centralBank(accountData, transactionData),
  cityUnionBank: ({ accountData, transactionData }) => helperFunctions.cityUnionBank(accountData, transactionData),
  esafBank: ({ accountData, transactionData }) => helperFunctions.esafBank(accountData, transactionData),
  theKarnatakaBankLtd: ({ transactionData }) => helperFunctions.karnatakaBank(transactionData, transactionData),
  unionBankOfIndia: ({ accountData, transactionData }) => helperFunctions.unionBankOfIndia(accountData, transactionData),
  thePanchmahalDistrictCoopBank: ({ transactionData }) => helperFunctions.thePunchmahalDistrictBank(transactionData, transactionData),
  "ahmednagarMerchantSCo.op.BankLtd": ({ transactionData }) => helperFunctions.ahmedNagarMerchantBank(transactionData),
  
  //BLOCKED
  shriChhatrapatiRajarshiShahuUrbanCoopBankLtd: ({ accountData, transactionData }) => helperFunctions.shriChhatrapatiRajarshiShahuUrbanCoOpBankLtd(accountData, transactionData),
  theKairaDistrictCentralCoopBankLtd : ({}) => helperFunctions.theKairaDistrictCentralCoopBankLtd(),
  "prathmaU.pGarminBank" : ({}) => helperFunctions.prathmaUpGarminBank(),
  jilaSahakariKendriyaBankMaryaditDurg : ({}) => helperFunctions.jilaSahakariKendriyaBankMaryaditDurg(),
  theChikhliUrbanCooperativeBankLtd : ({}) => helperFunctions.theChikhliUrbanCooperativeBankLtd(),
  theYavatmalUrbanCoopBankLtd : ({}) => helperFunctions.theYavatmalUrbanCoopBankLtd(),
  osmanabadJanataSahakariBank : ({}) => helperFunctions.osmanabadJanataSahakariBank(),
  buldanaUrbanCoopCreditSociety : ({}) => helperFunctions.buldanaUrbanCoopCreditSociety(),
  himachalPradeshGraminBank : ({}) => helperFunctions.himachalPradeshGraminBank(),
  rblRatnakarBank : ({}) => helperFunctions.rblRatnakarBank(),
  indianBank : ({}) => helperFunctions.indianBank(),
  theKeralaStateCooperativeBankLtd : ({}) => helperFunctions.theKeralaStateCooperativeBankLtd(),
  theSantrampurUrbanCooperativeBankLtd : ({}) => helperFunctions.theSantrampurUrbanCooperativeBankLtd(),
  lakshmiVilasBank : ({}) => helperFunctions.lakshmiVilasBank(),
  assamGraminVikashBank : ({}) => helperFunctions.assamGraminVikashBank(),
  abhinandanUrbanCoopBankLtd : ({}) => helperFunctions.abhinandanUrbanCoopBankLtd(),
  maharashtraGraminBank : ({}) => helperFunctions.maharashtraGraminBank(),
  bankOfBaroda : ({}) => helperFunctions.bankOfBaroda(),
  tamilnadMercantileCoopBankLtd : ({}) => helperFunctions.tamilnadMercantileCoopBankLtd(),
  theBanaskanthaMercantileCo : ({}) => helperFunctions.theBanaskanthaMercantileCo(),
  kotakMahindraBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.kotakMahindraBank(accountData, transactionData, pyPdfData),
  southIndianBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.southIndianBank(accountData, transactionData, pyPdfData),
  theCosmosCoopBankLtd: ({ accountData, transactionData, pyPdfData }) => helperFunctions.theCosmosCoOpBankLtd(accountData, transactionData, pyPdfData),
  dbsBank: ({ accountData, transactionData, pyPdfData }) => helperFunctions.dbsBank(accountData, transactionData, pyPdfData),
  
};

pdfParser();
