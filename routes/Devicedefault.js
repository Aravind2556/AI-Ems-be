const express = require('express')
const DeviceData = require('../model/Devicedata')
const nodemailer = require("nodemailer");
const RegisterModel = require('../model/Register');

const Devicerouter = express.Router();


Devicerouter.post("/Device_data", async (req, res) => {
    try {
        let product = await DeviceData.find({});
        let id = product.length !== 0 ? product.slice(-1)[0].Id + 1 : 1;

        let year = new Date().getFullYear(); // Get current year

        // Find the latest registered user based on createdAt (descending order)
        let lastUser = await DeviceData.findOne(
            { deviceId: new RegExp(`^Dev-${year}-\\d+$`) }, // Fetch current year’s IDs
            { deviceId: 1 },
            { sort: { createdAt: -1 } } // Get latest user first
        );

        let newNumber = 1; // Default if no users exist
        if (lastUser && lastUser.deviceId) {
            let lastNumber = parseInt(lastUser.deviceId.split("-")[2], 10); // Extract last number
            newNumber = lastNumber + 1; // Increment
        }

        // Generate uniqueId in format: Dev-YYYY-001
        let uniqueId = `Dev-${year}-${String(newNumber).padStart(3, "0")}`;

        const {
            userId,
            voltageValue, voltageLow, voltageHigh,
            currentValue, currentLow, currentHigh,
            powerValue, powerLow, powerHigh,
            powerFactorValue, powerFactorLow, powerFactorHigh,
            temperatureValue, temperatureLow, temperatureHigh,
            // vibrationValue, vibrationLow, vibrationHigh,
            energyValue, energyLow, energyHigh,
            frequencyValue, frequencyLow, frequencyHigh
        } = req.body;

        // Create a new device entry
        const newDevice = new DeviceData({
            Id: id,
            deviceId: uniqueId,
            userId: userId,
            voltage: {
                value: voltageValue,
                low: voltageLow,
                high: voltageHigh,
            },
            current: {
                value: currentValue,
                low: currentLow,
                high: currentHigh,
            },
            power: {
                value: powerValue,
                low: powerLow,
                high: powerHigh,
            },
            powerfactor: { // 🔹 Fixed Syntax Error
                value: powerFactorValue,
                low: powerFactorLow,
                high: powerFactorHigh // Removed extra dot
            },
            tempeature: {
                value: temperatureValue,
                low: temperatureLow,
                high: temperatureHigh,
            },
            // vibration: {
            //     value: vibrationValue,
            //     low: vibrationLow,
            //     high: vibrationHigh,
            // },
            energy: {
                value: energyValue,
                low: energyLow,
                high: energyHigh,
            },
            frequency: {
                value: frequencyValue,
                low: frequencyLow,
                high: frequencyHigh,
            },
        });

        // Save the new device
        const savedDevice = await newDevice.save();
        if (savedDevice) {
            return res.status(201).json({ success: true, message: "Device data saved successfully.", data: savedDevice });
        } else {
            return res.status(500).json({ success: false, message: "Failed to save device data." });
        }

    } catch (err) {
        console.error("Error in /Device_data route:", err.message);
        return res.status(500).json({ success: false, message: "Server error, contact admin.", error: err.message });
    }
});

module.exports = Devicerouter;


Devicerouter.get('/fetch-user-device',async (req,res)=>{
    try{

        const usersession =  req.session.profile
        if(usersession){
            if(usersession.Role === 'Admin'){
                const isadmin = await DeviceData.find({})
                if(isadmin){
                return res.json({success : true , data : isadmin})
                }
                else{
                    return res.json({success : false ,message : "not"})
    
                }
            }
            else if(usersession.Role === 'User'){
                const isuser = await DeviceData.find({userId : usersession.userid})
                if(isuser){
                return res.json({success : true , data : isuser})
                }
                else{
                    return res.json({success : false , message :"user not"})
    
                }
            }
            
        }
        else{
            return res.json({success : false , message :"please login"})
        }
        }
    catch(err){

        console.log("Trouble in erro to logout", err)
        return res.json({ response: "notok", message: "Trouble error contact admin" })

    }
})

Devicerouter.put(`/Update-device-data/:rangeid`, async (req, res) => {
    try {
        console.log("API called")
        const { rangeid } = req.params;

        const { formData } = req.body;

        if (!formData || Object.keys(formData).length === 0) {
            return res.json({ success: false, message: "No update data provided" });
        }

        const fetchDevice = await DeviceData.findOne({deviceId : rangeid})

        if(!fetchDevice){
            return res.send({success: false, message: "No device is available."})
        }

        // Update device data in MongoDB
        const updates = await DeviceData.findOneAndUpdate(
            { deviceId : rangeid }, // Find the document by rangeid
            { $set: formData }, // Update with formData
            { new: true, runValidators: true } // Return updated document and validate fields
        );

        if (!updates) {
            return res.json({ success: false, message: "Device not found" });
        }

        return res.json({ success: true, message: "Device data updated successfully", updates });

    } catch (err) {
        console.error("Error updating device data:", err);
        return res.json({ success: false, message: "Trouble error, contact admin" });
    }
});

Devicerouter.delete(`/delete-device/:deviceId`, async (req, res) => {
    try {
        const { deviceId } = req.params;
        
        if(!deviceId || deviceId==undefined){
            return res.send({success: false, message: "Device Id not found!"})
        }

        console.log("deviceId:",deviceId)

        const fetchDevice = await DeviceData.findOne({deviceId : deviceId})

        if(!fetchDevice){
            return res.send({success: false, message: "No device is available."})
        }

        const deleteDevice = await DeviceData.deleteOne({deviceId : deviceId})

        await RegisterModel.updateOne({userid: fetchDevice.userId},
            { $pull: { Alert: { DeviceId: fetchDevice.deviceId } } }
        )



        if (!deleteDevice) {
            return res.send({ success: false, message: "Device not found" });
        }

        return res.send({ success: true, message: "Device data deleted successfully!" });

    } catch (err) {
        console.error("Error updating device data:", err);
        return res.send({ success: false, message: "Trouble error, contact admin" });
    }
});

Devicerouter.post('/Email-alert',async (req,res)=>{
    try{

        const {alerts}=req.body
        console.log("alert",alerts)
        if (!alerts || alerts.length === 0) {
            return res.status(400).json({ success: false, message: "No alerts received" });
          }
      
          // Send email logic (using nodemailer or any email service)
          const emailBody = alerts.join("\n");
          
          // Example email sending logic using Nodemailer
          let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
      
          let mailOptions = {
            from: "aravindaravind2556@gmail.com",
            to: ["aravintharavinth193@gmail.com"],
            subject: "Device Alerts",
            text: emailBody,
          };
      
          await transporter.sendMail(mailOptions);
          
          res.json({ success: true, message: "Alert email sent successfully" });
        } 
   
    catch(err){
        console.error("Error updating device data:", err);
        return res.json({ response: "notok", message: "Trouble error, contact admin" });
    }
})







module.exports = Devicerouter