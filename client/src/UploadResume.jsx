import React ,{useState} from "react";
import axios from "axios";

function UploadResume(){
    const API="http://localhost:5000/"
    const [response, setResponse] = useState("");
    const [info,setInfo]=useState({email: "",phone: ""});
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
            const extractedText=res.data.text;
            setResponse(extractedText);

             const aiRes = await axios.post(`${API}ai-extract`, { text:extractedText });
      setInfo(aiRes.data.extracted);
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
        {info && (
  <div style={{ marginTop: "20px" }}>
    <h2>Extracted Info:</h2>
    <p><strong>Name:</strong> {info.name || "Not found"}</p>
    <p><strong>Email:</strong> {info.email || "Not found"}</p>
    <p><strong>Phone:</strong> {info.phone || "Not found"}</p>
    <p><strong>Skills:</strong> {Array.isArray(info.skills) ? info.skills.join(", ") : info.skills || "Not found"}</p>
    <p><strong>Education:</strong> {info.education || "Not found"}</p>
    <p><strong>Experience:</strong> {info.experience || "Not found"}</p>
  </div>
)}
        </div>
    );
}

export default UploadResume;