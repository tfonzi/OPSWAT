const prompt = require('prompt-sync')();
require('dotenv').config();

const find_hashes = require("./controllers.js").find_hashes
const retrieve_scan_report_via_hashes = require("./controllers.js").retrieve_scan_report_via_hashes
const upload_file = require("./controllers.js").upload_file
const retrieve_scan_report_via_data_id = require("./controllers.js").retrieve_scan_report_via_data_id

const format_output = (scan_report) => {
  
  //Append filename and overall status to beginning
  var output_string = "\nfilename: " + scan_report.file_info.display_name + "\noverall_status: " + scan_report.scan_results.scan_all_result_a;

  const scanDetails = scan_report.scan_results.scan_details;
  Object.keys(scanDetails).map(key => { //Adding results from each engine onto the output string
    const engine_results = scanDetails[key];
    output_string = output_string + 
    "\nengine: " + key +
    "\nthreat_found: " + engine_results.threat_found +
    "\nscan_result: " + engine_results.scan_result_i + 
    "\ndef_time: " + engine_results.def_time;
  });

  //Append "END" statement
  output_string = output_string + "\nEND";

  console.log(output_string);
}

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


module.exports = {find_hashes};
