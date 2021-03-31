const fs = require('fs');
const hasha = require('hasha');

const sleep = (milliseconds) => {
    const start_date = Date.now();
    while((Date.now() - start_date) < milliseconds);
}

const find_hashes = async (filePath) => {
    
    if(!fs.existsSync(filePath)){ //Throw Error if file does not exist
        throw Error("Error: File does not Exist");
    }
    
    var hashes = {};
    hashes.md5 = await hasha.fromFile(filePath, {algorithm: 'md5'});
    hashes.sha1 = await hasha.fromFile(filePath, {algorithm: 'sha1'});
    hashes.sha256 = await hasha.fromFile(filePath, {algorithm: 'sha256'});
  
    //Convert to uppercase to match MetaDefender's hash format
    hashes.md5 = hashes.md5.toUpperCase();
    hashes.sha1 = hashes.sha1.toUpperCase();
    hashes.sha256 = hashes.sha256.toUpperCase();
  
    return hashes;
}

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

module.exports = {find_hashes, format_output, sleep};
