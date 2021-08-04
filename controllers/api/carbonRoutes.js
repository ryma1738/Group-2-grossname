const router = require('express').Router();
const { getVehicleMake, getVehicleModel, vehicleEstimateRequest } = require('../../util/vehicles');
const { flightEstimateRequest } = require('../../util/flight');
const { shippingEstimateRequest } = require('../../util/shipping');
const { electricityEstimateRequest } = require('../../util/electricity');
const axios = require('axios')

router.get('/vehicle', async function (req, res) {
    // queries: ?make=toyota&model=86&year=2017&dValue=100&dUnit=mi
   let makeId = await getVehicleMake(req.query.make.toLowerCase());
    if (!makeId) {
        res.json({message: "Vehicle make not found. Please enter a valid vehicle make!"})
    } else {
        let modelId = await getVehicleModel(makeId, req.query.model.toLowerCase(), parseInt(req.query.year));
        if (!modelId) {
            res.json({message: "Vehicle model and/or year not found. Please enter a valid vehicle model and year!"})
        } else {
            let carbonData = await vehicleEstimateRequest(modelId, req.query.dValue, req.query.dUnit);
            if (carbonData.error) {
                res.json({error: carbonData.error});
            } else {
                res.json(carbonData);
            }
        }
    }
});

router.get('/flight', async function (req, res) {
    // queries: ?arrival=slc&depart=den&roundTrip=true&passCount=100
    let legs = [];
    if (req.query.roundTrip) {
        legs = [
            {"departure_airport": req.query.depart, "destination_airport": req.query.arrival},
            {"departure_airport": req.query.arrival, "destination_airport": req.query.depart}
        ];
    } else {
        legs = [
            {"departure_airport": req.query.depart, "destination_airport": req.query.arrival}
        ];
    }
    let flightInfo = await flightEstimateRequest(legs, req.query.passCount);
    res.json(flightInfo);
});

router.get('/shipping', async function (req, res) {
    // queries: ?weight=200&distance=1000&dUnit=mi&wUnit=lb&method=truck
    let shipping = await shippingEstimateRequest(parseInt(req.query.weight), parseInt(req.query.distance),
     req.query.dUnit.toLowerCase(), req.query.wUnit.toLowerCase(), req.query.method.toLowerCase());
     res.json(shipping);
});

router.post('/electricity', async function (req, res) {
    // body = [{"ut": 5}, {"ca": 2}]

    let estimate = await electricityEstimateRequest(req.body);
    if (estimate.error) {
        res.json({message: estimate.error});
    } else {
        res.json({lbs: estimate.totalCarbon.lbs, mt: estimate.totalCarbon.mt})
    }
});

router.post('/vehicles', async function (req, res) {
    //body = [{make: toyota, model: 86, year: 2017, dValue: 100, dUnit: mi}, {...}]1
});

module.exports = router;

router.get('/models', async function (req, res) {
    // query = ?make=Toyota
    let makeId = await getVehicleMake(req.query.make.toLowerCase());
    const { data } = await axios.get('https://www.carboninterface.com/api/v1/vehicle_makes/' + makeId + "/vehicle_models", {
      headers: {
        'Authorization': 'Bearer HZOkJvglLARzHsXWm755Q',
        'content-type': 'application/json'
      }
    });
    let models = [];
    for (let i = 0; i < data.length; i++) {
        let model = data[i].data.attributes.name;
        if (models.indexOf(model) == -1) {
            models.push(model);
        } 
    }
    models = models.sort();
    res.json(models);
});