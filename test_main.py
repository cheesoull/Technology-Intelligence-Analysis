from fastapi import FastAPI, Request
from autoagent import MetaChain
from pydantic import BaseModel
from typing import Optional
from autoagent.agents import get_dummy_agent

app = FastAPI()


class GenerateRequest(BaseModel):
    prompt: str
    context: Optional[str] = ""
@app.post("/generate")
async def generate_report(data: GenerateRequest):
    print(f"收到生成请求：prompt={data.prompt}")
    mc = MetaChain()
    agent = get_dummy_agent("deepseek-chat")  # 你可以换成别的模型
    messages = [{"role": "user", "content": f"{data.prompt}\n\n{data.context}"}]

    response = mc.run(agent, messages, {}, debug=True)
    return {"report": response.messages[-1]["content"]}
