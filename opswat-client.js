const fetch = require('node-fetch');
const FormData = require('form-data');

const sleep = (milliseconds) => {
    const start_date = Date.now();
    while((Date.now() - start_date) < milliseconds);
}

const baseUrl = 'https://api.metadefender.com/v4';

const get_hash_request = async (hashes, apiKey) => {
    const url = `${baseUrl}/v4/hash/`;
   
    const options = {
      method: 'GET',
      headers: {
        'apikey': apiKey
      }
    };

    hashes.forEach(hash => {
        var request = await fetch(`${url}${hash}`, options)

        if (request.status === 200) {
            return await request.json();
        }
    });
}

const retrieve_scan_report_via_hashes = async (hashes, apiKey) => {
    const data = await get_hash_request(hashes, apiKey);
  
    //Error handling
    if(data.error){
      // 404003 means that the hash could not be found
      if(data.error.code === 404003){
        return data;
      }
      else{
        throw_error_with_message(data.error);
      }
    }
    else{
      return data;
    }
}

const throw_error_with_message(error) => {
    const message = error.messages[0];
    throw Error("Error: " + message);
}
  
const upload_file = async (fileStream, apiKey) => {
  
    if(!fs.existsSync(filePath)){ //Throw Error if file does not exist
        throw Error("Error: File does not Exist");
    }

    const file = fs.createReadStream(filePath);
    console.log("Starting file upload. Please wait. May take a few minutes for larger files.");
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
  
    const request = await fetch(url, options);
    const data = await request.json();
    
    //Error handling
    if(data.error){
      const message = data.error.messages[0];
      throw Error("Error: " + message);
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
      // throw_error_with_message
    }
    else{
      return data;
    }
}

module.exports = {retrieve_scan_report_via_hashes, upload_file, retrieve_scan_report_via_data_id};
