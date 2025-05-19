const Express = require('express');
const fetch = require('node-fetch'); // Make sure you're using node-fetch@2
const ThinkSpeakRouter = Express.Router();

const READ_API = 'https://api.thingspeak.com/channels/2968057/feeds.json?api_key=7DTSP04628FW5050';
const WRITE_API = 'JUEU8VKR4402BVY7';

let lastEntryId = null;
function fetchAndSendLatest() {
    fetch(READ_API)
        .then(res => res.json())
        .then(data => {
            const feeds = data.feeds;
            const latest = feeds[feeds.length - 1];

            if (latest.entry_id === lastEntryId) {
                console.log("⏸ No new data");
                return;
            }

            lastEntryId = latest.entry_id;
            console.log("📦 Latest Data:", latest);

            const payload = {
                Voltage: latest.field1,
                Current: latest.field2,
                Power: latest.field3,
                Frequency: latest.field4,
                PF: latest.field5,
                Temperature: latest.field6
            };

            console.log("payload",payload)

            fetch('http://localhost:8000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(prediction => {

                    console.log("prediact",prediction)
                    const updateURL = `https://api.thingspeak.com/update?api_key=${WRITE_API}` +
                        `&field1=${encodeURIComponent(`${payload.Voltage},${prediction.predictions.Voltage_pred}`)}` +
                        `&field2=${encodeURIComponent(`${payload.Current},${prediction.predictions.Current_pred}`)}` +
                        `&field3=${encodeURIComponent(`${payload.Power},${prediction.predictions.Power_pred}`)}` +
                        `&field4=${encodeURIComponent(`${payload.Frequency},${prediction.predictions.Frequency_pred}`)}` +
                        `&field5=${encodeURIComponent(`${payload.PF},${prediction.predictions.PF_pred}`)}` +
                        `&field6=${encodeURIComponent(`${payload.Temperature},${prediction.predictions.Temp_pred}`)}`;

                    fetch(updateURL)
                        .then(res => res.text())
                        .then(result => {
                            console.log("✅ Updated ThingSpeak with prediction | Entry ID:", result);
                        })
                        .catch(err => {
                            console.log("❌ Error updating ThingSpeak:", err);
                        });
                })
                .catch(err => {
                    console.log("❌ Error sending to /predict:", err);
                });
        })
        .catch(err => {
            console.log("❌ Error fetching from ThingSpeak:", err);
        });
}


// Run every 3 seconds
setInterval(fetchAndSendLatest, 3000);

module.exports = ThinkSpeakRouter;
