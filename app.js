const prompt = require('prompt-sync')();
require('dotenv').config();

const find_hashes = require("./utils.js").find_hashes
const format_output = require("./utils.js").format_output

const retrieve_scan_report_via_hashes = require("./opswat_client.js").retrieve_scan_report_via_hashes
const upload_file = require("./opswat_client.js").upload_file
const retrieve_scan_report_via_data_id = require("./opswat_client.js").retrieve_scan_report_via_data_id


console.log("Enter the filename (absolute or relative) of the file you'd like to process.");
const filePath = prompt('upload_file ');

find_hashes(filePath).then(hashes => {
  retrieve_scan_report_via_hashes(hashes, process.env.APIKEY).then(report => { //Checking hashes
    if(report.error){ //If an error exists. Should be 404003 since other error codes are handled by the throw-catch
      console.log("Hash was not found.");

      upload_file(filePath, process.env.APIKEY).then(response => { //If no hashes found, upload file

        retrieve_scan_report_via_data_id(response.data_id, process.env.APIKEY).then(report => { //Get scan report via data_id
          console.log("Printing Scan Results:");
          format_output(report);
        }).catch(error => {
          console.log(error.message);
        });

      }).catch(error => {
        console.log(error.message);
      });
    }
    else{ //If there is no error, then scan report retrival via hash lookup was successful.
      console.log("Hash Lookup successful.");
      console.log("Printing Scan Results:");
      format_output(report);
    }
  }).catch(error => {
    console.log(error.message);
  });
}).catch(error => {
  console.log(error.message);
});