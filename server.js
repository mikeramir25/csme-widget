const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/vehicle-offer', async (req, res) => {
    const { vin, mileage, zip, condition } = req.body;

    const mockVehicle = {
        year: 2020,
        make: "Toyota",
        model: "Camry",
        trim: "SE"
    };

    const estimatedValue = 25000;
    const offerLow = estimatedValue * 0.8;
    const offerHigh = estimatedValue * 0.9;

    res.json({
        vehicle: mockVehicle,
        offer: {
            low: Math.round(offerLow),
            high: Math.round(offerHigh)
        }
    });
});

app.get('/', (req, res) => {
    res.send('CSME Vehicle Offer API is running');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
