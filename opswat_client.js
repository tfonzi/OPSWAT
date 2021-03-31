const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

const sleep = require("./utils.js").sleep

const baseUrl = 'https://api.metadefender.com/v4';

const wait_to_scan_again = (percentage, wait_time) => {

    if(percentage === 100){
        return true; //Return true == scan is finished.
      }
      else{
        var count = 0;
        while (count < wait_time){ //Signifies to user that something is happening
          sleep(1000);
          process.stdout.write(".  ");
          count++;
        }
        return false; //Return false == scan again.
      }
}

const throw_error_with_message = (error) => {
    const message = error.messages[0];
    throw Error("Error: " + message);
}

const get_hash_request = async (hashes, apiKey) => {
    const url = `${baseUrl}/hash/`;
   
    const options = {
      method: 'GET',
      headers: {
        'apikey': apiKey
      }
    };

    //Loop through hash values, use request of first successful request -- means Hash Lookup was successful
    const hash_array = [hashes.md5, hashes.sha1, hashes.sha256];
    var request;
    for(var i = 0; i < hash_array.length; i++) {
        request = await fetch(`${url}${hash_array[i]}`, options)
        if (request.status === 200) { //Return data if successful
            break;
        }
    }
    return await request.json(); //Return anyway even if not successful. A failed request could result in File Upload depending on error code.
}

const retrieve_scan_report_via_hashes = async (hashes, apiKey) => {
    
    //This function cycles through hashes to find appropriate scan report data.
    const data = await get_hash_request(hashes, apiKey);
  
    //Error handling
    if(data.error){
      if(data.error.code === 404003){ //404003 error code means that hash could not be found. Return data to be used for file upload.
        return data;
      }
      else{
        throw_error_with_message(data.error)
      }
    }
    else{ //Successfully retrieved scan report.
      return data;
    }
}
  
  
const upload_file = async (filePath, apiKey) => {
  
    if(!fs.existsSync(filePath)){ //Throw Error if file does not exist
        throw Error("Error: File does not Exist");
    }

    //Configuring file data
    const file = fs.createReadStream(filePath);
    var form = new FormData();
    form.setBoundary("----WebKitFormBoundary7MA4YWxkTrZu0gW");
    form.append('file', file);
  
    const url = `${baseUrl}/file`;
    
    const options = {
      method: 'POST',
      headers: {
        'apikey': apiKey
      },
      body: form
    };

    console.log("Starting file upload. Please wait. May take a few minutes for larger files.");
    const request = await fetch(url, options);
    const data = await request.json();
    
    //Error handling
    if(data.error){
        throw_error_with_message(data.error);
    }
    else{
      console.log("File Upload Complete.");
      return data;
    }
}

const retrieve_scan_report_via_data_id = async (data_id, apiKey) => {
  
    const url = `${baseUrl}/file/${data_id}`;
    
    const options = {
      method: 'GET',
      headers: {
        'apikey': apiKey
      }
    };
  
    var request, data;
    var scan_complete = false
  
    while(!scan_complete){ //Loop until scan is complete, check progress every x seconds
        request = await fetch(url, options);
        data = await request.json();

        //Error handling
        if(data.error){
            throw_error_with_message(data.error);
        }

        console.log("\nScan Progress Percentage:", data.scan_results.progress_percentage, "%")
        scan_complete = wait_to_scan_again(data.scan_results.progress_percentage, 10); //Wait 10 seconds until next check
    }
    console.log("Scan Complete.");
    return data;
}
  
module.exports = {retrieve_scan_report_via_hashes, upload_file, retrieve_scan_report_via_data_id};