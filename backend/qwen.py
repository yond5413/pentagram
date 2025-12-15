import modal
import io
from fastapi import Response, HTTPException, Query, Request
from datetime import datetime, timezone
import requests
import os
'''
-MODAL endpoints like fastapi under the hood
'''
def download_model():
    from diffusers import  DiffusionPipeline
    import torch
    DiffusionPipeline.from_pretrained(
            "Qwen/Qwen-Image",
            torch_dtype = torch.bfloat16)
    
## MODAL stuff
image = (modal.Image.debian_slim()
        .pip_install("fastapi[standard]","transformers","accelerate","diffusers","requests") 
        .run_function(download_model))
# docker container above
app = modal.App("sd-demo",image=image)

@app.cls(
    image=image,
    gpu="A10G",
    secrets=[modal.Secret.from_name("API_KEY")] 
)
## MUST SET API KEY IN MODAL DASHBOARD
class Model:
    @modal.enter()
    def load_weights(self):
        from diffusers import DiffusionPipeline
        import torch
        self.pipe =  DiffusionPipeline.from_pretrained(
            "Qwen/Qwen-Image",
            torch_dtype = torch.bfloat16)
        
        self.pipe.to("cuda")
        self.API_KEY= os.environ["API_KEY"]

    @modal.fastapi_endpoint(docs = True)
    def generate(self,request: Request,prompt: str = Query(...,description="The prompt for image generation")):
        api_key = request.headers.get("X-API-Key")
        if api_key != self.API_KEY:
            raise HTTPException(
                status_code = 401,
                detail="Unauthorized"
            )
        image = self.pipe(prompt,num_inference_steps=1,guidance_scale=0.0).images[0]
        buffer = io.BytesIO()
        image.save(buffer,format="JPEG")
        return Response(content=buffer.getvalue(),media_type="image/jpeg")
    @modal.fastapi_endpoint(docs = True)
    def health(self):
        return {"status":"healthy",
        "timestamp":datetime.now(timezone.utc).isoformat()}

@app.function(
    schedule = modal.Cron("*/5 * * * *"),
    secrets=[modal.Secret.from_name("API_KEY")]
)
def keep_warm():
    health_url="https://yd2696--sd-demo-model-health.modal.run/health"
    generate_url = "https://yd2696--sd-demo-model-generate.modal.run" 

    health_response = requests.get(health_url)
    print(f"Health check at: {health_response.json()["timestamp"]}")

    headers = {"X-API-Key":os.environ["API_KEY"]}
    generate_response = requests.get(generate_url,headers=headers)
    print(f"Generate endpoint tested succesfully at: {datetime.now(timezone.utc).isoformat()}")
