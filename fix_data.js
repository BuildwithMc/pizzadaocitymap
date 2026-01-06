
import fs from 'fs';

const filePath = './src/cities.json';
let raw = fs.readFileSync(filePath, 'utf8');
const trimmed = raw.trim();

// Fix truncation
if (!trimmed.endsWith(']')) {
    console.log('File is truncated. Tail:', JSON.stringify(raw.slice(-20)));

    // Check for the specific known breakage: "Party-Drive-Link": "
    if (trimmed.endsWith('"Party-Drive-Link": "')) {
        // The last char is ", which is the OPENING quote of the value.
        // We need to CLOSE it with ONE quote.
        raw = trimmed + '"\n  }\n]';
    } else {
        // Unknown, log and try generic close if possible or fail
        console.log('Unknown truncation pattern.');
        // Try to close string if open?
        // Let's just try to be safe: 
        raw = trimmed + '"\n  }\n]';
    }
    console.log('Patched tail:', JSON.stringify(raw.slice(-20)));
}

try {
    const data = JSON.parse(raw);

    // Normalize keys
    const fixedData = data.map(city => {
        return {
            city: city.city,
            country: city.country,
            region: city.region,
            host: city.host || "Unknown",
            telegram: city.telegram || "",
            // Normalize
            event_registration_link: city['CITY-REGISTARTION-LINK'] || city.event_registration_link || "",
            drive_link: city['Party-Drive-Link'] || city.drive_link || "",
            coordinates: city.coordinates || [0, 0],
            status: city.status || "Announced"
        };
    });

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(fixedData, null, 2));
    console.log('Fixed cities.json with ' + fixedData.length + ' entries.');

} catch (e) {
    console.error('Failed to parse JSON:', e.message);
}
