import os
import asyncio
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def test_usage():
    model_name = os.environ.get("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    
    model = ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1"
    )
    
    messages = [HumanMessage(content="Hello, who are you?")]
    response = await model.ainvoke(messages)
    
    with open('c:/Users/kil/Desktop/prod1/product/scratch/debug_usage.json', 'w', encoding='utf-8') as f:
        json.dump({
            "content": response.content,
            "metadata": response.response_metadata
        }, f, ensure_ascii=False, indent=2)
    
    print("Done writing to file", flush=True)

if __name__ == "__main__":
    asyncio.run(test_usage())
