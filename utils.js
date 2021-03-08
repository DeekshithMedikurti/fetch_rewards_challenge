const fs = require('fs');
const FILE_NAME = __dirname + '/transactions.json'

// handler for sorting the transactions by timestamp
const byDate = (a, b) => {
  if (a.timestamp < b.timestamp) return -1;
  if (a.timestamp > b.timestamp) return 1;
  return 0;
}

// nullify the transactions if necessary (for example: payer Dannon points 100 , payer Dannon points -100)
const mergeTransactions = (transactions) => {
  var bal_obj = {}
  for (let i = 0; i < transactions.length; i++) {
    for (let j = 1; j < transactions.length; j++) {
      var a = transactions[i]
      var b = transactions[j]
      if (a.payer === b.payer) {
        if (a.points + b.points === 0) {
          transactions.splice(i, 1)
          transactions.splice(j, 1)
          // reset the indices after deleting the items in array
          i = i - 1
          j = i + 1
        }
        else if (a.points < 0 && b.points > 0) {
          b.points = b.points + a.points
          transactions.splice(i, 1)
        }
        else if (a.points > 0 && b.points < 0) {
          a.points = a.points + b.points
          transactions.splice(j, 1)
          j = j - 1
        }
      }
    }
  }
  return transactions
}

// persists the transactions to the file named transactions.json
const write_to_file = (file_name, data) => {
  fs.writeFile(file_name, data, { flag: 'a' }, (err) => {
    if (err)
      return false
  })
  return true
}

// read the data persisted to the file transactions.json
const read_from_file = () => {
  let array = []
  let data = fs.readFileSync(FILE_NAME, { encoding: 'utf-8', flag: 'r' });
  // parse JSON object
  let data_read = data.toString();
  data_read = data_read.split("\n")
  array = data_read.filter(transaction => transaction !== '').map(transaction => JSON.parse(transaction))
  return array
}

const cleanFile = () => {
  fs.truncate(FILE_NAME, 0, (err) => {
    if (err)
      throw err
  })
}

exports.byDate = byDate
exports.mergeTransactions = mergeTransactions
exports.write_to_file = write_to_file
exports.read_from_file = read_from_file
exports.read_balances = read_balances
exports.cleanFile = cleanFile
exports.FILE_NAME = FILE_NAME