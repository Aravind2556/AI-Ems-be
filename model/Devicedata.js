const mongoose = require('mongoose');



// Device Schema
const deviceSchema = new mongoose.Schema(
  {
    Id : {type : Number , required : true},
    deviceId: { type: String,required: true},
    userId: { type: String,required: true,},
    voltage: {
      value: {type: Number, required: true},
      low: {type: Number, required: true},
      high: {type: Number, required: true}
    },
    current: {
      value: {type: Number, required: true},
      low: {type: Number, required: true},
      high: {type: Number, required: true}
    },
    power: {
      value: {type: Number, required: true},
      low: {type: Number, required: true},
      high: {type: Number, required: true}
    },
    powerfactor: {
      value: {type: Number, required: true},
      low: {type: Number, required: true},
      high: {type: Number, required: true}
    },
    tempeature: {
      value: {type: Number, required: true},
      low: {type: Number, required: true},
      high: {type: Number, required: true}
    },
    // vibration: {
    //   value: {type: Number, required: true},
    //   low: {type: Number, required: true},
    //   high: {type: Number, required: true}
    // },
    energy: {
      value: {type: Number, required: true},
      low: {type: Number, required: true},
      high: {type: Number, required: true}
    },
    frequency: {
      value: {type: Number, required: true},
      low: {type: Number, required: true},
      high: {type: Number, required: true}
    },
  },
  {
    timestamps: true, 
  }
);

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
