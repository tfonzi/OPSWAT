const prompt = require('prompt-sync')();
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const hasha = require('hasha');
require('dotenv').config();

const sleep = (milliseconds) => {
  const start_date = Date.now();
  while((Date.now() - start_date) < milliseconds);
}

const find_hashes = async (filePath) => {
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

const retrieve_scan_report_via_hashes = async (hashes, apiKey) => {
  const url = 'https://api.metadefender.com/v4/hash/';
 
  const options = {
    method: 'GET',
    headers: {
      'apikey': apiKey
    }
  };

  //Cycle through hashes and go with first one that works
  var success = false;
  var request;

  request = await fetch(`${url}${hashes.md5}`, options); //Try md5
  if(request.status === 200){
    success = true;
  }

  if(success == false){ //Try sha1
    request = await fetch(`${url}${hashes.sha1}`, options); 
    if(request.status === 200){
      success = true;
    }
  }

  if(success == false){ //Try sha256
    request = await fetch(`${url}${hashes.sha256}`, options); 
    if(request.status === 200){
      success = true;
    }
  }

  const data = await request.json();

  //Error handling
  if(data.error){
    if(data.error.code === 404003){ //If code is 404003, do file upload.
      return data;
    }
    else{
      const message = data.error.messages[0];
      throw Error("Error: " + message);
    }
  }
  else{
    return data;
  }
}


const upload_file = async (filePath, apiKey) => {

  const file = fs.createReadStream(filePath);
  console.log("Starting file upload. Please wait. May take a few minutes for larger files.");
  var form = new FormData();
  form.setBoundary("----WebKitFormBoundary7MA4YWxkTrZu0gW");
  form.append('file', file);

  const url = 'https://api.metadefender.com/v4/file';
  
  const options = {
    method: 'POST',
    headers: {
      'apikey': apiKey
    },
    body: form
  };

  const request = await fetch(url, options);
  console.log("File Upload Complete.");
  const data = await request.json();
  
  //Error handling
  if(data.error){
    const message = data.error.messages[0];
    throw Error("Error: " + message);
  }
  else{
    return data;
  }
}

const retrieve_scan_report_via_data_id = async (data_id, apiKey) => {

  const url = `https://api.metadefender.com/v4/file/${data_id}`;
  
  const options = {
    method: 'GET',
    headers: {
      'apikey': apiKey
    }
  };

  var request;
  var data;

  while(true){ //Loop until scan is complete, check progress every 10 seconds
    request = await fetch(url, options);
    data = await request.json();
    console.log("\nScan Progress Percentage:", data.scan_results.progress_percentage, "%")
    if(data.scan_results.progress_percentage === 100){
      break;
    }
    else{ //Wait 10 seconds
      var count = 0;
      while (count < 10){ //Show user something is happening
        sleep(1000);
        process.stdout.write(".  ");
        count++;
      }
    }
    
  }
  console.log("Scan Complete.");

  //Error handling
  if(data.error){
    const message = data.error.messages[0];
    throw Error("Error: " + message);
  }
  else{
    return data;
  }
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