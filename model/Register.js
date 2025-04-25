const mongoose = require('mongoose');

const RegisterSchema = new mongoose.Schema({
    Id: { type: Number, required: true, unique: true },
    userid : {type : String , required : true},
    Name: { type: String, required: true, trim: true },
    Role: { type: String, enum: ["Admin","User"] , default : "User"},
    Contact: { type: Number, required: true, trim: true },
    Email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    Password: { type: String, required: true }, // Fixed the spelling
    Alert: [
        {
            DeviceId: {type: String, required: true},
            TrackedFeeds: [{type: Number, trim: true}]
        }
    ]
}, { timestamps: true });



const RegisterModel = mongoose.model("Managementuser", RegisterSchema);

module.exports = RegisterModel;