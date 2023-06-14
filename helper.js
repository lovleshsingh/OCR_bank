function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

function camelCase(str, limiter = " ") {
  return str?.split(limiter)
    ?.map((word, index) =>
      word
        ? index === 0
          ? word.charAt(0).toLowerCase() + replaceAll(word, "-", "").slice(1).toLowerCase()
          : word.charAt(0).toUpperCase() + replaceAll(word, "-", "").slice(1).toLowerCase()
        : ""
    )
    .join("");
}

const getPlaceholderData = (message = "") => ({
    bankName: null,
    cifNo : null,
    branchCode : null,
    email : null,
    accNo : null,
    date : null,
    clearBalance : null,
    transactionFrom : null,
    transactionTo : null,
    transactionData: null,
    message
})

const getStringAfterSplit = (limiters, filename = "") => limiters.filter((x) => filename.split(x).length > 1);

module.exports = {
  replaceAll,
  camelCase,
  getPlaceholderData,
  getStringAfterSplit
};
