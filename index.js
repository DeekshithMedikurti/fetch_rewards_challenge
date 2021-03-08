const express = require('express');
const bodyParser = require('body-parser');
const utils = require('./utils');
const app = express();
const port = 3000
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(bodyParser.json({ limit: '50mb' }))
let in_mem_transactions = []
let spending_trace = []
var balances = {}

app.post('/addTransaction', function (request, response) {
    if (typeof request.body !== 'undefined') {
        if (typeof request.body.payer !== 'string' || typeof request.body.points !== 'number' || typeof request.body.timestamp !== 'string') {
            response.sendStatus(403).send('INVALID DATA')
        }
    }
    let transaction = request.body
    const is_written = utils.write_to_file(utils.FILE_NAME, JSON.stringify(transaction)+ '\n')
    if (is_written === true) {
        response.sendStatus(200)
    } else {
        response.send({ ERROR: 'COULD NOT PERSIST DATA' })
    }
})

// read JSON object from file
function readTransactions(request, response, next) {
    in_mem_transactions = utils.read_from_file()
    next()
}

app.post('/spendPoints', readTransactions, function (request, response) {
    if (!typeof request.body.points === 'number') {
        response.sendStatus(403)
    } else {
        let points_to_spend = request.body.points
        // reject the request if the transaction cannot be performed
        const points_available = in_mem_transactions.map(transaction => transaction.points).reduce((a, b) => a + b, 0)
        if (points_to_spend > points_available) {
            response.sendStatus(500).send('INSUFFICIENT BALANCE')
        }
        in_mem_transactions = in_mem_transactions.sort(utils.byDate)
        in_mem_transactions = utils.mergeTransactions(in_mem_transactions)
        console.log('Sorted: ', in_mem_transactions)
        trackSpending(points_to_spend)
        console.log('Balances: ',balances)
        utils.cleanFile()
        utils.write_to_file(__dirname + '/transactions.json', JSON.stringify(balances)+ '\n' )
        response.send(spending_trace)
    }
})

app.get('/balances', readTransactions, function (request, response) {
    response.send(in_mem_transactions)
})

// spend the points based on the rules
function trackSpending(points_to_spend) {
    if (points_to_spend !== 0 && in_mem_transactions.length !== 0) {
        let obj = in_mem_transactions[0];
        let points_spent = obj.points - points_to_spend;
        if (points_spent === 0) {
            add_to_response(obj.payer, -1 * obj.points)
            obj.points = 0
            balances[obj.payer] = obj.points
            return
        } else if (points_spent < 0) {
            add_to_response(obj.payer, -1 * obj.points)
            obj.points = 0
            points_to_spend = (-1) * points_spent
            var deleted = in_mem_transactions.shift()
            balances[deleted.payer] = deleted.points
            trackSpending(points_to_spend)
        } else {
            add_to_response(obj.payer, -1 * points_to_spend)
            obj.points = points_spent
            balances[obj.payer] = obj.points
            return
        }
    }
    // read any points that are remaining after spending
    if(in_mem_transactions.length >= 1){
        in_mem_transactions.forEach(transaction => {
            if(balances[transaction.payer] !== 'undefined' && transaction.points > 0){
                balances[transaction.payer] =  transaction.points
            }
        })
    }
}

// add spending to the response
function add_to_response(payer, points) {
    var new_obj = {}
    new_obj.payer = payer
    new_obj.points = points
    spending_trace.push(new_obj)
}

app.listen(port, () => console.log('Server started on port ', port))