import React ,{useState} from "react";
import axios from "axios";

function UploadResume(){
    const API="http://localhost:5000/"
    const [response, setResponse] = useState("");
    const handleSubmit=async(event)=>{
        event.preventDefault();
        const file=event.target.file.files[0];
        if(!file){
            alert("Please Upload a File");
            return;
        }

        const formData=new FormData();
        formData.append("file",file);

        try{
            const res=await axios.post(`${API}parse-pdf`,formData);
            setResponse(res.data.text);
        }catch(error){
            console.error("Erro Uploading File",error);
            alert("Upload failed check console");
        }
        
    };


    return(
        <div>
            <form onSubmit={handleSubmit}>
             <h1>Upload Your Resume</h1>
            <input name="file" type="file"  />
            <button type="submit">Submit</button>
            </form>
            {response && (
        <div style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}>
          <h2>Parsed Text:</h2>
          <p>{response}</p>
        </div>
      )}
        </div>
    );
}

export default UploadResume;